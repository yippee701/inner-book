import Taro from '@tarojs/taro';

/**
 * 小程序端 Request 适配器
 * 将 wx.request 封装为类似 fetch Response 的接口
 */
export const mpRequestAdapter = {
  request(url, options = {}) {
    return new Promise((resolve, reject) => {
      const header = { ...(options.headers || {}) };
      let data = options.body;

      // 如果 body 是 JSON 字符串，解析为对象（wx.request 会自动序列化对象）
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          // 保持原样
        }
      }

      Taro.request({
        url,
        method: (options.method || 'GET').toUpperCase(),
        header,
        data,
        responseType: options.responseType || 'text',
        enableChunked: !!options.stream, // 小程序分块传输
        success(res) {
          // 构造类 fetch Response 对象
          const response = {
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: '',
            headers: res.header || {},
            json() {
              return Promise.resolve(
                typeof res.data === 'string' ? JSON.parse(res.data) : res.data
              );
            },
            text() {
              return Promise.resolve(
                typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
              );
            },
            // 小程序不支持 ReadableStream，流式由 RequestTask.onChunkReceived 处理
            body: null,
          };
          resolve(response);
        },
        fail(err) {
          reject(new Error(err.errMsg || '网络请求失败'));
        },
      });
    });
  },

  /**
   * 流式请求（小程序专用）
   * 返回 RequestTask，调用方通过 onChunkReceived 接收数据
   */
  requestStream(url, options = {}) {
    const header = { ...(options.headers || {}) };
    let data = options.body;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch {}
    }

    return Taro.request({
      url,
      method: (options.method || 'POST').toUpperCase(),
      header,
      data,
      enableChunked: true,
    });
  },
};
