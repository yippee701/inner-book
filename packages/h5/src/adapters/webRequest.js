/**
 * Web 端 Request 适配器 - 基于 fetch API
 */
export const webRequestAdapter = {
  /**
   * 发起请求（与 fetch 同签名，返回 Response）
   * @param {string} url
   * @param {RequestInit} options
   * @returns {Promise<Response>}
   */
  request(url, options = {}) {
    return fetch(url, options);
  },
};
