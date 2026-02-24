import { createContext, useContext, useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { isLoggedIn } from '@know-yourself/core';
import { setCloudbaseApp as setTrackCloudbaseApp } from '@know-yourself/core';
import { setAuthRef } from '@know-yourself/core';
import { mpRequestAdapter } from '../adapters/mpRequest';
import { wrapMpDb } from '../adapters/mpDb';
import { setOpenid } from '../utils/openidStore';

const CloudbaseContext = createContext(null);

/**
 * 小程序版 Cloudbase Provider
 * 使用 wx.cloud（微信云开发）
 */
export function CloudbaseProvider({ children }) {
  const [cloudbaseApp, setCloudbaseApp] = useState(null);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [openidReady, setOpenidReady] = useState(false);

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
      mpRequestAdapter.setCloudApp(cloudApp);

      // 一进 app 即获取 openid，用于后续所有请求
      
      Taro.cloud.callFunction({
        name: 'get-openid',
        complete: (res) => {
          console.log('callFunction result: ', res);
          const result = res?.result;
          const id = typeof result === 'object' && result !== null ? result.openid : result;
          if (id) {
            setOpenid(id);
            setOpenidReady(true);
          }
        },
      });

      // 小程序端 db：包装为与 H5 一致的 (res, data) 回调，便于 ReportContext 等跨端复用
      const dbInstance = wrapMpDb(Taro.cloud.database());
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
    <CloudbaseContext.Provider value={{ cloudbaseApp, auth, db, openidReady }}>
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

export function useRdb() {
  const context = useContext(CloudbaseContext);
  return context?.rdb || null;
}

export function useOpenidReady() {
  const context = useContext(CloudbaseContext);
  return context?.openidReady ?? false;
}
