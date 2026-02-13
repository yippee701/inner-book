/**
 * 错误聚合上报：缓冲错误，按间隔或页面卸载时统一上报
 * 需在应用内调用 initErrorTracking(reportEvent) 注入上报函数，通常由 track.js 初始化
 */
import { getAdapter } from '../adapters/index.js';

const ERROR_FLUSH_INTERVAL_MS = 60 * 1000; // 1 分钟
const errorBuffer = [];
let errorFlushTimerId = null;
let errorUnloadListenersAttached = false;
/** @type {(event: string, data: object) => void} */
let reportEvent = null;

/** 将 Error 或普通对象转为可序列化的错误项 */
function normalizeErrorItem(error) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }
  if (typeof error === 'object' && error !== null) {
    return { ...error };
  }
  return { message: String(error) };
}

/** 立即上报当前缓冲的错误（聚合为一条 error 事件） */
function flushErrorBuffer() {
  if (errorBuffer.length === 0) return;
  const snapshot = errorBuffer.splice(0, errorBuffer.length);
  if (errorFlushTimerId != null) {
    clearTimeout(errorFlushTimerId);
    errorFlushTimerId = null;
  }
  if (reportEvent) {
    reportEvent('error', {
      key: 'error_batch',
      count: snapshot.length,
      errors: snapshot,
    });
  }
  if (errorBuffer.length > 0) scheduleErrorFlush();
}

/** 安排定时 flush 与页面卸载监听（仅注册一次） */
function scheduleErrorFlush() {
  if (errorFlushTimerId == null) {
    errorFlushTimerId = setTimeout(() => {
      errorFlushTimerId = null;
      flushErrorBuffer();
      if (errorBuffer.length > 0) scheduleErrorFlush();
    }, ERROR_FLUSH_INTERVAL_MS);
  }
  if (!errorUnloadListenersAttached) {
    const platform = getAdapter('platform');
    if (platform) {
      errorUnloadListenersAttached = true;
      platform.addEventListener('beforeunload', flushErrorBuffer);
      platform.addEventListener('pagehide', flushErrorBuffer);
    }
  }
}

/**
 * 初始化错误上报：注入底层上报函数（由 track.js 调用）
 * @param {(event: string, data: object) => void} reportEventFn - 即 trackEvent
 */
export function initErrorTracking(reportEventFn) {
  reportEvent = reportEventFn;
}

/**
 * 上报错误信息（先入缓冲，按间隔或页面卸载聚合上报）
 * @param {string} key - 错误类型：jserror, apierror...
 * @param {Error|object|string} error - 错误信息
 */
export function trackErrorEvent(key, error) {
  const item = {
    key: key || 'error',
    ...normalizeErrorItem(error),
    timestamp: Date.now(),
  };
  errorBuffer.push(item);
  scheduleErrorFlush();
}

/** 初始化全局未捕获错误监听，将错误送入聚合缓冲 */
export function initGlobalErrorHandlers() {
  const platform = getAdapter('platform');
  if (!platform) return;

  platform.addEventListener('error', (event) => {
    trackErrorEvent('jserror', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  });

  platform.addEventListener('unhandledrejection', (event) => {
    trackErrorEvent('unhandledrejection', {
      message: event.reason?.message ?? String(event.reason),
      stack: event.reason?.stack,
    });
  });
}
