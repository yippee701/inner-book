/**
 * 正文图生成：将长正文渲染到底图上，支持自动分页
 * 使用 node-canvas 在服务端绘制
 * Node 20+ ESM 模块（.mjs）
 *
 * 输入：content（正文，支持 <br> 换行）、底图编号
 * 输出：750*1004 的 JPG，单张为 Buffer，多张为 Buffer[]（按顺序编号）
 */

import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIDTH = 750;
const HEIGHT = 1004;
const CONTENT_MAX_WIDTH = 640; 
/** 正文区域左边距（左对齐时的 x） */
const CONTENT_LEFT = (WIDTH - CONTENT_MAX_WIDTH) / 2;
const CONTENT_FONT_SIZE = 28;
const LINE_HEIGHT = 48;
/** 每行文字 + 下方空行 共占高度 */
const LINE_SLOT = LINE_HEIGHT;
/** 字符间距（像素），逐字绘制时在字宽基础上多加的间距 */
const LETTER_SPACING = 2;
const NORMAL_COLOR = '#1a1a1a';

/** 正文默认字体：阿里巴巴普惠体，需在 createCanvas 之前注册 */
const FONTS_DIR = path.join(__dirname, 'fonts');
const CONTENT_FONT_FAMILY = 'Alibaba PuHuiTi';
const CONTENT_FONT_PATH = path.join(FONTS_DIR, 'AlibabaPuHuiTi-3-55-Regular.otf');
let contentFontRegistered = false;

function ensureContentFont() {
  if (contentFontRegistered) return;
  try {
    if (fs.existsSync(CONTENT_FONT_PATH)) {
      registerFont(CONTENT_FONT_PATH, { family: CONTENT_FONT_FAMILY, weight: 'normal', style: 'normal' });
      contentFontRegistered = true;
    }
  } catch (_) {}
}

function getContentFont() {
  if (contentFontRegistered) {
    return `${CONTENT_FONT_SIZE}px "${CONTENT_FONT_FAMILY}"`;
  }
  return `${CONTENT_FONT_SIZE}px sans-serif`;
}

/** 正文区域固定上边距、下边距 */
const TOP_MARGIN = 70;   
const BOTTOM_MARGIN = 70; 
/** 内容区可用高度 */
const CONTENT_HEIGHT = HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;

/** 行首不允许的标点（会合并到上一行末尾） */
const LEADING_PUNCTUATION_REGEX = /^[。，、；：！？．·…,.;:!?)\]）】\'\"\"\'\s]+/;

/** 计算一行带字间距的总宽度 */
function measureLineWidth(ctx, text) {
  if (!text) return 0;
  return ctx.measureText(text).width + (text.length - 1) * LETTER_SPACING;
}

/**
 * 若某行以标点开头，避免标点单独在行首：若上一行加标点不超宽则把标点合并到上一行末尾；否则只把上一行最后一个字挪到当前行开头（不调整文字顺序，标点仍留在当前行）。
 */
function moveLeadingPunctuationToPreviousLine(lineItems, ctx, maxWidth) {
  ctx.font = getContentFont();
  for (let i = 1; i < lineItems.length; i++) {
    const curr = lineItems[i].text;
    const m = curr.match(LEADING_PUNCTUATION_REGEX);
    if (!m || !m[0]) continue;
    const punct = m[0];
    const rest = curr.slice(punct.length);
    const prevItem = lineItems[i - 1];
    if (!prevItem.text) continue;
    const prevText = prevItem.text;
    if (measureLineWidth(ctx, prevText + punct) <= maxWidth) {
      // 上一行加标点不超宽：标点合并到上一行末尾
      prevItem.text = prevText + punct;
      lineItems[i].text = rest;
    } else {
      // 上一行加标点会超宽：只把上一行最后一个字挪到当前行开头，标点不动，保证当前行不以标点开头且不改变文字顺序
      const lastCh = prevText.slice(-1);
      prevItem.text = prevText.slice(0, -1);
      lineItems[i].text = lastCh + curr;
    }
  }
}

/**
 * 仅允许 <br> 换行，其余尖括号转义以防 XSS
 */
function sanitizeContent(raw) {
  if (typeof raw !== 'string') return '';
  let s = raw
    .replace(/\\n/g, '\n')  // 把字面的 \n 转成真正换行
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/br>/gi, '\n');
  s = s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return s;
}

/**
 * 将正文解析为行列表：按 \n 分段落，再按 maxWidth 自动换行；段落结尾行带 extraBlankAfter（换行时加多一个空行）
 * @returns {{ text: string, extraBlankAfter?: boolean }[]}
 */
function contentToLines(content, ctx, maxWidth) {
  const s = sanitizeContent(content);
  ctx.font = getContentFont();
  const lines = [];
  const paragraphs = s.split('\n');
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      lines.push({ text: '', extraBlankAfter: false });
      continue;
    }
    const chars = [...trimmed];
    let run = '';
    for (const ch of chars) {
      const testRun = run + ch;
      const w = ctx.measureText(testRun).width + (testRun.length - 1) * LETTER_SPACING;
      if (w <= maxWidth) {
        run = testRun;
      } else {
        if (run) {
          lines.push({ text: run, extraBlankAfter: false });
          run = '';
        }
        run = ch;
      }
    }
    if (run) lines.push({ text: run, extraBlankAfter: true });
  }
  return lines;
}

