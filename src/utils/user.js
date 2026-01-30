import { USER_INFO_LOCAL_STORAGE_KEY, CREDENTIALS_LOCAL_STORAGE_KEY } from '../constants/global';

/**
 * 从 localStorage 获取当前用户名
 */
export function getCurrentUsername() {
  try {
    const localUserInfo = localStorage.getItem(USER_INFO_LOCAL_STORAGE_KEY);
    if (!localUserInfo) return null;
    const parsed = JSON.parse(localUserInfo);
    return parsed.content?.name || null;
  } catch {
    return null;
  }
}

/**
 * 从 localStorage 获取当前用户 reportId
 */
export function getCurrentUserId() {
  try {
    const localUserInfo = localStorage.getItem(USER_INFO_LOCAL_STORAGE_KEY);
    if (!localUserInfo) return null;
    const parsed = JSON.parse(localUserInfo);
    return parsed.content?.uid || null;
  } catch {
    return null;
  }
}

/**
 * 判断是否登录
 * @returns boolean
 */
export function isLoggedIn() {
  try {
    const localUserInfo = localStorage.getItem(USER_INFO_LOCAL_STORAGE_KEY);
    if (!localUserInfo) return false;
    
    const parsed = JSON.parse(localUserInfo);
    if (parsed.content?.name === 'anonymous') {
      return false;
    }
    const credentials = localStorage.getItem(CREDENTIALS_LOCAL_STORAGE_KEY);
    const credentialsObj = JSON.parse(credentials);
    const token = credentialsObj?.access_token;
    if (!token) return false;
    return true;
  } catch {
    return false;
  }
}