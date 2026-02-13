/**
 * Web 端 Platform 适配器 - 基于浏览器 API
 */
export const webPlatformAdapter = {
  getUserAgent() {
    return navigator.userAgent;
  },
  getLocationHref() {
    return location.href;
  },
  getDeviceId() {
    return localStorage.getItem('device_id') || 'default_device_id';
  },
  reloadPage() {
    location.reload();
  },
  addEventListener(event, handler) {
    window.addEventListener(event, handler);
  },
  removeEventListener(event, handler) {
    window.removeEventListener(event, handler);
  },
  getPlatformName() {
    return 'web';
  },
};
