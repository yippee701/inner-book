/**
 * Web 端 Toast 适配器
 * 实际的 toast 引用在运行时通过 setToastRef 注入（来自 Toast 组件的 context）
 * 这里提供一个兜底实现
 */
export const webToastAdapter = {
  info(msg, _duration) {
    console.log('[Toast info]', msg);
  },
  success(msg) {
    console.log('[Toast success]', msg);
  },
  error(msg) {
    console.error('[Toast error]', msg);
  },
};
