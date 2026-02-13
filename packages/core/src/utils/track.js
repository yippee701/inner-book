/**
 * 用户行为埋点上报
 * cloudbaseApp 由各端初始化后通过 setCloudbaseApp 注入
 */

import { getCurrentUserId, getCurrentUsername } from './user.js';
import { getModeFromUrl } from './chat.js';
import { initErrorTracking, trackErrorEvent, initGlobalErrorHandlers } from './trackError.js';
import { getAdapter } from '../adapters/index.js';

/** 由 cloudbase 注入的 app 实例 */
let cloudbaseApp = null;

/**
 * 注入 cloudbase app 实例，供埋点写入数据库
 * @param {object} instance - cloudbase app 实例
 */
export function setCloudbaseApp(instance) {
  cloudbaseApp = instance;
}

/**
 * 上报 PV/UV 统计
 */
export function trackVisitEvent(key, data) {
  trackEvent('visit', { key, ...data });
}

/**
 * 上报点击事件
 */
export function trackClickEvent(key, data) {
  trackEvent('click', { key, ...data });
}

/**
 * 上报停留时间
 */
export function trackStayTime(key, duration, data) {
  trackEvent('stay', { key, duration, ...data });
}

/**
 * 上报对话轮次
 */
export function trackConversationRound(reportId, round) {
  trackEvent('conversation_round', { key: 'conversation_round', reportId, round });
}

export { trackErrorEvent };

/**
 * 上报用户行为埋点
 * @param {string} event - 事件名称
 * @param {object} data - 事件数据
 */
export function trackEvent(event, data) {
  console.log('trackEvent', event, data);
  const platform = getAdapter('platform');
  const storage = getAdapter('storage');
  const defaultData = {
    bt: 'inner-book',
    platform: platform?.getPlatformName() || 'unknown',
    userId: getCurrentUserId(),
    username: getCurrentUsername(),
    timestamp: Date.now(),
    userAgent: platform?.getUserAgent() || '',
    location: platform?.getLocationHref() || '',
    deviceId: storage?.getItem('device_id') || 'default_device_id',
  };
  const merged = { event, ...(data || {}), ...defaultData };
  if (merged.mode == null) {
    const urlMode = getModeFromUrl();
    if (urlMode) merged.mode = urlMode;
  }
  if (merged.mode == null) delete merged.mode;

  if (cloudbaseApp) {
    cloudbaseApp.callFunction({
      name: 'track',
      data: merged,
    });
  }
}

/**
 * 初始化埋点系统（各端启动时调用一次）
 */
export function initTracking() {
  initErrorTracking(trackEvent);
  initGlobalErrorHandlers();
}
