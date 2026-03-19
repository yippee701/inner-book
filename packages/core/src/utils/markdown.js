/**
 * 简易 Markdown → HTML（用于小程序 RichText 等场景，跨端共用）
 * 样式对齐 H5 ReportContentCard 的 blockquote、列表等
 * @param {string} md
 * @returns {string} HTML 字符串
 */
const PARAGRAPH_STYLE = 'margin:8px 0;line-height:1.8;color:#374151;font-size:15px;';
const INSIGHT_BOX =
  'border-radius:16px;padding:16px 20px;margin:12px 0;background:linear-gradient(135deg,rgba(107,107,255,0.08),rgba(139,92,246,0.08));border:1px solid rgba(139,92,246,0.15);';
const LIST_ITEM_BOX =
  'border-radius:16px;padding:14px 16px;margin:10px 0;background:linear-gradient(135deg,rgba(107,107,255,0.08),rgba(139,92,246,0.08));border:1px solid rgba(139,92,246,0.15);';

export function markdownToHtml(md) {
  if (!md) return '';
  let html = md
    .replace(/^#### (.+)$/gm, '<h4 style="font-size:15px;font-weight:600;color:#1f2937;margin:14px 0 6px;">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:600;color:#1f2937;margin:16px 0 8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:600;color:#1f2937;margin:20px 0 10px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:700;color:#1f2937;margin:24px 0 12px;">$1</h1>')
    .replace(/^> (.+)$/gm, (_, line) => `<div style="${INSIGHT_BOX}"><span style="font-weight:500;color:#1f2937;font-size:15px;line-height:1.7;">${line}</span></div>`)
    .replace(/^[\*\-] +(.+)$/gm, (_, line) => `<div style="${LIST_ITEM_BOX}"><span style="color:#1f2937;font-size:15px;line-height:1.7;">▪ ${line}</span></div>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;color:#1f2937;">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#8b5cf6;">$1</em>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(139,92,246,0.3);margin:24px 0;"/>')
    .replace(/\n\n/g, `</p><p style="${PARAGRAPH_STYLE}">`);
  return `<p style="${PARAGRAPH_STYLE}">${html}</p>`;
}
