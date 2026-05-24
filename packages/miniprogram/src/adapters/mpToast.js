import Taro from '@tarojs/taro';

/**
 * 小程序端 Toast 适配器
 */
export const mpToastAdapter = {
  info(msg, duration = 2000) {
    Taro.showToast({
      title: msg,
      icon: 'none',
      duration: Math.min(duration, 5000),
    });
  },
  success(msg) {
    Taro.showToast({
      title: msg,
      icon: 'success',
      duration: 2000,
    });
  },
  error(msg) {
    Taro.showToast({
      title: msg,
      icon: 'error',
      duration: 2000,
    });
  },
};
