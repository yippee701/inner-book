const ACCESS_TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/stable_token';
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

let cachedAccessToken = '';
let cachedExpiresAt = 0;

function getRuntimeConfig() {
  if (globalThis.CONFIG) {
    return globalThis.CONFIG;
  }
  const { getConfig } = require('./config');
  return getConfig();
}

function createAccessTokenError(response) {
  const message = response?.errmsg || response?.message || '获取 access_token 失败';
  const error = new Error(message);
  error.code = response?.errcode || 'GET_ACCESS_TOKEN_FAILED';
  error.detail = response;
  return error;
}

function getRemainingSeconds() {
  return Math.max(0, Math.floor((cachedExpiresAt - Date.now()) / 1000));
}

async function requestStableAccessToken(forceRefresh = false) {
  const { requestJson } = require('./request');
  const config = getRuntimeConfig();

  if (!config.appId) {
    throw new Error('缺少小程序 AppID，无法获取 access_token');
  }
  if (!config.appSecret) {
    throw new Error('缺少 WX_APPSECRET 环境变量，无法获取 access_token');
  }

  const response = await requestJson('POST', ACCESS_TOKEN_URL, {
    grant_type: 'client_credential',
    appid: config.appId,
    secret: config.appSecret,
    force_refresh: Boolean(forceRefresh),
  });

  if (response?.errcode && response.errcode !== 0) {
    throw createAccessTokenError(response);
  }
  if (!response?.access_token) {
    throw createAccessTokenError(response);
  }

  const expiresIn = Number(response.expires_in) || 7200;
  cachedAccessToken = response.access_token;
  cachedExpiresAt = Date.now() + expiresIn * 1000;

  return {
    access_token: cachedAccessToken,
    expires_in: getRemainingSeconds(),
  };
}

async function getAccessToken(event = {}) {
  const forceRefresh = event.force_refresh === true;
  if (!forceRefresh && cachedAccessToken && Date.now() < cachedExpiresAt - REFRESH_BUFFER_MS) {
    return {
      access_token: cachedAccessToken,
      expires_in: getRemainingSeconds(),
    };
  }

  return requestStableAccessToken(forceRefresh);
}

module.exports = {
  getAccessToken,
};
