/**
 * 小程序虚拟支付：
 * - action confirm_order：支付 success 后校验并解锁报告（写库）
 * - action query_unlock_status：轮询只读查询 pay_orders + report.lock（不写库）
 */

const cloud = require('wx-server-sdk');
const {
  loadOrder,
  getReportIdFromOrder,
  getOpenidFromOrder,
  unlockReportForReportId,
} = require('./order-utils');

function getPayStatus(order) {
  if (!order) return null;
  return order.payStatus;
}

async function confirmOrder(event, context) {
  try {
    const wxContext = cloud.getWXContext();
    const ctxOpenid = wxContext.OPENID;
    const { reportId, outTradeNo } = event || {};

    if (!outTradeNo) {
      return { retcode: -1, message: '缺少 outTradeNo' };
    }
    if (!reportId) {
      return { retcode: -2, message: '缺少 reportId' };
    }

    const order = await loadOrder(outTradeNo);
    if (!order) {
      return { retcode: -3, message: '订单不存在' };
    }

    const orderOpenid = getOpenidFromOrder(order);
    if (ctxOpenid && orderOpenid && ctxOpenid !== orderOpenid) {
      console.error('[confirmOrder] openid mismatch', { outTradeNo, ctxOpenid, orderOpenid });
      return { retcode: -4, message: '用户与订单不匹配' };
    }

    const orderReportId = getReportIdFromOrder(order);
    if (orderReportId && String(orderReportId) !== String(reportId)) {
      return { retcode: -5, message: '报告与订单不匹配' };
    }

    const effectiveReportId = orderReportId || reportId;
    await unlockReportForReportId(effectiveReportId, outTradeNo);

    return {
      retcode: 0,
      message: 'success',
      data: { reportId: effectiveReportId, outTradeNo },
    };
  } catch (err) {
    console.error('[confirmOrder] error:', err);
    return {
      retcode: -99,
      message: err.message || '确认订单失败',
    };
  }
}

async function queryUnlockStatus(event, context) {
  try {
    const { reportId, outTradeNo } = event || {};
    if (!outTradeNo) {
      return { code: -1, msg: '缺少 outTradeNo' };
    }

    const order = await loadOrder(outTradeNo);
    const payStatus = getPayStatus(order);

    let unlocked = false;
    let reportLocked = undefined;

    if (reportId) {
      const { db } = require('./db');
      const res = await db.collection('report').where({ reportId }).limit(1).field({ lock: true }).get();
      const list = res.data || [];
      const doc = list[0];
      if (doc) {
        reportLocked = doc.lock;
        unlocked = doc.lock === false || doc.lock === 0;
      }
    }

    return {
      code: 0,
      msg: 'ok',
      data: {
        payStatus,
        unlocked,
        reportLocked,
        hasOrder: Boolean(order),
      },
    };
  } catch (err) {
    console.error('[queryUnlockStatus] error:', err);
    return { code: -99, msg: err.message || '查询失败' };
  }
}

module.exports = {
  confirmOrder,
  queryUnlockStatus,
};
