import { getCurrentUserId } from '@know-yourself/core';
import { parseTimestamp, formatDateTime } from '../utils/date';

export const PAY_STATUS_LABELS = {
  0: '未支付',
  1: '已支付',
  2: '已退款',
};

function getCollectionData(data) {
  return Array.isArray(data?.data) ? data.data : [];
}

function normalizeWeChatPayInfo(info) {
  if (!info || typeof info !== 'object') return null;
  return {
    mchOrderNo: info.mchOrderNo || info.MchOrderNo || '',
    paidTime: info.paidTime || info.PaidTime || '',
    transactionId: info.transactionId || info.TransactionId || '',
  };
}

function normalizePayOrder(record) {
  if (!record) return null;
  const createTimestamp = parseTimestamp(record.createTime);
  const weChatPayInfo = normalizeWeChatPayInfo(record.weChatPayInfo);
  return {
    _id: record._id,
    outTradeNo: record.outTradeNo || '',
    reportId: record.reportId || '',
    openid: record.openid || '',
    productId: record.productId || '',
    productName: record.productName || '',
    offerId: record.offerId || '',
    price: Number(record.price || 0),
    payStatus: Number(record.payStatus ?? 0),
    payStatusLabel: PAY_STATUS_LABELS[Number(record.payStatus ?? 0)] || '未知状态',
    createTime: record.createTime || '',
    createTimestamp,
    deliverTime: record.deliverTime || '',
    refundTime: record.refundTime || '',
    weChatPayInfo,
  };
}

export function formatPaymentTime(value) {
  return formatDateTime(value);
}

export function formatPaymentAmount(price) {
  const amount = Number(price || 0) / 100;
  return amount.toFixed(2);
}

export function getPaymentStatusLabel(payStatus) {
  return PAY_STATUS_LABELS[Number(payStatus ?? 0)] || '未知状态';
}

export async function getPaymentRecords(db) {
  if (!db) throw new Error('数据库未初始化');
  const openid = getCurrentUserId();
  if (!openid) throw new Error('用户身份未初始化');

  return new Promise((resolve, reject) => {
    db.collection('pay_orders')
      .where({ openid })
      .orderBy('createTime', 'desc')
      .field({
        outTradeNo: true,
        reportId: true,
        productId: true,
        productName: true,
        price: true,
        payStatus: true,
        createTime: true,
        deliverTime: true,
        refundTime: true,
        weChatPayInfo: true,
      })
      .get((res, data) => {
        if (res !== 0) {
          reject(new Error(data?.message || '获取支付记录失败'));
          return;
        }
        const records = getCollectionData(data).map(normalizePayOrder).filter(Boolean);
        resolve(records);
      });
  });
}

export async function getPaymentRecordDetail(db, outTradeNo) {
  if (!db) throw new Error('数据库未初始化');
  if (!outTradeNo) throw new Error('订单号不存在');
  const openid = getCurrentUserId();
  if (!openid) throw new Error('用户身份未初始化');

  return new Promise((resolve, reject) => {
    db.collection('pay_orders')
      .where({ outTradeNo, openid })
      .field({
        outTradeNo: true,
        reportId: true,
        openid: true,
        productId: true,
        productName: true,
        offerId: true,
        price: true,
        payStatus: true,
        createTime: true,
        deliverTime: true,
        refundTime: true,
        weChatPayInfo: true,
      })
      .get((res, data) => {
        if (res !== 0) {
          reject(new Error(data?.message || '获取支付详情失败'));
          return;
        }
        const record = normalizePayOrder(getCollectionData(data)[0]);
        resolve(record || null);
      });
  });
}

export async function getPaymentReportSummary(db, reportId) {
  if (!db || !reportId) return null;
  return new Promise((resolve, reject) => {
    db.collection('report')
      .where({ reportId })
      .field({
        reportId: true,
        title: true,
        mode: true,
      })
      .get((res, data) => {
        if (res !== 0) {
          reject(new Error(data?.message || '获取报告信息失败'));
          return;
        }
        const record = getCollectionData(data)[0];
        if (!record) {
          resolve(null);
          return;
        }
        resolve({
          reportId: record.reportId || reportId,
          title: record.title || '未命名报告',
          mode: record.mode || 'discover-self',
        });
      });
  });
}
