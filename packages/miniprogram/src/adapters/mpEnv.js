/**
 * 小程序端 Env 适配器
 * 通过配置对象提供环境变量（小程序没有 import.meta.env）
 */

const ENV_CONFIG = {
  // 生产环境 API 地址
  SERVER_URL: 'https://inner-book.top',
  // mock 模式
  MOCK_MODE: 'true',
  // API 模式
  API_MODE: 'proxy',
};

export const mpEnvAdapter = {
  get(key) {
    return ENV_CONFIG[key];
  },
};
