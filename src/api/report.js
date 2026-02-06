/**
 * Report API - 报告相关接口
 */

import { REPORT_STATUS } from '../constants/reportStatus';

/**
 * 验证邀请码
 */
export async function verifyInviteCode(cloudbaseApp , inviteCode, reportId) {
  if (!cloudbaseApp) {
    throw new Error('cloudbaseApp 未初始化');
  }
  const result = await cloudbaseApp.callFunction({
    name: 'invite-code',
    data: {
      action: 'consume',
      reportId: reportId,
      inviteCode: inviteCode,
    },
  });

  return result;
}

// 缓存配置
const CACHE_DURATION = 5 * 1000; // 5s
const cache = new Map();

/**
 * 获取缓存键
 */
function getCacheKey(db, table, params) {
  return `${table}_${JSON.stringify(params)}`;
}

/**
 * 检查缓存是否有效
 */
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

/**
 * 设置缓存
 */
function setCachedData(cacheKey, data) {
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

/**
 * 获取报告详情
 * @param {object} db - 数据库实例
 * @param {boolean} skipCache - 是否跳过缓存（用于解锁后重新加载）
 */
export function getReportDetail(db, reportId, skipCache = false) {
  if (!reportId) {
    console.warn('reportId 为空，无法获取报告内容');
    return null;
  }

  if (!db) {
    console.warn('db 未初始化，无法获取报告内容');
    return null;
  }

  // 检查缓存
  const cacheKey = getCacheKey(db, 'report_detail', { reportId });
  if (!skipCache) {
    const cached = getCachedData(cacheKey);
    if (cached !== null) {
      console.log('[getReportDetail] 使用缓存数据');
      return cached;
    }
  } else {
    cache.delete(cacheKey);
  }

  return new Promise((resolve, reject) => {
    db.collection('report')
      .where({ reportId })
      .field({
        content: true,
        status: true,
        subTitle: true,
        username: true,
        lock: true,
        inviteCode: true,
        mode: true,
      })
      .get((res, data) => {
        if (res !== 0 || !data) {
          console.error('获取报告内容失败:', res, data);
          reject(new Error('获取报告内容失败'));
          return;
        }
        try {
          const list = data.data || [];
          if (list.length === 0) {
            console.warn('报告不存在:', reportId);
            resolve(null);
            return;
          }
          const reportDetail = list[0];
          const result = {
            content: reportDetail.content || '',
            status: reportDetail.status,
            subTitle: reportDetail.subTitle || '',
            username: reportDetail.username,
            lock: reportDetail.lock !== undefined ? reportDetail.lock : 1,
            inviteCode: reportDetail.inviteCode || '',
            isCompleted: reportDetail.status === REPORT_STATUS.COMPLETED,
          };
          if (reportDetail.lock === 1) {
            result.content = result.content.slice(0, 200).concat('...(待解锁)');
          }
          setCachedData(cacheKey, result);
          resolve(result);
        } catch (err) {
          console.error('获取报告详情失败:', err);
          reject(err);
        }
      });
  });
}

/**
 * 保存对话记录
 * @param {string} reportId - 报告 ID
 * @param {array} messages - 对话记录
 */
export async function saveMessages(db, reportId, messages) {
  if (!db) {
    console.warn('db 未初始化，无法保存对话记录');
    return;
  }
  
  if (!reportId) {
    console.warn('reportId 为空，无法保存对话记录');
    return;
  }

  return new Promise((resolve, reject) => db.collection('message').add({
    reportId,
    messages,
  }, (res, data) => {
    if(res !== 0 || !data) {
      reject(new Error('保存对话记录失败'));
      return;
    }
    resolve(data);
  }));
}

/**
 * 获取对话记录
 * @param {string} reportId - 报告 ID
 * @return {array} messages - 对话记录
 */
export async function getMessages(db, reportId) {
  if (!db) {
    console.warn('db 未初始化，无法获取对话记录');
    return;
  }
  
  if (!reportId) {
    console.warn('reportId 为空，无法获取对话记录');
    return;
  }
  return new Promise((resolve, reject) => {
    db.collection('message')
      .where({ reportId })
      .field({ messages: true })
      .get((res, data) => {
      if(res !== 0 || !data) {
        reject(new Error('获取对话记录失败'));
        return;
      }
      try {
        if(data.data.length > 0) {
          const messages = data.data.slice(-1)[0].messages || [];
          resolve(messages);
        } else {
          resolve([]);
        }
      } catch (err) {
        reject(err);
      }
    })
  });
}