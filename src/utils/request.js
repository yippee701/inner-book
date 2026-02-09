/**
 * 封装 fetch：所有接口若返回 401，统一 toast 提示并触发重新登录（匿名登录），再抛出错误供上层处理
 */
import { getAuthRef } from './authRef';
import { getToastRef } from './toastRef';

/**
 * 触发重新登录（匿名）
 */
function triggerReLogin() {
  const auth = getAuthRef();
  if (auth) {
    auth.signInAnonymously();
    location.reload();
  }
}

/**
 * 与 fetch 同签名的请求封装，响应为 401 时 toast 提示、触发匿名重新登录并抛出
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (response.status === 401) {
    const toast = getToastRef();
    if (toast?.info) {
      toast.info('用户信息失效，正在为您重新获取', 5000);
    }
    triggerReLogin();
    const err = new Error('登录已过期，请稍后重试');
    err.status = 401;
    throw err;
  }

  return response;
}

export default request;
