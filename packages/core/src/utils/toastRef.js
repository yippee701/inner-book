/**
 * 供非 React 模块在 401 等场景下弹出 toast，避免直接依赖 Toast 上下文
 */
let toastMessageRef = null;

export function setToastRef(messageApi) {
  toastMessageRef = messageApi;
}

export function getToastRef() {
  return toastMessageRef;
}
