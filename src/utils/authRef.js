/**
 * 供 user.js、request.js 等非 React 模块获取 auth 实例，用于匿名登录等，避免与 cloudbaseContext 循环依赖
 */
let authRef = null;

export function setAuthRef(auth) {
  authRef = auth;
}

export function getAuthRef() {
  return authRef;
}
