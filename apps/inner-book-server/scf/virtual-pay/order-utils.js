/**
 * pay_orders 与报告解锁的共享工具（payment-push / confirm_order 共用）
 * pay_orders 文档为平铺字段，不再使用 { data: { ... } } 包裹。
 */

async function loadOrder(outTradeNo) {
  if (!outTradeNo) return null;
  const { db } = require('./db');
  const res = await db.collection('pay_orders').where({ outTradeNo }).limit(1).get();
  const list = res.data || [];
  return list[0] || null;
}

async function patchOrder(order, fields) {
  const { db } = require('./db');
  const id = order._id;
  if (!id) {
    throw new Error('patchOrder: missing _id');
  }
  await db.collection('pay_orders').doc(id).update(fields);
}

function getReportIdFromOrder(order) {
  if (!order) return '';
  return order.reportId || '';
}

function getOpenidFromOrder(order) {
  if (!order) return '';
  return order._openid || order.openid || '';
}

/**
 * 解锁报告：inviteCode 填订单号 outTradeNo
 * @see scf/invite-code/invite-code-managements.js consumeInviteCode
 */
async function unlockReportForReportId(reportId, outTradeNo) {
  if (!reportId) {
    console.warn('[order-utils] unlock skipped: empty reportId', outTradeNo);
    return;
  }

  const { db } = require('./db');
  const res = await db.collection('report').where({ reportId }).update({
    lock: false,
    inviteCode: outTradeNo,
  });

  if (res.code) {
    console.error('[order-utils] unlock report DB error:', res);
    throw new Error(res.message || res.msg || 'unlock report failed');
  }

  const updated = res.updated ?? res.data?.updated;
  if (!updated) {
    console.warn('[order-utils] unlock: 未更新任何 report 行，reportId=', reportId);
  } else {
    console.log('[order-utils] report unlocked:', reportId, 'inviteCode=', outTradeNo);
  }
}

async function unlockReportAfterPayment(order, outTradeNo) {
  const reportId = getReportIdFromOrder(order);
  if (!reportId) {
    console.warn('[order-utils] unlock skipped: pay_orders 无 reportId', outTradeNo);
    return;
  }
  await unlockReportForReportId(reportId, outTradeNo);
}

module.exports = {
  loadOrder,
  patchOrder,
  getReportIdFromOrder,
  getOpenidFromOrder,
  unlockReportForReportId,
  unlockReportAfterPayment,
};
