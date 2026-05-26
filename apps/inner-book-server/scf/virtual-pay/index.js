/**
 * 微信支付 通用接口示例
 * @param {Object} event - 云函数调用事件对象。小程序端调用时，event 是小程序端调用云函数时的入参，HTTP 请求的形式调用时，event 是 `集成请求体`
 * @param {Object} context - 云函数上下文
 * @returns {Promise<Object>} 响应结果
 */
exports.main = async (event, context) => {
  // 云函数的 require 必须写在里面，再通过 global 传出去，才能在其他模块里避免重复引入
  const cloud = require('wx-server-sdk');
  const crypto = require("crypto");
  const { db } = require('./db');
  const https = require("https");
  const { URL } = require("url");
  const { getConfig } = require("./config");
  const CONFIG = getConfig();
  const { wxpayVirtualGoods } = require("./virtual-goods");
  const { confirmOrder, queryUnlockStatus } = require("./confirm-order");
  const { getAccessToken } = require("./access-token");
  global.cloud = cloud;
  global.crypto = crypto;
  global.db = db;
  global.https = https;
  global.url = URL;
  global.CONFIG = CONFIG;

  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

  // 云开发控制台「消息推送」配置的虚拟支付回调：无 action，含 MsgType / Event
  if (event && event.MsgType === 'event' && typeof event.Event === 'string') {
    console.log('handlePaymentPush', event);
    const { handlePaymentPush } = require('./payment-push');
    return await handlePaymentPush(event);
  }

  // 小程序 / 控制台 显式调用：根据 action 分发
  switch (event.action) {
    case 'wxpay_virtual_goods':
      return await wxpayVirtualGoods(event, context);
    case 'confirm_order':
      return await confirmOrder(event, context);
    case 'query_unlock_status':
      return await queryUnlockStatus(event, context);
    case 'get_access_token':
      return await getAccessToken(event, context);
    default:
      console.log('Unimplemented method', event);
      return {
        code: -1,
        msg: 'Unimplemented method',
      };
  }
};
