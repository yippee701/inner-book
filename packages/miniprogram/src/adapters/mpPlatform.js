import Taro from '@tarojs/taro';

/**
 * 小程序端 Platform 适配器
 */
export const mpPlatformAdapter = {
  getUserAgent() {
    try {
      const info = Taro.getSystemInfoSync();
      return `${info.brand} ${info.model} ${info.system} WeChat/${info.version}`;
    } catch {
      return 'miniprogram';
    }
  },

  getLocationHref() {
    // 小程序没有 URL，返回当前页面路径
    try {
      const pages = Taro.getCurrentPages();
      const current = pages[pages.length - 1];
      return current?.route || '';
    } catch {
      return '';
    }
  },

  getDeviceId() {
    try {
      return Taro.getStorageSync('device_id') || 'mp_default_device_id';
    } catch {
      return 'mp_default_device_id';
    }
  },

  reloadPage() {
    // 小程序没有 reload，重启到首页
    Taro.reLaunch({ url: '/pages/index/index' });
  },

  addEventListener(event, handler) {
    // 小程序不支持全局事件监听，用 Taro 事件代替关键事件
    if (event === 'beforeunload' || event === 'pagehide') {
      // 在小程序中，这些事件可以忽略（由页面生命周期处理）
    }
    // error 和 unhandledrejection 暂时忽略
  },

  removeEventListener(event, handler) {
    // 与 addEventListener 对应
  },

  getPlatformName() {
    return 'miniprogram';
  },
};
