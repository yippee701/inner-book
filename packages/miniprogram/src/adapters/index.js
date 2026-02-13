import { registerAdapters, initTracking } from '@know-yourself/core';
import { mpStorageAdapter } from './mpStorage';
import { mpRequestAdapter } from './mpRequest';
import { mpPlatformAdapter } from './mpPlatform';
import { mpEnvAdapter } from './mpEnv';
import { mpToastAdapter } from './mpToast';

/**
 * 初始化所有小程序适配器
 */
export function initMpAdapters() {
  registerAdapters({
    storage: mpStorageAdapter,
    request: mpRequestAdapter,
    platform: mpPlatformAdapter,
    env: mpEnvAdapter,
    toast: mpToastAdapter,
  });

  initTracking();
}
