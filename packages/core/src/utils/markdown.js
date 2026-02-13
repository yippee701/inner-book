/**
 * 简易 Markdown → HTML（用于小程序 RichText 等场景，跨端共用）
 * @param {string} md
 * @returns {string} HTML 字符串
 */
export function markdownToHtml(md) {
  if (!md) return '';
  let html = md
    .replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:600;color:#1f2937;margin:16px 0 8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:600;color:#1f2937;margin:20px 0 10px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:700;color:#1f2937;margin:24px 0 12px;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;"/>')
    .replace(/\n\n/g, '</p><p style="margin:8px 0;line-height:1.8;color:#374151;font-size:15px;">')
    .replace(/\n/g, '<br/>');
  return `<p style="margin:8px 0;line-height:1.8;color:#374151;font-size:15px;">${html}</p>`;
}
