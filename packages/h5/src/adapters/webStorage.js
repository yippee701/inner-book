/**
 * Web 端 Storage 适配器 - 基于 localStorage
 */
export const webStorageAdapter = {
  getItem(key) {
    return localStorage.getItem(key);
  },
  setItem(key, value) {
    localStorage.setItem(key, value);
  },
  removeItem(key) {
    localStorage.removeItem(key);
  },
};
