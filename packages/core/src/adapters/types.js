/**
 * 适配器接口定义（JSDoc 类型注释）
 *
 * 每个适配器需要实现对应的接口方法，各端按需注入。
 */

/**
 * @typedef {object} StorageAdapter
 * @property {(key: string) => string|null} getItem - 读取
 * @property {(key: string, value: string) => void} setItem - 写入
 * @property {(key: string) => void} removeItem - 删除
 */

/**
 * @typedef {object} RequestAdapter
 * @property {(url: string, options?: RequestOptions) => Promise<ResponseLike>} request - 发起请求
 *
 * RequestOptions 兼容 fetch 的子集：
 *   { method, headers, body, mode, credentials }
 *
 * ResponseLike 需要提供：
 *   { ok: boolean, status: number, json: () => Promise, body?: ReadableStream }
 */

/**
 * @typedef {object} ToastAdapter
 * @property {(msg: string, duration?: number) => void} info
 * @property {(msg: string) => void} success
 * @property {(msg: string) => void} error
 */

/**
 * @typedef {object} PlatformAdapter
 * @property {() => string} getUserAgent
 * @property {() => string} getLocationHref
 * @property {() => string} getDeviceId
 * @property {() => void} reloadPage
 * @property {(event: string, handler: Function) => void} addEventListener
 * @property {(event: string, handler: Function) => void} removeEventListener
 * @property {() => string} getPlatformName - 返回 'web' | 'miniprogram'
 */

/**
 * @typedef {object} EnvAdapter
 * @property {(key: string) => string|undefined} get - 获取环境变量
 */

export {};
