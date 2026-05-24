import Taro from '@tarojs/taro';

/**
 * 小程序端 Storage 适配器 - 基于 wx.storage
 */
export const mpStorageAdapter = {
  getItem(key) {
    try {
      return Taro.getStorageSync(key) || null;
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      Taro.setStorageSync(key, value);
    } catch (e) {
      console.error('[mpStorage] setItem failed:', key, e);
    }
  },
  removeItem(key) {
    try {
      Taro.removeStorageSync(key);
    } catch (e) {
      console.error('[mpStorage] removeItem failed:', key, e);
    }
  },
};
