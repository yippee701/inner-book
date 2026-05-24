/**
 * 适配器注册中心
 *
 * 各端（Web / 小程序）在启动时调用 registerAdapter 注入平台实现，
 * core 内部通过 getAdapter 获取，实现业务逻辑与平台解耦。
 *
 * 示例：
 *   import { registerAdapter } from '@know-yourself/core/adapters';
 *   registerAdapter('storage', webStorageAdapter);
 */

const adapters = {};

/**
 * 注册适配器
 * @param {string} name - 适配器名称（storage / request / toast / platform / env）
 * @param {object} implementation - 适配器实现对象
 */
export function registerAdapter(name, implementation) {
  adapters[name] = implementation;
}

/**
 * 批量注册适配器
 * @param {Record<string, object>} map - { name: implementation }
 */
export function registerAdapters(map) {
  Object.entries(map).forEach(([name, impl]) => {
    adapters[name] = impl;
  });
}

/**
 * 获取适配器（内部使用）
 * @param {string} name
 * @returns {object}
 */
export function getAdapter(name) {
  const adapter = adapters[name];
  if (!adapter) {
    console.warn(`[core] Adapter "${name}" not registered. Some features may not work.`);
    return null;
  }
  return adapter;
}
