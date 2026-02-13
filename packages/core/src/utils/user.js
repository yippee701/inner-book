import { USER_INFO_LOCAL_STORAGE_KEY, CREDENTIALS_LOCAL_STORAGE_KEY } from '../constants/global.js';
import { getAdapter } from '../adapters/index.js';

/** 获取 storage 适配器（内部辅助） */
function storage() {
  return getAdapter('storage');
}

/**
 * 从存储获取当前用户名
 */
export function getCurrentUsername() {
  try {
    const localUserInfo = storage()?.getItem(USER_INFO_LOCAL_STORAGE_KEY);
    if (!localUserInfo) return null;
    const parsed = JSON.parse(localUserInfo);
    return parsed.content?.name || null;
  } catch {
    return null;
  }
}

/**
 * 从存储获取当前用户 ID
 */
export function getCurrentUserId() {
  try {
    const localUserInfo = storage()?.getItem(USER_INFO_LOCAL_STORAGE_KEY);
    if (!localUserInfo) return null;
    const parsed = JSON.parse(localUserInfo);
    return parsed.content?.uid || null;
  } catch {
    return null;
  }
}

/**
 * 判断是否登录
 * @returns {boolean}
 */
export function isLoggedIn() {
  try {
    const localUserInfo = storage()?.getItem(USER_INFO_LOCAL_STORAGE_KEY);
    if (!localUserInfo) return false;
    
    const parsed = JSON.parse(localUserInfo);
    if (parsed.content?.name === 'anonymous') {
      return false;
    }
    const token = getCurrentUserToken();
    if (!token) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取当前用户 token
 * @returns {string|null}
 */
export function getCurrentUserToken() {
  try {
    const credentials = storage()?.getItem(CREDENTIALS_LOCAL_STORAGE_KEY);
    const credentialsObj = JSON.parse(credentials);
    return credentialsObj?.access_token || null;
  } catch {
    return null;
  }
}
