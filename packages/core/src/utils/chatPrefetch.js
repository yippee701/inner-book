/**
 * 首轮对话预热模块
 *
 * 在用户进入 welcome 页面时，提前向大模型发送首轮消息并缓存响应，
 * 从而减少用户点击"开始"后的等待时间。
 */
import { sendMessage } from '../api/chat.js';

const PREFETCH_MESSAGE = '你好，我准备好了，请开始吧。';

let _promise = null;
let _result = null;
let _mode = null;

/**
 * 开始预热首轮对话
 * @param {string} mode - 聊天模式
 */
export function startChatPrefetch(mode) {
  if (_mode === mode && (_promise || _result)) return;

  _result = null;
  _mode = mode;
  _promise = sendMessage(
    [{ role: 'user', content: PREFETCH_MESSAGE }],
    () => {},
    mode,
  )
    .then((content) => {
      _result = content;
      console.log('[Prefetch] 首轮预热完成, 内容长度:', content?.length);
      return content;
    })
    .catch((err) => {
      console.warn('[Prefetch] 首轮预热失败:', err);
      _result = null;
      return null;
    });
}

/**
 * 获取预热结果
 * @param {string} mode - 聊天模式
 * @returns {Promise<string|null>}
 */
export async function getChatPrefetchResult(mode) {
  if (_mode !== mode) return null;
  if (_result !== null) return _result;
  if (_promise) {
    try {
      return await _promise;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * 清除预热缓存
 */
export function clearChatPrefetch() {
  _promise = null;
  _result = null;
  _mode = null;
}
