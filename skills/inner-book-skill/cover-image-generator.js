/**
 * 封面图生成云函数
 * 使用 node-canvas 在服务端绘制，不依赖浏览器/html2canvas
 *
 * 输入：title（支持 <s></s> 高亮、<br> 换行）、底图编号
 * 输出：750*1004 的 JPG Buffer
 */

const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

const WIDTH = 750;
const HEIGHT = 1004;
const TITLE_MAX_WIDTH = 680;
const TITLE_FONT_SIZE = 64;
const TITLE_LINE_HEIGHT = 82;
const NORMAL_COLOR = '#1a1a1a';
const HIGHLIGHT_COLOR = '#CD2B5C'; // 紫色

// 思源宋体：字体文件需放在 scf/fonts/ 下（Regular + Bold）
const FONTS_DIR = path.join(__dirname, 'fonts');
const TITLE_FONT_FAMILY = 'Source Han Serif CN';
let titleFontRegistered = false;

function ensureTitleFont() {
  if (titleFontRegistered) return;
  const regular = path.join(FONTS_DIR, 'SourceHanSerifCN-Regular.otf');
  const bold = path.join(FONTS_DIR, 'SourceHanSerifCN-Bold.otf');
  try {
    if (fs.existsSync(regular)) {
      registerFont(regular, { family: TITLE_FONT_FAMILY, weight: 'normal', style: 'normal' });
    }
    if (fs.existsSync(bold)) {
      registerFont(bold, { family: TITLE_FONT_FAMILY, weight: 'bold', style: 'normal' });
    }
    if (fs.existsSync(regular) || fs.existsSync(bold)) titleFontRegistered = true;
  } catch (_) {}
}

function getTitleFont(highlight) {
  if (titleFontRegistered) {
    return highlight
      ? `bold ${TITLE_FONT_SIZE}px "${TITLE_FONT_FAMILY}"`
      : `bold ${TITLE_FONT_SIZE}px "${TITLE_FONT_FAMILY}"`;
  }
  return highlight
    ? `bold ${TITLE_FONT_SIZE}px sans-serif`
    : `${TITLE_FONT_SIZE}px sans-serif`;
}

// 仅允许 <s>、</s>、<br>（换行），其余尖括号转义以防 XSS
const S_OPEN = '\x00SOPEN\x00';
const S_CLOSE = '\x00SCLOSE\x00';

function sanitizeTitle(raw) {
  if (typeof raw !== 'string') return '';
  let s = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/<s>/gi, S_OPEN)
    .replace(/<\/s>/gi, S_CLOSE)
    // <br>、<br/>、<br />、</br> 转为换行
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/br>/gi, '\n');
  s = s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  s = s.split(S_OPEN).join('<s>').split(S_CLOSE).join('</s>');
  return s;
}

/**
 * 解析标题为片段列表：{ text: string, highlight: boolean }[]
 */
function parseTitle(title) {
  const s = sanitizeTitle(title);
  const segments = [];
  let i = 0;
  while (i < s.length) {
    const nextOpen = s.indexOf('<s>', i);
    const nextClose = s.indexOf('</s>', i);
    const next = nextOpen === -1 && nextClose === -1
      ? s.length
      : nextClose === -1
        ? nextOpen
        : nextOpen === -1
          ? nextClose
          : Math.min(nextOpen, nextClose);
    const slice = s.slice(i, next);
    if (slice) segments.push({ text: slice, highlight: false });
    i = next;
    if (i >= s.length) break;
    if (s.slice(i, i + 3) === '<s>') {
      i += 3;
      const end = s.indexOf('</s>', i);
      const inner = end === -1 ? s.slice(i) : s.slice(i, end);
      if (inner) segments.push({ text: inner, highlight: true });
      i = end === -1 ? s.length : end + 4;
    } else if (s.slice(i, i + 4) === '</s>') {
      i += 4;
    }
  }
  return segments;
}

/**
 * 将片段按最大宽度拆成多行，支持 \n 硬换行；每行为片段数组
 */
