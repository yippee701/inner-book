/**
 * 购买虚拟道具
 */
async function wxpayVirtualGoods(event, context) {
  const { getSession } = require("./code2session");
  const { 
    stableStringify, 
    createNonceStr, 
    createOutTradeNo,
    generatePaySig, 
    generateUserSignature 
  } = require("./utils");
  const goodsConfig = CONFIG.goods.reportUnlock;

  try {
    const wxContext = cloud.getWXContext()
    const { openid = wxContext.OPENID } = event // 优先取前端传的openid，无则取云函数上下文
    const { code, reportId } = event

    // 0. 构造用户态签名
    const userSession = await getSession(code);

    // 1. 构造签名参数（微信虚拟支付要求的固定参数）
    const sigTime = Math.floor(Date.now() / 1000) // 时间戳（秒）
    const sigNonce = createNonceStr()
    const outTradeNo = createOutTradeNo() // 生成唯一订单号

    const confirmSignParams =
    {
      offerId: CONFIG.offerId,
      buyQuantity: goodsConfig.buyQuantity,
      env: CONFIG.env,
      currencyType: goodsConfig.currencyType,
      productId: goodsConfig.productId,
      goodsPrice: goodsConfig.goodsPrice,
      outTradeNo: outTradeNo,
      attach: goodsConfig.attach,
    }

    const sortedParams = stableStringify(confirmSignParams)

    // 2. 生成paySig签名
    const paySig = generatePaySig(sortedParams, CONFIG.appKey)
    const signature = generateUserSignature(sortedParams, userSession.sessionKey)

    // 3. 存入云数据库，创建待支付订单（字段平铺，勿包一层 data）
    await db.collection('pay_orders').add({
      outTradeNo,
      _openid: openid,
      reportId: reportId || '',
      offerId: CONFIG.offerId,
      productId: goodsConfig.productId,
      productName: goodsConfig.productName,
      price: goodsConfig.goodsPrice,
      payStatus: 0, // 0-待支付
      createTime: db.serverDate(),
      sigNonce,
      sigTime,
    })

    // 4. 返回前端需要的参数（直接传给wx.requestVirtualPayment）
    return {
      code: 0,
      msg: '签名生成成功',
      data: {
        outTradeNo,
        productId: goodsConfig.productId,
        productName: goodsConfig.productName,
        goodsPrice: goodsConfig.goodsPrice,
        requestVirtualPayment: {
          mode: goodsConfig.mode,
          signData: sortedParams,
          paySig,
          signature,
        },
        sigNonce,
        sigTime,
      }
    }
  } catch (err) {
    console.error('签名生成失败：', err)
    return {
      code: err.code || -1,
      msg: err.message || '签名生成失败',
      message: err.message || '签名生成失败',
      error: err.detail || err.message,
      errmsg: err.errmsg || err.message,
    }
  }
}

module.exports = {
  wxpayVirtualGoods,
};
