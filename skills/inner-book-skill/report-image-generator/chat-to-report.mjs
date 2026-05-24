/**
 * 通过 LLM 对话生成最终报告内容
 * - 提问者：调用 inner-book 聊天接口 (https://inner-book.top/chat)
 * - 回答者：后续轮次调用回答者接口 (stream: true)
 * - 最多 10 轮；当回答中出现 [Report] 时提取报告并写入 report-content.md
 * - 每步成功后写入同目录 chat-checkpoint.json；中途失败后再次运行会自动从断点继续。
 *   若要重新从头跑，删除 chat-checkpoint.json 即可。
 *
 * 运行：node chat-to-report.mjs "<回答者系统提示词>" [INNER_BOOK_TOKEN]
 * 环境变量：ANSWER_API_KEY（必填）、INNER_BOOK_CHAT_TOKEN（或第 2 个参数传入）等
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- 配置（部分可从 runChatToReport options / CLI 覆盖）----------
const INNER_BOOK_CHAT_URL = process.env.INNER_BOOK_CHAT_URL || 'https://inner-book.top/chat';
const CHAT_MODE = process.env.CHAT_MODE || 'discover-self';

const ANSWER_API_URL = process.env.ANSWER_API_URL || 'https://sg.uiuiapi.com/v1/chat/completions';
const ANSWER_API_KEY = process.env.ANSWER_API_KEY || '';
const ANSWER_MODEL = 'gemini-3-flash-preview';

const MAX_ROUNDS = 11;
const REPORT_CONTENT_PATH = path.join(__dirname, 'report-content.md');
const CHECKPOINT_PATH = path.join(__dirname, 'chat-checkpoint.json');

/**
 * 加载断点（存在则返回 { answerPrompt, innerBookToken, questionMessages, answerMessages, round, nextStep }，否则 null）
 */
function loadCheckpoint() {
  try {
    const raw = fs.readFileSync(CHECKPOINT_PATH, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data.questionMessages) || !Array.isArray(data.answerMessages)) return null;
    return {
      answerPrompt: data.answerPrompt ?? '',
      innerBookToken: data.innerBookToken ?? '',
      questionMessages: data.questionMessages,
      answerMessages: data.answerMessages,
      round: typeof data.round === 'number' ? data.round : 0,
      nextStep: data.nextStep === 'answerer' ? 'answerer' : 'questioner',
    };
  } catch {
    return null;
  }
}

/**
 * 保存断点（每步成功后调用）
 */
function saveCheckpoint(state) {
  try {
    fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify({
      ...state,
      lastUpdated: new Date().toISOString(),
    }, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[chat-to-report] 断点保存失败:', e.message);
  }
}

/**
 * 清除断点（报告生成完成或主动重新开始时）
 */
function clearCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_PATH)) fs.unlinkSync(CHECKPOINT_PATH);
  } catch (_) {}
}

/**
 * 提问者：调用 inner-book 聊天接口（流式输出，与回答者同格式解析）
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @param {string} [token] 鉴权 token，不传则用环境变量 INNER_BOOK_CHAT_TOKEN
 * @returns {Promise<string>} 提问者（模型）的下一句
 */
export async function getQuestionerReply(messages, token) {
  const authToken = (token ?? process.env.INNER_BOOK_CHAT_TOKEN ?? '').trim();
  if (!authToken) {
    throw new Error('未配置提问者鉴权：请设置 INNER_BOOK_CHAT_TOKEN 或通过 argv[3] / options.innerBookToken 传入');
  }
  const res = await fetch("https://inner-book.top/chat", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "authorization": `Bearer ${authToken}`,
      "cache-control": "no-cache",
      "content-type": "application/json",
      "pragma": "no-cache",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "Referer": "https://inner-book.top/"
    },
    "body": JSON.stringify({
      mode: CHAT_MODE,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }),
    "method": "POST"
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `提问者接口失败: ${res.status}`);
  }

  return readStreamContent(res);
}

/**
 * 从单条 SSE/JSON 里取出 content，兼容多种大模型流式格式（含豆包/火山等）
 * @param {object} parsed
 * @returns {string}
 */
