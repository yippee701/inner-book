const COMMON_VIRTUAL_PAY_CONFIG = {
  appId: "wxd4168d20a8ab16bf",
  appSecret: process.env.WX_APPSECRET || "",
  offerId: "1450513532",
  appKey: process.env.WX_VP_APP_KEY || "",
  payCallbackKey: "WX_VP_PAY_CALLBACK_1",
  env: 0,
};

const REPORT_UNLOCK_GOODS_CONFIG = {
  mode: "short_series_goods",
  productId: "innerbook_1", // "test", // 
  productName: "INNERBOOK完整报告", // "测试道具", // 
  goodsPrice: 690, // 100, // 
  buyQuantity: 1,
  currencyType: "CNY",
  attach: "report_unlock",
};

function getConfig() {
  return {
    ...COMMON_VIRTUAL_PAY_CONFIG,
    goods: {
      reportUnlock: REPORT_UNLOCK_GOODS_CONFIG,
    },
  };
}

module.exports = {
  COMMON_VIRTUAL_PAY_CONFIG,
  REPORT_UNLOCK_GOODS_CONFIG,
  getConfig,
};
