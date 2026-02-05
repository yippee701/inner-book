/**
 * 用于处理用户行为埋点上报分析
 * db 由 CloudbaseProvider 初始化时通过 setTrackDb 注入
 */

import { getCurrentUserId, getCurrentUsername } from './user';
import { getModeFromUrl } from './chat';

/** 由 cloudbase 注入的 db 实例，在 CloudbaseProvider 初始化时设置 */
let cloudbaseApp = null;

/**
 * 注入 cloudbase db 实例，供埋点写入数据库
 * @param {object} db - cloudbase database 实例
 */
export function setCloudbaseApp(instance) {
  cloudbaseApp = instance;
}

/**
 * 上报 PV/UV 统计
 * @param {string} page - 页面名称
 */
export function trackVisitEvent(key, data) {
  trackEvent('visit', { key, ...data });
}

/**
 * 上报点击事件
 * @param {string} event - 事件名称
 * @param {object} data - 事件数据
 */
export function trackClickEvent(key, data) {
  trackEvent('click', { key, ...data });
}

/**
 * 上报停留时间
 * @param {string} key - 事件名称
 * @param {number} duaration - 停留时间
 * @param {object} data - 事件数据
 */
export function trackStayTime(key, duration, data) {
  trackEvent('stay', { key, duration, ...data });
}

/**
 * 上报对话轮次（用于统计同一 reportId 下的最大轮次，后端可按 reportId 去重取最大轮次）
 * @param {string} reportId - 报告 ID
 * @param {number} round - 当前轮次（一般为用户消息条数）
 */
export function trackConversationRound(reportId, round) {
  trackEvent('conversation_round', { key: 'conversation_round', reportId, round });
}

/**
 * 上报用户行为埋点
 * @param {string} event - 事件名称
 * @param {object} data - 事件数据
 */
export function trackEvent(event, data) {
  console.log('trackEvent', event, data);
  const defaultData = {
    bt: 'inner-book',
    platform: 'web',
    userId: getCurrentUserId(),
    username: getCurrentUsername(),
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    location: location.href,
    deviceId: getDeviceId(),
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

function getDeviceId() {
  return localStorage.getItem('device_id') || 'default_device_id';
}