function wrapSegments(segments, ctx, maxWidth) {
  const lines = [];
  let currentLine = [];
  let currentWidth = 0;

  function pushSegment(seg) {
    ctx.font = getTitleFont(seg.highlight);
    const w = ctx.measureText(seg.text).width;
    if (currentWidth + w <= maxWidth) {
      currentLine.push(seg);
      currentWidth += w;
    } else {
      if (currentLine.length) {
        lines.push(currentLine);
        currentLine = [];
        currentWidth = 0;
      }
      if (w <= maxWidth) {
        currentLine.push(seg);
        currentWidth = w;
      } else {
        const chars = [...seg.text];
        let run = '';
        for (const ch of chars) {
          const testRun = run + ch;
          const testW = ctx.measureText(testRun).width;
          if (testW <= maxWidth) {
            run = testRun;
          } else {
            if (run) {
              currentLine.push({ text: run, highlight: seg.highlight });
              lines.push(currentLine);
              currentLine = [];
              currentWidth = 0;
            }
            run = ch;
          }
        }
        if (run) {
          currentLine.push({ text: run, highlight: seg.highlight });
          currentWidth = ctx.measureText(run).width;
        }
      }
    }
  }

  for (const seg of segments) {
    const parts = seg.text.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        lines.push(currentLine);
        currentLine = [];
        currentWidth = 0;
      }
      const part = parts[i];
      if (part) pushSegment({ text: part, highlight: seg.highlight });
    }
  }
  if (currentLine.length) lines.push(currentLine);
  return lines;
}

/**
 * 根据底图编号解析背景图路径或 base64
 * 优先从 backgrounds/{id}.jpg 读取，便于部署时打包
 */
function getBackgroundImageSource(bgId) {
  const id = String(bgId ?? '1').replace(/[^0-9a-zA-Z_-]/g, '');
  const filePath = path.join(__dirname, 'backgrounds', `${id || '1'}.jpg`);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath);
  }
  return null;
}

/**
 * 主入口：生成封面图
 * @param {Object} params
 * @param {string} params.title - 标题，<s>...</s> 为高亮
 * @param {string|number} [params.bgId=1] - 底图编号（与 backgroundBase64 二选一）
 * @param {string} [params.backgroundBase64] - 底图 base64（可选，优先于 bgId）
 * @param {string} [params.output='buffer'] - 输出格式：'buffer' 返回 Buffer，'base64' 返回纯 base64，'dataURL' 返回可直接用于 img src 的 data URL
 * @returns {Promise<Buffer|string>} JPG 图片 Buffer 或字符串
 */
async function generateCoverImage({ title, bgId = 1, backgroundBase64, output = 'buffer' }) {
  const segments = parseTitle(title || '');
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

  ensureTitleFont();
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  const bgImage = await loadImage(bgSource);
  ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  const lines = wrapSegments(segments, ctx, TITLE_MAX_WIDTH);
  const blockHeight = lines.length * TITLE_LINE_HEIGHT;
  let y = (HEIGHT - blockHeight) / 2 + TITLE_LINE_HEIGHT / 2;

  ctx.textBaseline = 'middle';

  for (const line of lines) {
    let lineWidth = 0;
    for (const seg of line) {
      ctx.font = getTitleFont(seg.highlight);
      ctx.fillStyle = seg.highlight ? HIGHLIGHT_COLOR : NORMAL_COLOR;
      lineWidth += ctx.measureText(seg.text).width;
    }
    let x = (WIDTH - lineWidth) / 2;
    for (const seg of line) {
      ctx.font = getTitleFont(seg.highlight);
      ctx.fillStyle = seg.highlight ? HIGHLIGHT_COLOR : NORMAL_COLOR;
      ctx.fillText(seg.text, x, y);
      x += ctx.measureText(seg.text).width;
    }
    y += TITLE_LINE_HEIGHT;
  }

  const buf = canvas.toBuffer('image/jpeg', { quality: 1 });
  if (output === 'dataURL') {
    return `data:image/jpeg;base64,${buf.toString('base64')}`;
  }
  if (output === 'base64') {
    return buf.toString('base64');
  }
  return buf;
}

// 若直接运行则作为 HTTP 或事件入口
if (require.main === module) {
  const args = process.argv.slice(2);
  const title = args[0] || '示例标题与<s>高亮</s>文字';
  const bgId = args[1] || '1';
  generateCoverImage({ title, bgId })
    .then((buf) => {
      const out = path.join(__dirname, 'output-cover.jpg');
      fs.writeFileSync(out, buf);
      console.log('已生成:', out);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
