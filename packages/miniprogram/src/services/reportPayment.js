import { createVirtualPaymentOrder, confirmVirtualPayment } from '@know-yourself/core';

const REPORT_UNLOCK_PAYMENT_FUNCTION_NAME = 'wx-virtual-pay';

export async function requestReportUnlockOrder(cloudbaseApp, code) {
  try { 
    const response = await createVirtualPaymentOrder(
      cloudbaseApp,
      {
        action: 'wxpay_virtual_goods',
        code,
      },
      REPORT_UNLOCK_PAYMENT_FUNCTION_NAME
    );
    const result = response?.result;
    if (!result || result.code !== 0) {
      console.error('requestReportUnlockOrder error:', result);
      throw new Error(result?.message || '创建支付订单失败');
    }

    return result.data || result;    
  } catch (error) {
    console.error('requestReportUnlockOrder error:', error);
    throw new Error(error?.message || '创建支付订单失败');
  }

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
