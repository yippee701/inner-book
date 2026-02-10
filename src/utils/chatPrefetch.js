/**
 * 首轮对话预热模块
 *
 * 在用户进入 welcome 页面时，提前向大模型发送首轮消息并缓存响应，
 * 从而减少用户点击"开始"后的等待时间。
 *
 * 预热失败时：_result 保持为 null，getChatPrefetchResult 返回 null，
 * 调用方（Chat handleStartNew）会走正常 API 请求，首轮对话照常可用。
 *
 * 使用方式：
 *  1. startChatPrefetch(mode)  —— 页面加载时调用
 *  2. getChatPrefetchResult(mode) —— 用户开始新对话时获取缓存
 *  3. clearChatPrefetch() —— 清除缓存（恢复对话或组件卸载时）
 */
import { sendMessage } from '../api/chat';

const PREFETCH_MESSAGE = '你好，我准备好了，请开始吧。';

let _promise = null;
let _result = null;
let _mode = null;

/**
 * 开始预热首轮对话（在 welcome 页面加载时调用）
 * @param {string} mode - 聊天模式
 */
export function startChatPrefetch(mode) {
  // 如果已经有相同 mode 的预热在进行或已完成，则跳过
  if (_mode === mode && (_promise || _result)) return;

  _result = null;
  _mode = mode;
  _promise = sendMessage(
    [{ role: 'user', content: PREFETCH_MESSAGE }],
    () => {}, // 使用流式模式（与正常对话一致），忽略中间回调
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
 * 获取预热结果（如果还在进行中则等待完成）
 * @param {string} mode - 聊天模式，与 startChatPrefetch 传入的保持一致
 * @returns {Promise<string|null>} 预热的 AI 回复内容，若失败或 mode 不匹配返回 null
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
