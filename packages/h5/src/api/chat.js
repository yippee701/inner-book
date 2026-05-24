// Re-export from @know-yourself/core
export { CHAT_MODES, sendMessage, sendMessageWithTypewriter, chatWarmup, typewriterEffect, isMockMode } from '@know-yourself/core';

// 兼容旧代码：IS_MOCK_MODE 现在需要用 isMockMode() 函数判断
// 这里导出一个静态值只用于向后兼容，运行时请使用 isMockMode()
import { isMockMode as _isMockMode } from '@know-yourself/core';
export const IS_MOCK_MODE = false; // 静态兼容值，运行时用 isMockMode()
