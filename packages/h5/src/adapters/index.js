/**
 * Web 端适配器统一注册
 *
 * 在应用入口（main.jsx）中尽早调用 initWebAdapters()，
 * 确保 core 中的模块在使用适配器时已完成注册。
 */
import { registerAdapters, initTracking } from '@know-yourself/core';

import { webStorageAdapter } from './webStorage.js';
import { webRequestAdapter } from './webRequest.js';
import { webToastAdapter } from './webToast.js';
import { webPlatformAdapter } from './webPlatform.js';
import { webEnvAdapter } from './webEnv.js';

/**
 * 初始化所有 Web 适配器
 */
export function initWebAdapters() {
  registerAdapters({
    storage: webStorageAdapter,
    request: webRequestAdapter,
    toast: webToastAdapter,
    platform: webPlatformAdapter,
    env: webEnvAdapter,
  });

  // 初始化埋点系统（注册全局错误监听等）
  initTracking();
}
