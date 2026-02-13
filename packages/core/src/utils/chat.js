import { getModeLabel } from '../constants/modes.js';
import { getAdapter } from '../adapters/index.js';

/**
 * 生成报告标题
 * @param {string} mode - 模式
 * @returns {string} 标题
 */
export function generateReportTitle(mode) {
  const modeLabel = getModeLabel(mode);
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return `${modeLabel}-${timeStr}`;
}

/**
 * 从报告内容中提取 h1 标题作为 subTitle
 * @param {string} content - 报告内容（Markdown 格式）
 * @returns {string} 提取的 h1 标题，如果没有则返回空字符串
 */
export function extractReportSubTitle(content) {
  if (!content) return '';
  
  const h1Match = content.replace(/^\[Report\]\s*/i, '').match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].replace(/[*_`]/g, '').trim();
  }
  
  return '';
}

/**
 * 清理报告内容，移除 [Report] 前缀 和 h1 标题
 * @param {string} content - 报告内容（Markdown 格式）
 * @returns {string} 清理后的报告内容
 */
export function cleanReportContent(content) {
  return content.replace(/^\[Report\]\s*/i, '').replace(/^#\s+.+\n?/m, '').trim();
}

/**
 * 本地生成报告唯一 id
 * @returns {string} 报告 id
 */
export function generateReportId() {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 从当前 URL（hash 或 search）读取 mode 参数
 * @returns {string|null}
 */
export function getModeFromUrl() {
  try {
    const platform = getAdapter('platform');
    const href = platform ? platform.getLocationHref() : (typeof location !== 'undefined' ? location.href : '');
    const hashIdx = href.indexOf('#');
    const hash = hashIdx >= 0 ? href.slice(hashIdx) : '';
    const searchIdx = href.indexOf('?');
    const search = hashIdx < 0 && searchIdx >= 0 ? href.slice(searchIdx) : '';
    const query = hash.includes('?') ? hash.split('?')[1] : search.slice(1);
    if (!query) return null;
    const params = new URLSearchParams(query);
    return params.get('mode') || null;
  } catch {
    return null;
  }
}
