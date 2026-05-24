# 小程序版本 - 后续待办

本文档记录小程序版本上线前需要完成的事项。

---

## 1. 填写小程序 AppID

- **位置**：`packages/miniprogram/project.config.json`
- **操作**：在微信公众平台注册小程序，将获取的 `appid` 填入配置中的 `"appid": ""`
- **说明**：未填写时无法在真机预览与发布

---

## 2. 配置环境变量（API 地址）

- **位置**：`packages/miniprogram/src/adapters/mpEnv.js`
- **操作**：根据实际环境修改 `ENV_CONFIG`：
  - `SERVER_URL`：生产环境 API 基础地址（当前为 `https://inner-book.top`）
  - `MOCK_MODE`：是否开启 Mock（`'true'` / `'false'`）
  - `API_MODE`：接口模式（如 `'proxy'`）
- **说明**：小程序无 `import.meta.env`，通过该适配器统一提供配置

---

## 3. 云函数 `get-openid`

- **位置**：微信云开发控制台 / 云函数目录
- **操作**：确保存在云函数 `get-openid`，返回 `{ openid }`（或等价结构）
- **说明**：一进 app 会在 `cloudbaseContext` 中调用 `Taro.cloud.callFunction({ name: 'get-openid' })`，并将 openid 用于后续所有请求（见 `utils/openidStore.js`、`adapters/mpRequest.js`）

---

## 4. 小程序分享能力

- **位置**：各页面或 `app.js`
- **操作**：
  - 使用 `Taro.useShareAppMessage` 配置分享标题、路径、图片
  - 报告结果页可配置分享卡片（标题、描述、图片）
- **说明**：Web 端用链接+二维码，小程序用原生「转发」能力

---

## 5. 真机样式与适配

- **操作**：
  - 在真机/不同机型上测试各页面
  - 根据实际情况微调 `rpx`/`px`、安全区（如 `env(safe-area-inset-bottom)`）、键盘弹起时的布局
- **说明**：开发工具与真机表现可能略有差异，需真机验收

---

## 可选优化

- **分包**：若包体积超 2MB，可将部分页面或静态资源放入分包
- **性能**：长列表（如报告正文、消息列表）可评估虚拟列表
- **错误上报**：接入小程序错误监控（如微信后台「异常分析」或自建上报）
