import Taro from '@tarojs/taro';
import { getOpenid } from '../utils/openidStore';

const CHAT_SERVICE_NAME = 'inner-book-server';

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

/**
 * 小程序端 Request 适配器
 * - chat 接口：使用 wx.cloud.callContainer 调用云托管
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
    const header = {
      'X-WX-SERVICE': CHAT_SERVICE_NAME,
      ...(options.headers || {}),
    };
    if (openid) header['X-WX-Openid'] = openid;

    try {
      const result = await cloudApp.callContainer({
        path,
        method,
        header,
        data: body,
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
      throw new Error(err.errMsg || err.message || '云托管请求失败');
    }
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
        success(res) {
          const response = {
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: '',
            headers: res.header || {},
            json() {
              return Promise.resolve(
                typeof res.data === 'string' ? JSON.parse(res.data) : res.data
              );
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