function extractChunkContent(parsed) {
  if (!parsed || typeof parsed !== 'object') return '';

  // 先尝试 result 包装（部分接口返回 { result: { choices: [...] } }）
  const root = parsed.result != null ? parsed.result : parsed;

  const c = root.choices?.[0];
  if (c?.delta?.content) return c.delta.content;
  if (c?.message?.content) return c.message.content;
  if (typeof root.content === 'string') return root.content;
  if (typeof root.text === 'string') return root.text;
  if (root.delta?.content) return root.delta.content;
  // 豆包/火山等：可能直接在顶层或 message 里
  if (typeof parsed.content === 'string') return parsed.content;
  if (typeof parsed.text === 'string') return parsed.text;
  if (parsed.delta?.content) return parsed.delta.content;
  // 兼容 data 包装
  const data = root.data ?? parsed.data;
  if (data?.choices?.[0]?.delta?.content) return data.choices[0].delta.content;
  if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
  if (typeof data?.content === 'string') return data.content;
  // Gemini / 部分接口: candidates[0].content.parts[0].text
  const cand = root.candidates?.[0] ?? parsed.candidates?.[0];
  const parts = cand?.content?.parts;
  if (Array.isArray(parts) && parts[0]?.text) return parts[0].text;
  if (cand?.content?.parts?.[0]?.text) return cand.content.parts[0].text;
  // output / reply / message 等字段
  if (typeof root.output === 'string') return root.output;
  if (typeof parsed.output === 'string') return parsed.output;
  if (typeof root.reply === 'string') return root.reply;
  if (root.message?.content) return root.message.content;
  return '';
}

/**
 * 判断是否为「已知的」流式 chunk 结构（已处理过，仅 content 为空），避免误报未识别
 */
function isKnownChunkStructure(parsed) {
  if (!parsed || typeof parsed !== 'object') return false;
  const root = parsed.result != null ? parsed.result : parsed;
  if (root.choices?.[0] != null) return true; // OpenAI 系：choices[0].delta / .message
  if (Array.isArray(root.choices) || root.usage != null) return true; // 空 choices[] 或结尾 usage chunk
  if (root.candidates?.[0] != null) return true; // Gemini 系
  if (Array.isArray(root.candidates)) return true;
  if (parsed.data?.choices != null) return true;
  return false;
}

/**
 * 从一行中解析出所有 data: 后的 JSON（同一行可能连续多个 data: {...}）
 * @param {string} line
 * @returns {string[]} 每段可 parse 的 JSON 字符串
 */
function splitDataLines(line) {
  const out = [];
  let rest = line.trim();
  if (rest.startsWith('data:')) rest = rest.slice(5).trim();
  if (!rest || rest === '[DONE]') return out;
  const parts = rest.split(/\s*data:\s*/);
  for (const p of parts) {
    const s = p.trim();
    if (s && s !== '[DONE]') out.push(s);
  }
  return out;
}

/**
 * 解析 SSE 流（支持 data: 行、NDJSON、同一行多个 data:、以及无前缀的纯 JSON 行）
 * @param {Response} res
 * @returns {Promise<string>}
 */
export async function readStreamContent(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullContent = '';
  let buffer = '';

  const parseAndAppend = (dataStr) => {
    if (!dataStr || dataStr === '[DONE]') return;
    try {
      const parsed = JSON.parse(dataStr);
      const chunk = extractChunkContent(parsed);
      fullContent += chunk;
    } catch (_) {}
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const toParse = trimmed.startsWith('data:') ? splitDataLines(trimmed) : [trimmed];
      for (const data of toParse) {
        parseAndAppend(data);
      }
    }
  }

  // 剩余 buffer：可能是半行或完整一行
  if (buffer.trim()) {
    const trimmed = buffer.trim();
    const toParse = trimmed.startsWith('data:') ? splitDataLines(trimmed) : [trimmed];
    for (const data of toParse) {
      parseAndAppend(data);
    }
  }

  return fullContent;
}

/**
 * 回答者：第一轮固定开场白，后续调用 openclaw 接口（stream: true）
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @param {number} round 当前轮次（1-based）
 * @param {string} answerPrompt 系统提示词（CLI 参数或调用时传入）
 * @returns {Promise<string>} 回答者的下一句
 */
