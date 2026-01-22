import { createContext, useContext, useEffect, useState } from 'react';
import cloudbase from "@cloudbase/js-sdk";
import { isLoggedIn } from '../utils/user';

const CloudbaseContext = createContext(null);

/**
 * Cloudbase Provider - 提供全局的 cloudbase auth 和 db 实例
 */
export function CloudbaseProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [rdb, setRdb] = useState(null);

  useEffect(() => {
    // 初始化 cloudbase
    const cloudApp = cloudbase.init({
      env: 'inner-book-0gdweqyu8ab70e46',
      region: 'ap-shanghai',
    });

    // 获取 auth 实例
    const authInstance = cloudApp.auth();
    setAuth(authInstance);

    // 获取 mongo db 实例
    const dbInstance = cloudApp.database();
    setDb(dbInstance);

    // 获取 mysql db 实例
    const rdbInstance = cloudApp.rdb();
    setRdb(rdbInstance);

    // 匿名登录
    if (!isLoggedIn) {
      authInstance.signInAnonymously();
    }

    return () => {
      // 清理（如果需要）
      setAuth(null);
      setDb(null);
      setRdb(null);
    };
  }, []);

  return (
    <CloudbaseContext.Provider value={{ auth, db, rdb }}>
      {children}
    </CloudbaseContext.Provider>
  );
}

/**
 * 使用 Cloudbase 的 Hook
 * @returns {object|null} { auth, db } cloudbase auth 和 db 实例
 */
export function useCloudbase() {
  const context = useContext(CloudbaseContext);
  return context;
}

/**
 * 使用 Auth 的 Hook（向后兼容）
 * @returns {object|null} cloudbase auth 实例
 */
export function useAuth() {
  const context = useContext(CloudbaseContext);
  return context?.auth || null;
}

/**
 * 使用 Database 的 Hook
 * @returns {object|null} cloudbase db 实例
 */
export function useDb() {
  const context = useContext(CloudbaseContext);
  return context?.db || null;
}

/**
 * 使用 RDB 的 Hook
 * @returns {object|null} cloudbase rdb 实例
 */
export function useRdb() {
  const context = useContext(CloudbaseContext);
  return context?.rdb || null;
}