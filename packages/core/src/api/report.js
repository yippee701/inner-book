/**
 * Report API - 报告相关接口
 */

import { REPORT_STATUS } from '../constants/reportStatus.js';

/**
 * 验证邀请码
 */
export async function verifyInviteCode(cloudbaseApp, inviteCode, reportId) {
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

/**
 * 小程序：创建报告解锁虚拟支付订单
 */
export async function createVirtualPaymentOrder(cloudbaseApp, payload, functionName = 'report-unlock-payment') {
  if (!cloudbaseApp) {
    throw new Error('cloudbaseApp 未初始化');
  }
  let response;
  try {
    response = await cloudbaseApp.callFunction({
      name: functionName,
      data: payload,
    });
  } catch (err) {
    const reason = err?.errMsg || err?.message || err;
    console.error('[createVirtualPaymentOrder] callFunction rejected:', functionName, reason, err);
    throw err;
  }

  // 部分环境下失败仍走 resolve，errMsg 非 cloud.callFunction:ok
  if (response?.errMsg != null && response.errMsg !== 'cloud.callFunction:ok') {
    console.error('[createVirtualPaymentOrder] callFunction not ok:', functionName, response);
    throw new Error(response.errMsg);
  }

  return response;
}

/**
 * 小程序：确认虚拟支付结果并解锁报告
 */
export async function confirmVirtualPayment(cloudbaseApp, payload, functionName = 'report-unlock-payment') {
  if (!cloudbaseApp) {
    throw new Error('cloudbaseApp 未初始化');
  }
  const result = await cloudbaseApp.callFunction({
    name: functionName,
    data: {
      action: 'confirm_order',
      ...payload,
    },
  });
  return result;
}

/**
 * 小程序：轮询查询支付单与报告解锁状态（云函数 action：query_unlock_status）
 */
export async function queryUnlockStatus(cloudbaseApp, payload, functionName = 'report-unlock-payment') {
  if (!cloudbaseApp) {
    throw new Error('cloudbaseApp 未初始化');
  }
  let response;
  try {
    response = await cloudbaseApp.callFunction({
      name: functionName,
      data: {
        action: 'query_unlock_status',
        ...payload,
      },
    });
  } catch (err) {
    const reason = err?.errMsg || err?.message || err;
    console.error('[queryUnlockStatus] callFunction rejected:', functionName, reason, err);
    throw err;
  }

  if (response?.errMsg != null && response.errMsg !== 'cloud.callFunction:ok') {
    console.error('[queryUnlockStatus] callFunction not ok:', functionName, response);
    throw new Error(response.errMsg);
  }

  return response;
}

// 缓存配置
const CACHE_DURATION = 5 * 1000; // 5s
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

/**
 * 获取报告详情
 * @param {object} db - 数据库实例
 * @param {string} reportId
 * @param {boolean} skipCache - 是否跳过缓存
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
        title: true,
        content: true,
        status: true,
        subTitle: true,
        username: true,
        lock: true,
        inviteCode: true,
        mode: true,
        _openid: true,
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
            title: reportDetail.title || '',
            content: reportDetail.content || '',
            status: reportDetail.status,
            subTitle: reportDetail.subTitle || '',
            username: reportDetail.username,
            lock: reportDetail.lock !== undefined ? reportDetail.lock : true,
            inviteCode: reportDetail.inviteCode || '',
            isCompleted: reportDetail.status === REPORT_STATUS.COMPLETED,
            /** 微信云库中文档创建者 openid，用于区分本人报告 / 访客浏览 */
            creatorOpenid: reportDetail._openid ?? reportDetail.creatorOpenid ?? null,
          };
          if (reportDetail.lock === true) {
            result.content = result.content.slice(0, 500).concat('...(待解锁)');
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
    createdAt: +new Date(),
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
