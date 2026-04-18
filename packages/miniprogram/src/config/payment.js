/**
 * 小程序报告解锁的微信虚拟支付配置。
 *
 * 注意：
 * 1. `functionName` 对应你们即将提供的云函数/服务端下单与验单入口。
 * 2. 商品信息会传给服务端用于创建订单，服务端仍需二次校验，不能直接信任前端参数。
 */
export const REPORT_UNLOCK_PAYMENT_CONFIG = {
  functionName: 'wx-virtual-pay',
  mode: 'short_series_goods',
  offerId: '1450513532',
  env: 1,
  productId: 'innerbook_1',
  productName: 'INNERBOOK完整报告',
  goodsPrice: 690, // 单位为分
  buyQuantity: 1,
  currencyType: 'CNY',
  attach: 'report_unlock',
};

export function formatPriceFen(priceFen) {
  if (!Number.isFinite(priceFen)) return '';
  return `¥${(priceFen / 100).toFixed(priceFen % 100 === 0 ? 0 : 2)}`;
}
