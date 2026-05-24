# virtual-pay

微信小程序虚拟支付云函数，支持两种入口：

1. **显式调用**（带 `action`）：小程序/测试通过 `action` 分发业务。
2. **服务器推送**（无 `action`）：在云开发控制台为虚拟支付事件配置「消息推送」到本云函数，入参为 `MsgType: "event"` 与 `Event: "xpay_…"`。

当前实现的 `action`：

- `wxpay_virtual_goods`：创建 `pay_orders` 待支付订单，并返回 `wx.requestVirtualPayment` 所需签名参数。
- `confirm_order`：支付成功后确认订单并解锁报告。
- `query_unlock_status`：轮询查询订单支付状态与报告是否已解锁（只读）。

推送事件（见 `payment-push.js`）：

| Event | 说明 |
| ----- | ---- |
| `xpay_goods_deliver_notify` | 道具发货通知 → 将订单 `payStatus` 更新为已支付（1），幂等 |
| `xpay_coin_pay_notify` | 代币购道具通知 → 同上 |
| `xpay_refund_notify` | 退款完成 → `payStatus` 置为 2 |
| `xpay_subscribe_ios_refund_query_notify` | iOS 退款问询 → 须在数秒内返回 `IosRefundQueryResponse`（示例默认拒绝退款，可按业务修改） |

其它 `xpay_*` 事件会记录日志并返回成功，避免无效重试。

文档：[消息推送能力处理小程序虚拟支付回调](https://developers.weixin.qq.com/minigame/dev/wxcloud/guide/wechatpay/virtual-payment-callback.html)

历史 README 中曾列出的 `preparePay` / `queryUserBalance` 等为示例名称；显式调用以 `wxpay_virtual_goods`、`confirm_order`、`query_unlock_status` 与推送处理为准。

## 环境变量

建议在云函数环境变量中配置：

- `WX_APPID`: 小程序 AppID
- `WX_APPSECRET`: 小程序 AppSecret
- `WX_VP_OFFER_ID`: 虚拟支付 Offer ID
- `WX_VP_APP_KEY`: 虚拟支付 AppKey
- `WX_VP_PAY_CALLBACK_KEY`: 支付回调验签 Key
- `WX_VP_ENV`: `0` 为正式环境，`1` 为沙箱环境

## 调用示例

### 1. 下单并生成前端虚拟支付参数

```json
{
  "action": "wxpay_virtual_goods",
  "code": "wx.login() 返回的 code",
  "openid": "可选，默认取云函数 OPENID"
}
```

返回中的 `requestVirtualPayment` 可直接交给小程序端：

```js
wx.requestVirtualPayment({
  mode: result.requestVirtualPayment.mode,
  signData: result.requestVirtualPayment.signData,
  paySig: result.requestVirtualPayment.paySig,
  signature: result.requestVirtualPayment.signature,
  success(res) {},
  fail(err) {},
});
```

### 2. 云开发控制台配置推送

在云开发控制台 → 消息推送中，将 `xpay_goods_deliver_notify`（及需要的其它 `xpay_*` 事件）指向**本云函数**，无需另建 HTTP 服务。

## 说明

- `pay_orders` 集合中文档为**顶层平铺字段**（如 `outTradeNo`、`openid`、`payStatus`），不要使用 `{ data: { … } }` 多包一层。收到 `xpay_*` 发货/支付推送时，会写入 `weChatPayInfo`（`mchOrderNo`、`paidTime`、`transactionId` 等，来自推送里的 `WeChatPayInfo`）。
- 依赖见 `package.json`（含 `@cloudbase/node-sdk`、`wx-server-sdk`）。
- **不要**仅在小程序 `requestVirtualPayment` 的 `success` 里发货；以本云函数收到的 `xpay_goods_deliver_notify`（及必要的查单补偿）为准。
- 推送处理须返回 `{ ErrCode: 0, ErrMsg: 'success' }`，否则会触发微信重试。
