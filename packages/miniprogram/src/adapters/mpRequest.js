import Taro from '@tarojs/taro';
import { getOpenid } from '../utils/openidStore';

const CHAT_SERVICE_NAME = 'inner-book-server';
const CLOUDBASE_TOKEN_FUNCTION_NAME = 'cloudbase-anonymous-token';
const CALL_CONTAINER_TIMEOUT = 15000;
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

let cachedAccessToken = '';
let cachedAccessTokenExpiresAt = 0;

/** 是否为 chat 相关接口（走云托管 callContainer） */
function isChatUrl(url) {
  return typeof url === 'string' && (url.includes('/chat') || url.endsWith('/chat'));
}

/** 从完整 URL 提取 path */
function getPathFromUrl(url) {
  try {
    const match = url.match(/^https?:\/\/[^/]+(\/.*)?$/);
    return match ? (match[1] || '/') : '/chat';
  } catch {
    return '/chat';
  }
}

/**
 * 从云托管返回的 SSE 格式中提取拼接后的正文
 * 格式：data: {"choices":[{"delta":{"content":"..."}}]}\n\ndata: [DONE]
 * 只取 choices[0].delta.content，忽略 reasoning_content / reasoning
 * @param {string} raw - 原始响应字符串
 * @returns {string}
 */
function parseSSEContent(raw) {
  if (typeof raw !== 'string') return '';
  let content = '';
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const obj = JSON.parse(payload);
      const delta = obj.choices?.[0]?.delta;
      if (delta && typeof delta.content === 'string') {
        content += delta.content;
      }
    } catch {
      // 忽略单行解析失败
    }
  }
  return content;
}

function parseResponseDataAsJson(data) {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch (error) {
    const content = parseSSEContent(data);
    if (content) {
      return { content, raw: data };
    }
    return {
      detail: data,
      raw: data,
      parseError: error?.message || 'response is not JSON',
    };
  }
}

function isCallContainerTimeoutError(err) {
  const message = err?.errMsg || err?.message || '';
  return err?.errCode === 102002 || /102002|请求超时|timeout/i.test(message);
}

function getCloudbaseTokenResult(response) {
  const result = response?.result || response || {};
  if (result.code && result.code !== 0) {
    throw new Error(result.message || result.msg || '获取 CloudBase access_token 失败');
  }
  const accessToken = result.access_token || result.accessToken || '';
  if (!accessToken) {
    const message = result.message || result.msg || result.errmsg || '获取 CloudBase access_token 失败';
    throw new Error(message);
  }
  return {
    accessToken,
    expiresIn: Number(result.expires_in || result.expiresIn || 7200),
  };
}

async function getCloudbaseAccessToken(cloudApp) {
  if (cachedAccessToken && Date.now() < cachedAccessTokenExpiresAt - ACCESS_TOKEN_REFRESH_BUFFER_MS) {
    return cachedAccessToken;
  }

  if (!cloudApp || !cloudApp.callFunction) {
    throw new Error('云函数未初始化，无法获取 CloudBase access_token');
  }

  const response = await cloudApp.callFunction({
    name: CLOUDBASE_TOKEN_FUNCTION_NAME,
    data: {},
  });
  const { accessToken, expiresIn } = getCloudbaseTokenResult(response);
  cachedAccessToken = accessToken;
  cachedAccessTokenExpiresAt = Date.now() + expiresIn * 1000;
  return accessToken;
}

function withCloudbaseAccessTokenHeaders(headers, accessToken) {
  return {
    ...(headers || {}),
    'Authorization': `Bearer ${accessToken}`,
    'X-WX-CLOUDBASE-ACCESS-TOKEN': accessToken,
    'X-WX-Access-Token': accessToken,
  };
}

/**
 * 小程序端 Request 适配器
 * - chat 接口：优先使用 wx.cloud.callContainer，超时时兜底使用 wx.request
 * - 其他：使用 wx.request
 */
export const mpRequestAdapter = {
  _cloudApp: null,

  setCloudApp(app) {
    this._cloudApp = app;
  },

  async request(url, options = {}) {
    if (this._cloudApp && isChatUrl(url)) {
      return this._requestChatViaCallContainer(url, options);
    }
    return this._wxRequest(url, options);
  },

  /**
   * 通过云托管 callContainer 调用 chat 接口
   */
  async _requestChatViaCallContainer(url, options = {}) {
    const cloudApp = this._cloudApp;
    if (!cloudApp || !cloudApp.callContainer) {
      return Promise.reject(new Error('云托管未初始化，无法调用 chat 接口'));
    }

    let body = null;
    if (options.body) {
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch {
        body = {};
      }
    }

    const method = (options.method || 'POST').toUpperCase();
    const path = getPathFromUrl(url);

    const openid = getOpenid();
    const accessToken = await getCloudbaseAccessToken(cloudApp);
    const header = {
      'X-WX-SERVICE': CHAT_SERVICE_NAME,
      ...withCloudbaseAccessTokenHeaders(options.headers, accessToken),
    };
    if (openid) header['X-WX-Openid'] = openid;

    try {
      const result = await cloudApp.callContainer({
        path,
        method,
        header,
        data: body,
        timeout: CALL_CONTAINER_TIMEOUT,
      });
      const res = result;
      const statusCode = res.statusCode ?? res.status ?? 200;
      const rawData = res.data ?? res;
      const rawText = typeof rawData === 'string' ? rawData : JSON.stringify(rawData);
      const content = parseSSEContent(rawText);

      const response = {
        ok: statusCode >= 200 && statusCode < 300,
        status: statusCode,
        statusText: '',
        headers: res.header || res.headers || {},
        json() {
          return Promise.resolve({ content });
        },
        text() {
          return Promise.resolve(rawText);
        },
        body: null,
      };
      return response;
    } catch (err) {
      if (isCallContainerTimeoutError(err)) {
        console.warn('[mpRequest] callContainer timeout:', err);
        return this._requestChatViaWxRequestFallback(url, options);
      }
      throw new Error(err.errMsg || err.message || '云托管请求失败');
    }
  },

  async _requestChatViaWxRequestFallback(url, options = {}) {
    const accessToken = await getCloudbaseAccessToken(this._cloudApp);
    const headers = withCloudbaseAccessTokenHeaders(options.headers, accessToken);

    return this._wxRequest(url, {
      ...options,
      headers,
      timeout: options.timeout || CALL_CONTAINER_TIMEOUT,
    });
  },

  _wxRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const header = { ...(options.headers || {}) };
      const openid = getOpenid();
      if (openid) header['X-WX-Openid'] = openid;
      let data = options.body;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          // 保持原样
        }
      }

      Taro.request({
        url,
        method: (options.method || 'GET').toUpperCase(),
        header,
        data,
        responseType: options.responseType || 'text',
        enableChunked: !!options.stream,
        ...(options.timeout ? { timeout: options.timeout } : {}),
        success(res) {
          const response = {
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: '',
            headers: res.header || {},
            json() {
              return Promise.resolve(parseResponseDataAsJson(res.data));
            },
            text() {
              return Promise.resolve(
                typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
              );
            },
            body: null,
          };
          resolve(response);
        },
        fail(err) {
          reject(new Error(err.errMsg || '网络请求失败'));
        },
      });
    });
  },

  /**
   * 流式请求（小程序专用，非 chat 时使用）
   */
  requestStream(url, options = {}) {
    const header = { ...(options.headers || {}) };
    let data = options.body;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch {}
    }
    return Taro.request({
      url,
      method: (options.method || 'POST').toUpperCase(),
      header,
      data,
      enableChunked: true,
    });
  },
};