export async function getAnswererReply(messages, round, answerPrompt) {
  if (!ANSWER_API_KEY) {
    throw new Error('未配置 ANSWER_API_KEY，无法调用回答者接口');
  }

  const apiMessages = [
    { role: 'system', content: answerPrompt || '{{ANSWER_PROMPT_PLACEHOLDER}}' },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch(ANSWER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANSWER_API_KEY}`,
    },
    body: JSON.stringify({
      model: ANSWER_MODEL,
      stream: true,
      messages: apiMessages,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || err.detail || `回答者接口失败: ${res.status}`);
  }

  return readStreamContent(res);
}

/**
 * 从回答中提取 [Report]...[/Report] 或 [Report]... 的正文
 */
export function extractReportContent(reply) {
  if (!reply || !reply.includes('[Report]')) return null;
  const start = reply.indexOf('[Report]');
  const afterStart = reply.slice(start + '[Report]'.length);
  const endTag = '[/Report]';
  const endIdx = afterStart.includes(endTag) ? afterStart.indexOf(endTag) : afterStart.length;
  return afterStart.slice(0, endIdx).trim();
}

/**
 * 执行最多 10 轮对话，遇到 [Report] 时提取并写入 report-content.md
 * 每步成功后写入 chat-checkpoint.json；失败后再次运行会自动从断点继续。
 * 若要从头开始，删除 chat-checkpoint.json 或传入 options.resume = false。
 *
 * @param {{ answerPrompt?: string, innerBookToken?: string, resume?: boolean }} [options]
 * @returns {Promise<string|null>}
 */
export async function runChatToReport(options = {}) {
  const resumeFromCheckpoint = options.resume !== false;
  let answerPrompt = options.answerPrompt ?? process.argv[2] ?? '{{ANSWER_PROMPT_PLACEHOLDER}}';
  let innerBookToken = options.innerBookToken ?? process.argv[3] ?? process.env.INNER_BOOK_CHAT_TOKEN ?? '';
  let questionMessages = [{ role: 'user', content: '开始' }];
  let answerMessages = [];
  let round = 0;
  /** 下一步要执行的是 'questioner' 还是 'answerer'（断点恢复时可能停在回答者前） */
  let nextStep = 'questioner';

  const checkpoint = resumeFromCheckpoint ? loadCheckpoint() : null;
  if (checkpoint) {
    answerPrompt = checkpoint.answerPrompt || answerPrompt;
    innerBookToken = checkpoint.innerBookToken || innerBookToken;
    questionMessages = checkpoint.questionMessages;
    answerMessages = checkpoint.answerMessages;
    round = checkpoint.round;
    nextStep = checkpoint.nextStep;
    console.log('[chat-to-report] 从断点恢复: round=%d, nextStep=%s', round, nextStep);
  }

  while (round < MAX_ROUNDS) {
    if (nextStep === 'questioner') {
      const questionerReply = await getQuestionerReply(questionMessages, innerBookToken);
      questionMessages.push({ role: 'assistant', content: questionerReply });
      answerMessages.push({ role: 'user', content: questionerReply });
      saveCheckpoint({ answerPrompt, innerBookToken, questionMessages, answerMessages, round, nextStep: 'answerer' });
      console.log('question:', questionerReply);

      const reportBodyFromQuestion = extractReportContent(questionerReply);
      if (reportBodyFromQuestion) {
        clearCheckpoint();
        fs.writeFileSync(REPORT_CONTENT_PATH, reportBodyFromQuestion, 'utf-8');
        console.log('[chat-to-report] 已从提问者回复提取报告并写入:', REPORT_CONTENT_PATH);
        return reportBodyFromQuestion;
      }
    }

    const answererReply = await getAnswererReply(answerMessages, round + 1, answerPrompt);
    answerMessages.push({ role: 'assistant', content: answererReply });
    questionMessages.push({ role: 'user', content: answererReply });
    round += 1;
    nextStep = 'questioner';
    saveCheckpoint({ answerPrompt, innerBookToken, questionMessages, answerMessages, round, nextStep });
    console.log('answer:', answererReply);
  }

  clearCheckpoint();
  console.warn('[chat-to-report] 已达最大轮次，未发现 [Report]');
  return null;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runChatToReport()
    .then((out) => (out ? process.exit(0) : process.exit(1)))
    .catch((err) => {
      console.error('[chat-to-report]', err.message || err);
      process.exit(1);
    });
}
