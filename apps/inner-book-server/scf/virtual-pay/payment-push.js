/**
 * 微信小程序虚拟支付 — 服务器推送（云开发控制台「消息推送」→ 本云函数）
 * @see https://developers.weixin.qq.com/minigame/dev/wxcloud/guide/wechatpay/virtual-payment-callback.html
 *
 * 必须返回 { ErrCode, ErrMsg }；成功为 ErrCode === 0，否则微信会重试推送。
 */

const PUSH_SUCCESS = { ErrCode: 0, ErrMsg: 'success' };

const {
  loadOrder,
  patchOrder,
  getOpenidFromOrder,
  unlockReportAfterPayment,
} = require('./order-utils');

function logEvent(prefix, event) {
  try {
    console.log(prefix, JSON.stringify(event));
  } catch {
    console.log(prefix, event);
  }
}

/** 推送里的微信侧支付信息，平铺写入 pay_orders.weChatPayInfo */
function normalizeWeChatPayInfo(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const mchOrderNo = raw.MchOrderNo ?? raw.mchOrderNo;
  const paidTime = raw.PaidTime ?? raw.paidTime;
  const transactionId = raw.TransactionId ?? raw.transactionId;
  if (mchOrderNo == null && paidTime == null && transactionId == null) return null;
  return { mchOrderNo, paidTime, transactionId };
}

/**
 * @param {object} event - 推送入参（含 MsgType / Event / OutTradeNo 等）
 */
async function handlePaymentPush(event) {
  const { MsgType, Event } = event || {};

  if (MsgType !== 'event' || !Event || typeof Event !== 'string') {
    return PUSH_SUCCESS;
  }

  // 虚拟支付事件均以 xpay_ 开头；其它 event 直接 ACK，避免占用重试队列
  if (!Event.startsWith('xpay_')) {
    logEvent('[payment-push] ignored non-xpay event:', event);
    return PUSH_SUCCESS;
  }

  try {
    switch (Event) {
      case 'xpay_goods_deliver_notify':
        await onGoodsDeliverNotify(event);
        break;
      case 'xpay_coin_pay_notify':
        await onCoinPayNotify(event);
        break;
      case 'xpay_refund_notify':
        await onRefundNotify(event);
        break;
      case 'xpay_complaint_notify':
        logEvent('[payment-push] complaint', event);
        break;
      case 'xpay_subscribe_signing_result_notify':
      case 'xpay_subscribe_pay_fail_notify':
        logEvent('[payment-push] subscribe', event);
        break;
      case 'xpay_subscribe_ios_refund_query_notify':
        return onIosRefundQueryNotify(event);
      default:
        logEvent('[payment-push] unhandled xpay event', event);
    }

    return PUSH_SUCCESS;
  } catch (err) {
    console.error('[payment-push] handler error:', err);
    return {
      ErrCode: -1,
      ErrMsg: err.message || 'internal error',
    };
  }
}

/** 道具发货通知：支付成功且米大师侧发货完成后推送，此处做开通权益 / 更新订单（须幂等） */
async function onGoodsDeliverNotify(event) {
  const OutTradeNo = event.OutTradeNo;
  const OpenId = event.OpenId;

  if (!OutTradeNo) {
    console.warn('[payment-push] xpay_goods_deliver_notify: missing OutTradeNo');
    return;
  }

  const order = await loadOrder(OutTradeNo);
  if (!order) {
    console.warn('[payment-push] order not found:', OutTradeNo);
    return;
  }

  const orderOpenId = getOpenidFromOrder(order);
  if (OpenId && orderOpenId && orderOpenId !== OpenId) {
    console.error('[payment-push] openid mismatch:', {
      OutTradeNo,
      pushOpenId: OpenId,
      orderOpenId,
    });
  }

  const wpi = normalizeWeChatPayInfo(event.WeChatPayInfo);

  const paid = order.payStatus === 1;
  if (paid) {
    console.log('[payment-push] already delivered (idempotent):', OutTradeNo);
    if (wpi) {
      await patchOrder(order, { weChatPayInfo: wpi });
    }
    await unlockReportAfterPayment(order, OutTradeNo);
    return;
  }

  const { db } = require('./db');
  await patchOrder(order, {
    payStatus: 1,
    deliverTime: db.serverDate(),
    deliverEnv: event.Env,
    lastPushEvent: 'xpay_goods_deliver_notify',
    pushCreateTime: event.CreateTime,
    ...(wpi ? { weChatPayInfo: wpi } : {}),
  });
  await unlockReportAfterPayment(order, OutTradeNo);
}

/** 代币购买道具后的支付通知：同样用 outTradeNo 对齐业务单 */
async function onCoinPayNotify(event) {
  const OutTradeNo = event.OutTradeNo;
  if (!OutTradeNo) {
    console.warn('[payment-push] xpay_coin_pay_notify: missing OutTradeNo');
    return;
  }

  const order = await loadOrder(OutTradeNo);
  if (!order) {
    console.warn('[payment-push] coin pay: order not found:', OutTradeNo);
    return;
  }

  const wpi = normalizeWeChatPayInfo(event.WeChatPayInfo);

  const paid = order.payStatus === 1;
  if (paid) {
    if (wpi) {
      await patchOrder(order, { weChatPayInfo: wpi });
    }
    await unlockReportAfterPayment(order, OutTradeNo);
    return;
  }

  const { db } = require('./db');
  await patchOrder(order, {
    payStatus: 1,
    coinPayTime: db.serverDate(),
    deliverEnv: event.Env,
    lastPushEvent: 'xpay_coin_pay_notify',
    pushCreateTime: event.CreateTime,
    ...(wpi ? { weChatPayInfo: wpi } : {}),
  });
  await unlockReportAfterPayment(order, OutTradeNo);
}

/** 退款完成通知 */
async function onRefundNotify(event) {
  const OutTradeNo = event.OutTradeNo;
  if (!OutTradeNo) {
    console.warn('[payment-push] xpay_refund_notify: missing OutTradeNo');
    return;
  }

  const order = await loadOrder(OutTradeNo);
  if (!order) {
    console.warn('[payment-push] refund: order not found:', OutTradeNo);
    return;
  }

  const { db } = require('./db');
  await patchOrder(order, {
    payStatus: 2,
    refundTime: db.serverDate(),
    deliverEnv: event.Env,
    lastPushEvent: 'xpay_refund_notify',
    pushCreateTime: event.CreateTime,
  });
}

/**
 * iOS 订阅退款问询：须 3 秒内返回，且携带 IosRefundQueryResponse。
 * result_code: 0 建议退款，1 拒绝退款；evidence 必填。
 */
function onIosRefundQueryNotify(event) {
  logEvent('[payment-push] ios refund query', event);
  return {
    ErrCode: 0,
    ErrMsg: 'success',
    IosRefundQueryResponse: {
      result_code: 1,
      result_info: '拒绝退款',
      evidence:
        '数字内容/报告类商品按平台规则与购买页说明处理；如需人工审核请依据订单履约与使用记录裁定。',
    },
  };
}

module.exports = {
  handlePaymentPush,
};
