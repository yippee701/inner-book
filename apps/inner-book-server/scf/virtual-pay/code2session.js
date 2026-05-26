function getRuntimeConfig() {
  if (globalThis.CONFIG) {
    return globalThis.CONFIG;
  }
  const { getConfig } = require("./config");
  return getConfig();
}

async function getSession(code) {
  const { requestJson } = require("./request");
  const config = getRuntimeConfig();

  const API_ROOT = "https://api.weixin.qq.com";
  const url =
    `${API_ROOT}/sns/jscode2session` +
    `?appid=${encodeURIComponent(config.appId)}` +
    `&secret=${encodeURIComponent(config.appSecret)}` +
    `&js_code=${encodeURIComponent(code)}` +
    `&grant_type=authorization_code`;

  const response = await requestJson("GET", url);

  if (response.errcode !== undefined && response.errcode !== 0) {
    console.error(response);
    // 请求失败的错误格式 { errcode: 40029, errmsg: "invalid code" }
    const error = new Error(response.errmsg || "code2Session failed");
    error.code = response.errcode;
    error.errmsg = response.errmsg;
    error.detail = response;
    throw error;
  }

  return {
    ok: true,
    action: "code2Session",
    openid: response.openid,
    unionid: response.unionid,
    sessionKey: response.session_key,
  };
}

module.exports = {
  getSession,
};
