import { getAdapter } from '../adapters/index.js';

export const PENDING_REPORTS_KEY = 'pendingReports';

/**
 * 读取本地待同步报告列表（依赖 storage 适配器）
 * @returns {Array}
 */
export function getPendingReports() {
  const storage = getAdapter('storage');
  if (!storage?.getItem) return [];
  try {
    const raw = storage.getItem(PENDING_REPORTS_KEY);
    if (!raw) return [];
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 按模式取一条未完成的本地报告
 * @param {string} mode
 * @returns {object|null}
 */
export function getPendingReportByMode(mode) {
  const list = getPendingReports();
  return list.find((r) => r.mode === mode && r.status === 'pending') || null;
}
