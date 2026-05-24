/**
 * Profile API - 用户资料和报告历史相关接口
 */

import { getCurrentUsername, getCurrentUserId } from '../utils/user.js';
import { request } from '../utils/request.js';
import { REPORT_STATUS } from '../constants/reportStatus.js';
import { getAdapter } from '../adapters/index.js';

/** 微信小程序用 openid 查，其他端用 username */
function getReportQueryUser(db) {
  const platform = getAdapter('platform');
  const isMp = platform?.getPlatformName?.() === 'miniprogram';
  if (isMp) {
    const openid = getCurrentUserId();
    return openid ? { key: '_openid', value: openid } : null;
  }
  const username = getCurrentUsername();
  return username ? { key: 'username', value: username } : null;
}

function isMockMode() {
  const envAdapter = getAdapter('env');
  return envAdapter?.get('MOCK_MODE') === 'true';
}

function getApiBaseUrl() {
  const envAdapter = getAdapter('env');
  return envAdapter?.get('SERVER_URL') || 'http://localhost:80';
}

// 缓存配置
const CACHE_DURATION = 30 * 1000; // 30秒
const cache = new Map();

function getCacheKey(db, table, params) {
  return `${table}_${JSON.stringify(params)}`;
}

function getCachedData(cacheKey) {
  const cached = cache.get(cacheKey);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    cache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

function setCachedData(cacheKey, data) {
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

async function mockRestartConversation(_conversationId) {
  await new Promise(resolve => setTimeout(resolve, 300));
  return { success: true, newConversationId: `conv_new_${Date.now()}` };
}

async function fetchRestartConversation(conversationId) {
  const response = await request(`${getApiBaseUrl()}/api/conversations/${conversationId}/restart`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('重新开启对话失败');
  return response.json();
}

export function getUserExtraInfo(db) {
  const platform = getAdapter('platform');
  const isMp = platform?.getPlatformName?.() === 'miniprogram';
  const userIdent = isMp
    ? (getCurrentUserId() ? { key: 'openid', value: getCurrentUserId() } : null)
    : (getCurrentUsername() ? { key: 'username', value: getCurrentUsername() } : null);
  if (!userIdent) return {};

  if (!db) {
    console.warn('db 未初始化，无法获取用户信息');
    return {};
  }

  const cacheKey = getCacheKey(db, 'user_extra_info', userIdent);
  const cached = getCachedData(cacheKey);
  if (cached !== null) {
    console.log('[getUserExtraInfo] 使用缓存数据');
    return cached;
  }

  return new Promise((resolve) => {
    db.collection('user_info')
      .where({ [userIdent.key]: userIdent.value })
      .field({
        level: true,
        remainingReport: true,
        currentInvites: true,
      })
      .get((res, data) => {
        if (res !== 0 || !data) {
          console.error('获取用户信息失败:', res, data);
          resolve({});
          return;
        }
        try {
          const list = data.data || [];
          const result = list[0] || {};
          setCachedData(cacheKey, result);
          resolve(result);
        } catch (err) {
          console.error('获取用户信息失败:', err);
          resolve({});
        }
      });
  });
}

export async function restartConversation(conversationId) {
  if (isMockMode()) {
    return mockRestartConversation(conversationId);
  }
  return fetchRestartConversation(conversationId);
}

export function getReports(db) {
  const userIdent = getReportQueryUser(db);
  if (!userIdent) return [];

  if (!db) {
    console.warn('db 未初始化，无法获取报告列表');
    return [];
  }

  const cacheKey = getCacheKey(db, 'reports', userIdent);
  const cached = getCachedData(cacheKey);
  if (cached !== null) {
    console.log('[getReports] 使用缓存数据');
    return cached;
  }

  const whereClause = { [userIdent.key]: userIdent.value, status: REPORT_STATUS.COMPLETED };
  return new Promise((resolve) => {
    db.collection('report')
      .where(whereClause)
      .orderBy('createdAt', 'desc')
      .field({
        title: true,
        createdAt: true,
        status: true,
        reportId: true,
        mode: true,
        lock: true,
      })
      .get((res, data) => {
        if (res !== 0 || !data) {
          console.error('获取对话历史失败:', res, data);
          resolve([]);
          return;
        }
        try {
          const result = data.data || [];
          setCachedData(cacheKey, result);
          resolve(result);
        } catch (err) {
          console.error('获取报告列表失败:', err);
          resolve([]);
        }
      });
  });
}

export function updateReportTitle(db, reportId, title) {
  const userIdent = getReportQueryUser(db);
  if (!userIdent || !reportId || !title?.trim()) {
    return Promise.reject(new Error('参数不完整'));
  }
  if (!db) {
    return Promise.reject(new Error('数据库未初始化'));
  }
  const whereClause = { reportId, [userIdent.key]: userIdent.value };
  return new Promise((resolve, reject) => {
    db.collection('report')
      .where(whereClause)
      .update({ title: title.trim() }, (res, data) => {
        if (res !== 0) {
          console.error('更新报告标题失败:', res, data);
          reject(new Error(data?.message || '更新标题失败'));
          return;
        }
        const cacheKey = getCacheKey(db, 'reports', userIdent);
        cache.delete(cacheKey);
        resolve();
      });
  });
}

/**
 * 更新用户昵称（写入云数据库 user_info，小程序用 openid 定位）
 * @param {object} cloudbaseApp - cloudbaseApp 实例
 * @param {string} nickname - 新昵称
 */
export async function updateUserNickname(cloudbaseApp, nickname) {
  if (!cloudbaseApp) {
    return Promise.reject(new Error('cloudbaseApp 未初始化'));
  }
  const name = nickname.trim();
  
  const result = await cloudbaseApp.callFunction({
    name: 'mp-user-management',
    data: {
      action: 'updateUsername',
      username: name,
      userid: getCurrentUserId(),
    },    
  });

  if (result?.result?.retcode !== 0) {
    return Promise.reject(new Error(result.message || '更新用户昵称失败'));
  }
  // 这两行暂时没什么用，更新数据后用户清除缓存，但是这个缓存目前没用上
  // 没删掉的原因是，如果以后用上了缓存，防止这里忘记清除
  // const cacheKey = getCacheKey(db, 'user_extra_info', userIdent);
  // cache.delete(cacheKey);  
  return Promise.resolve();
}

export async function registMpUser(cloudbaseApp, userId = getCurrentUserId(), defaultUsername = '微信用户') {
  if (!cloudbaseApp) {
    return Promise.reject(new Error('cloudbaseApp 未初始化'));
  }
  if (!userId) {
    return Promise.reject(new Error('用户 ID 为空'));
  }

  const result = await cloudbaseApp.callFunction({
    name: 'mp-user-management',
    data: {
      action: 'registUser',
      username: defaultUsername,
      userid: userId,
    },
  });

  if (result?.result?.retcode !== 0) {
    return Promise.reject(new Error(result?.result?.message || result?.message || '初始化小程序用户失败'));
  }

  return result.result?.res || null;
}

/**
 * 检查用户是否有剩余对话次数（未登录视为可开始）
 * @param {boolean} isUserLoggedIn
 * @param {object} userExtraInfo - 如 { remainingReport }
 * @returns {boolean}
 */
export function checkCanStartChat(isUserLoggedIn, userExtraInfo) {
  if (!isUserLoggedIn) return true;
  const remaining = userExtraInfo?.remainingReport ?? 1;
  return remaining > 0;
}
