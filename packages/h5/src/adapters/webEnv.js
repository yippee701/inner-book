/**
 * Web 端 Env 适配器 - 基于 Vite 的 import.meta.env
 *
 * Vite 环境变量约定以 VITE_ 开头，适配器对外统一去掉 VITE_ 前缀。
 * 例如：env.get('SERVER_URL') → import.meta.env.VITE_SERVER_URL
 */
export const webEnvAdapter = {
  get(key) {
    return import.meta.env[`VITE_${key}`];
  },
};
