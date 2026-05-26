# cloudbase-anonymous-token

临时获取 CloudBase 匿名登录态 `access_token` 的云函数。

小程序端在云托管 `callContainer` 超时后，会调用本云函数获取匿名 token，再通过 `wx.request` 访问云托管。

可选环境变量：

- `CLOUDBASE_ENV_ID`：CloudBase 环境 ID，默认 `inner-book-0gdweqyu8ab70e46`
- `CLOUDBASE_REGION`：CloudBase 地域，默认 `ap-shanghai`
