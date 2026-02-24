import Taro from '@tarojs/taro';
import { USER_INFO_LOCAL_STORAGE_KEY, CREDENTIALS_LOCAL_STORAGE_KEY } from '@know-yourself/core';

let openid = null;

/**
 * 设置 openid，并写入 storage 使 core 的 isLoggedIn/getCurrentUserToken/getCurrentUserId 等生效
 * @param {string} value - 云函数 get-openid 返回的 openid
 */
export function setOpenid(value) {
  openid = value || null;
  if (!openid) return;
  try {
    Taro.setStorageSync(USER_INFO_LOCAL_STORAGE_KEY, JSON.stringify({
      content: { name: '微信用户', uid: openid },
    }));
    Taro.setStorageSync(CREDENTIALS_LOCAL_STORAGE_KEY, JSON.stringify({
      access_token: openid,
    }));
  } catch (e) {
    console.error('[openidStore] setOpenid persist failed:', e);
  }
}

/**
 * 获取当前 openid（内存值，启动时由 get-openid 云函数写入）
 * @returns {string|null}
 */
export function getOpenid() {
  return openid;
}
