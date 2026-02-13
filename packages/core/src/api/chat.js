/**
 * Chat API - 支持两种调用方式
 * 1. proxy - 通过 Python 后端代理（推荐，不暴露 API KEY）
 * 2. direct - 直接调用大模型 API（需要在前端配置 API KEY）
 */

import { mockSendMessage } from './mockData.js';
import { getCurrentUserToken } from '../utils/user.js';
import { request } from '../utils/request.js';
import { getAdapter } from '../adapters/index.js';

// 聊天模式（从 constants 重新导出，保持兼容）
export { CHAT_MODES } from '../constants/modes.js';

/** 获取环境变量的辅助函数 */
function env(key) {
  const envAdapter = getAdapter('env');
  return envAdapter?.get(key);
}

// Mock 模式：当显式设置 MOCK_MODE=true 时启用
export function isMockMode() {
  return env('MOCK_MODE') === 'true';
}

// 为兼容性保留
export const IS_MOCK_MODE = false; // 运行时由 isMockMode() 判断

function getProxyServerUrl() {
  return env('SERVER_URL') || 'http://localhost:80';
}

/**
 * 聊天预热：请求聊天服务健康检查接口
 */
export function chatWarmup() {
  const token = getCurrentUserToken();

  return request('https://inner-book.top/chat/health', {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  }).then(() => {});
}

/**
 * 打字机效果 - 逐字显示文本
 */
export function typewriterEffect(text, onUpdate, speed = 30) {
  return new Promise((resolve) => {
    let index = 0;
    const interval = setInterval(() => {
      index++;
      onUpdate(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
        resolve(text);
      }
    }, speed);
  });
}

async function sendMessageViaProxy(messages, onStream = null, mode) {
  const token = getCurrentUserToken();
  const response = await request(`https://inner-book.top/chat`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      mode,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream: !!onStream,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API 请求失败: ${response.status}`);
  }

  if (onStream) {
    return handleStreamResponse(response, onStream);
  }

  const data = await response.json();
  return data.content || '抱歉，我暂时无法回应。';
}

/**
 * 处理 SSE 流式响应
 */
async function handleStreamResponse(response, onStream) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullContent = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;
      
      const data = trimmedLine.slice(5).trim();
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          onStream(fullContent);
        }
      } catch {
        // 忽略解析错误
      }
    }
  }

  // 处理缓冲区剩余数据
  if (buffer.trim()) {
    const trimmedLine = buffer.trim();
    if (trimmedLine.startsWith('data:')) {
      const data = trimmedLine.slice(5).trim();
      if (data && data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            onStream(fullContent);
          }
        } catch {
          // 忽略
        }
      }
    }
  }

  return fullContent;
}

/**
 * 发送消息（自动选择模式）
 * @param {Array} messages - 对话历史 [{role: 'user'|'assistant', content: string}]
 * @param {Function} onStream - 流式输出回调（可选）
 * @param {string} mode - 聊天模式：'discover-self' | 'understand-others'
 * @returns {Promise<string>} AI 回复内容
 */
export async function sendMessage(messages, onStream = null, mode = 'discover-self') {
  if (isMockMode()) {
    console.log(`[Mock Mode] 使用模拟数据 (${mode})，未调用真实 API`);
    return mockSendMessage(messages, onStream, mode);
  }

  try {
    console.log(`[Proxy Mode] 通过后端代理调用 (${mode})`);
    return await sendMessageViaProxy(messages, onStream, mode);
  } catch (error) {
    console.error('API 调用失败:', error);
    throw error;
  }
}

/**
 * 发送消息并使用打字机效果显示（备用方案）
 */
export async function sendMessageWithTypewriter(messages, onUpdate, typingSpeed = 25, mode = 'discover-self') {
  if (isMockMode()) {
    console.log(`[Mock Mode] 使用模拟数据 (${mode})，未调用真实 API`);
    return mockSendMessage(messages, onUpdate, mode);
  }

  try {
    const response = await request(`${getProxyServerUrl()}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API 请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.content || '抱歉，我暂时无法回应。';
    
    await typewriterEffect(content, onUpdate, typingSpeed);
    
    return content;
  } catch (error) {
    console.error('API 调用失败:', error);
    throw error;
  }
}