/** 单行占高：文字行 + 一空行；若 extraBlankAfter 则再加一空行 */
function getLineSlotHeight(item) {
  return LINE_SLOT + (item.extraBlankAfter ? 0 : 0);
}

/** 按固定上下边距与每行占高，将行列表分页 */
function paginateLines(lineItems) {
  const pages = [];
  let currentPage = [];
  let usedHeight = 0;
  for (const item of lineItems) {
    const h = getLineSlotHeight(item);
    if (currentPage.length > 0 && usedHeight + h > CONTENT_HEIGHT) {
      pages.push(currentPage);
      currentPage = [];
      usedHeight = 0;
    }
    currentPage.push(item);
    usedHeight += h;
  }
  if (currentPage.length > 0) pages.push(currentPage);
  return pages;
}

/**
 * 根据底图编号解析背景图路径或 base64
 */
function getBackgroundImageSource(bgId) {
  const id = String(bgId ?? '2').replace(/[^0-9a-zA-Z_-]/g, '');
  const base = path.join(__dirname, 'backgrounds');
  const filePath = path.join(base, `${id || '2'}.jpg`);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath);
  }
  if (id !== '1' && fs.existsSync(path.join(base, '1.jpg'))) {
    return fs.readFileSync(path.join(base, '1.jpg'));
  }
  return null;
}

/**
 * 绘制一页：背景 + 指定行列表，固定上边距，左对齐；每行后留空行，段落结尾加多一空行
 */
async function drawOnePage(bgSource, lineItems, ctx) {
  const bgImage = await loadImage(bgSource);
  ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  let y = TOP_MARGIN + LINE_HEIGHT / 2;

  ctx.font = getContentFont();
  ctx.fillStyle = NORMAL_COLOR;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  for (const item of lineItems) {
    let x = CONTENT_LEFT;
    for (const ch of item.text) {
      ctx.fillText(ch, x, y);
      x += ctx.measureText(ch).width + LETTER_SPACING;
    }
    y += getLineSlotHeight(item);
  }
}

/**
 * 主入口：生成正文图（单张或多张）
 * @param {Object} params
 * @param {string} params.content - 正文，<br> 换行
 * @param {string|number} [params.bgId=2] - 底图编号
 * @param {string} [params.backgroundBase64] - 底图 base64（可选）
 * @param {string} [params.output='buffer'] - 'buffer' | 'base64' | 'dataURL'
 * @returns {Promise<Buffer|Buffer[]|string|string[]>} 单页为 Buffer/string，多页为数组
 */
export async function generateTextImage({ content, bgId = 2, backgroundBase64, output = 'buffer' }) {
  let bgSource = null;
  if (backgroundBase64 && typeof backgroundBase64 === 'string') {
    bgSource = Buffer.from(backgroundBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  }
  if (!bgSource) {
    bgSource = getBackgroundImageSource(bgId);
  }
  if (!bgSource || !bgSource.length) {
    throw new Error(`底图不存在: ${bgId}，请将底图放到 scf/backgrounds/${bgId}.jpg 或传入 backgroundBase64`);
  }

  ensureContentFont();
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  const allLineItems = contentToLines(content || '', ctx, CONTENT_MAX_WIDTH);
  moveLeadingPunctuationToPreviousLine(allLineItems, ctx, CONTENT_MAX_WIDTH);
  const pages = paginateLines(allLineItems);

  const buffers = [];
  for (let i = 0; i < pages.length; i++) {
    const c = i === 0 ? canvas : createCanvas(WIDTH, HEIGHT);
    const cctx = i === 0 ? ctx : c.getContext('2d');
    await drawOnePage(bgSource, pages[i], cctx);
    buffers.push(c.toBuffer('image/jpeg', { quality: 1 }));
  }

  const toOutput = (buf) => {
    if (output === 'dataURL') return `data:image/jpeg;base64,${buf.toString('base64')}`;
    if (output === 'base64') return buf.toString('base64');
    return buf;
  };

  if (buffers.length === 1) {
    return toOutput(buffers[0]);
  }
  return buffers.map(toOutput);
}

// 直接运行时的 CLI 入口（Node 20 ESM 下通过 import.meta 判断）
const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  const args = process.argv.slice(2);
  const content = args[0] || '示例正文内容。\n第二段。';
  const bgId = args[1] || '2';
  generateTextImage({ content, bgId })
    .then((result) => {
      const list = Array.isArray(result) ? result : [result];
      list.forEach((buf, i) => {
        const name = list.length > 1 ? `output-text-${i + 1}.jpg` : 'output-text.jpg';
        const out = path.join(__dirname, name);
        fs.writeFileSync(out, buf);
        console.log('已生成:', out);
      });
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
