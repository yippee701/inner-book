import { createContext, useContext, useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { isLoggedIn } from '@know-yourself/core';
import { setCloudbaseApp as setTrackCloudbaseApp } from '@know-yourself/core';
import { setAuthRef } from '@know-yourself/core';

const CloudbaseContext = createContext(null);

/**
 * 小程序版 Cloudbase Provider
 * 使用 wx.cloud（微信云开发）
 */
export function CloudbaseProvider({ children }) {
  const [cloudbaseApp, setCloudbaseApp] = useState(null);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);

  useEffect(() => {
    // 初始化微信云开发
    if (Taro.cloud) {
      Taro.cloud.init({
        env: 'inner-book-0gdweqyu8ab70e46',
        traceUser: true,
      });

      const cloudApp = Taro.cloud;
      setCloudbaseApp(cloudApp);
      setTrackCloudbaseApp(cloudApp);

      // 小程序端 db 实例
      const dbInstance = Taro.cloud.database();
      setDb(dbInstance);

      // 小程序端不需要显式的 auth 对象，微信自带登录态
      // 但为了兼容 core 层的接口，构造一个兼容对象
      const authInstance = {
        // 获取当前用户信息
        async currentUser() {
          try {
            const { result } = await Taro.cloud.callFunction({ name: 'getUser' });
            return result;
          } catch {
            return null;
          }
        },
        // 微信小程序登录
        async signIn() {
          // 微信小程序自动登录，不需要显式调用
          return true;
        },
        // 获取登录状态
        getLoginState() {
          return isLoggedIn() ? { user: {} } : null;
        },
        // 短信验证（小程序不支持，占位）
        getVerification() { return Promise.resolve(null); },
        signInWithSms() { return Promise.resolve(null); },
        signInAnonymously() { return Promise.resolve(null); },
      };
      setAuth(authInstance);
      setAuthRef(authInstance);
    }
  }, []);

  return (
    <CloudbaseContext.Provider value={{ cloudbaseApp, auth, db }}>
      {children}
    </CloudbaseContext.Provider>
  );
}

export function useCloudbase() {
  return useContext(CloudbaseContext);
}

export function useCloudbaseApp() {
  const context = useContext(CloudbaseContext);
  return context?.cloudbaseApp || null;
}

export function useAuth() {
  const context = useContext(CloudbaseContext);
  return context?.auth || null;
}

export function useDb() {
  const context = useContext(CloudbaseContext);
  return context?.db || null;
}
