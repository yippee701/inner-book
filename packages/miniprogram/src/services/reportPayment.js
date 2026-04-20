import { createVirtualPaymentOrder, confirmVirtualPayment, queryUnlockStatus as queryUnlockStatusApi } from '@know-yourself/core';

const REPORT_UNLOCK_PAYMENT_FUNCTION_NAME = 'wx-virtual-pay';

const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_POLL_TIMEOUT_MS = 60000;

/** 汇总云函数业务层错误文案，便于 toast / 日志 */
function summarizeOrderRpcResult(response, result) {
  if (result && typeof result === 'object') {
    const text =
      result.msg ||
      result.message ||
      result.errMsg ||
      result.errmsg ||
      result.error;
    if (text) return String(text);
  }
  if (response?.errMsg && response.errMsg !== 'cloud.callFunction:ok') {
    return response.errMsg;
  }
  return '创建支付订单失败';
}

export async function requestReportUnlockOrder(cloudbaseApp, code, reportId) {
  let response;
  try {
    response = await createVirtualPaymentOrder(
      cloudbaseApp,
      {
        action: 'wxpay_virtual_goods',
        code,
        reportId,
      },
      REPORT_UNLOCK_PAYMENT_FUNCTION_NAME
    );
  } catch (error) {
    const reason = error?.errMsg || error?.message || error;
    console.error('[requestReportUnlockOrder] 云函数调用失败:', reason, error);
    throw new Error(reason || '创建支付订单失败');
  }

  const result = response?.result;
  const ok = result && result.code === 0;
  if (!ok) {
    const detail = summarizeOrderRpcResult(response, result);
    console.error('[requestReportUnlockOrder] 下单业务失败:', detail, '\n完整 response =', response, '\nresult =', result);
    throw new Error(detail);
  }

  return result.data || result;
}

export async function confirmReportUnlockOrder(cloudbaseApp, reportId, paymentPayload) {
  const response = await confirmVirtualPayment(
    cloudbaseApp,
    {
      reportId,
      ...paymentPayload,
    },
    REPORT_UNLOCK_PAYMENT_FUNCTION_NAME
  );

  const result = response?.result;
  if (!result || result.retcode !== 0) {
    throw new Error(result?.message || '支付确认失败');
  }

  return result.data || result;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * 支付成功后轮询：直到报告已解锁（与微信发货推送 / confirm_order 对齐）
 * @param {object} options - intervalMs、timeoutMs
 */
export async function pollReportUnlockUntilDone(cloudbaseApp, reportId, outTradeNo, options = {}) {
  if (!cloudbaseApp) {
    throw new Error('cloudbaseApp 未初始化');
  }
  if (!reportId || !outTradeNo) {
    throw new Error('缺少 reportId 或 outTradeNo');
  }

  const intervalMs = options.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;
  const deadline = Date.now() + timeoutMs;
  let lastSnapshot = null;

  while (Date.now() < deadline) {
    const response = await queryUnlockStatusApi(
      cloudbaseApp,
      { reportId, outTradeNo },
      REPORT_UNLOCK_PAYMENT_FUNCTION_NAME
    );
    const result = response?.result;
    if (!result || result.code !== 0) {
      throw new Error(result?.msg || '查询解锁状态失败');
    }

    const data = result.data || {};
    lastSnapshot = data;

    if (data.unlocked) {
      return data;
    }
    if (data.payStatus === 2) {
      throw new Error('订单已退款');
    }

    await sleep(intervalMs);
  }

  const hint = lastSnapshot?.hasOrder
    ? '支付结果仍在确认中，请稍后在报告页重试或下拉刷新'
    : '查询超时，请稍后重试';
  throw new Error(hint);
}
