import { useState, useCallback, useRef, useEffect } from 'react';
import { sendMessage, CHAT_MODES, IS_MOCK_MODE } from '../api/chat';
import { clearChatPrefetch } from '../utils/chatPrefetch';

// 打字机速度配置（毫秒/字符）
const TYPEWRITER_SPEED = 15;

/**
 * 聊天逻辑 Hook - 管理消息状态和 API 调用
 * @param {Object} options - 配置选项
 * @param {string} options.mode - 聊天模式：'discover-self' | 'understand-others'
 * @param {Array} options.initialMessages - 初始消息（用于恢复对话）
 * @param {Function} options.onReportStart - 检测到 [Report] 开头时的回调
 * @param {Function} options.onReportUpdate - 报告内容更新时的回调
 * @param {Function} options.onReportComplete - 报告生成完成时的回调
 * @param {Function} options.onReportError - 报告生成过程中请求失败时的回调
 * @param {Function} options.onUserMessageSent - 用户发送消息后立即回调（参数为包含新用户消息的 messages，用于实时落库）
 */
export function useChat(options = {}) {
  const { mode = CHAT_MODES.DISCOVER_SELF, initialMessages = [], onReportStart, onReportUpdate, onReportComplete, onReportError, onUserMessageSent } = options;
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const reportStartedRef = useRef(false);
  
  // 打字机缓冲区相关
  const bufferRef = useRef('');           // 已收到但未显示的内容
  const displayedRef = useRef('');        // 已显示的内容
  const isStreamingRef = useRef(false);   // 是否正在流式输出
  const aiMsgIdRef = useRef(null);        // 当前 AI 消息 ID
  const timerRef = useRef(null);          // 打字机定时器

  // 清理打字机定时器
  const clearTypewriterTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => clearTypewriterTimer();
  }, [clearTypewriterTimer]);

  // 启动打字机效果
  const startTypewriter = useCallback(() => {
    if (timerRef.current) return; // 已经在运行

    timerRef.current = setInterval(() => {
      // 如果有未显示的内容
      if (displayedRef.current.length < bufferRef.current.length) {
        // 每次显示更多字符（加速追赶）
        const remaining = bufferRef.current.length - displayedRef.current.length;
        const step = Math.min(Math.ceil(remaining / 10) + 1, 5); // 动态步长，最多5个字符
        displayedRef.current = bufferRef.current.slice(0, displayedRef.current.length + step);
        
        const currentContent = displayedRef.current;
        const currentAiMsgId = aiMsgIdRef.current;

        // 检测报告开始（[Report] 可能出现在开头或中间）
        if (!reportStartedRef.current && currentContent.includes('[Report]')) {
          reportStartedRef.current = true;
          onReportStart?.();
        }

        // 更新报告内容
        if (reportStartedRef.current) {
          onReportUpdate?.(currentContent);
        }

        // 更新消息状态
        setMessages(prev => prev.map(msg => 
          msg.id === currentAiMsgId 
            ? { ...msg, content: currentContent, status: 'loading' }
            : msg
        ));
      } else if (!isStreamingRef.current) {
        // 流式结束且所有内容都显示完了
        clearTypewriterTimer();
      }
    }, TYPEWRITER_SPEED);
  }, [clearTypewriterTimer, onReportStart, onReportUpdate]);

  // 内部方法：发送消息给大模型（不添加用户消息）
  // cachedContentOrPromise: 可选。string 用缓存；Promise<string|null> 先展示 loading，resolve 后用缓存或发真实请求；null 发真实请求
  const sendMessageInternal = useCallback(async (apiMessages, userMsgId = null, cachedContentOrPromise = null) => {
    if (isLoading) return;

    setIsLoading(true);
    reportStartedRef.current = false;

    // 重置打字机缓冲区
    bufferRef.current = '';
    displayedRef.current = '';
    clearTypewriterTimer();

    // 先同步添加 AI 消息占位符，再 resolve 缓存（这样进入 message list 时立刻能看到用户消息 + loading）
    const aiMsgId = Date.now() + 1;
    aiMsgIdRef.current = aiMsgId;
    setMessages(prev => {
      const updated = userMsgId 
        ? prev.map(msg => msg.id === userMsgId ? { ...msg, status: 'local' } : msg)
        : prev;
      return [...updated, {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        status: 'loading'
      }];
    });

    // 若传入的是 Promise（首轮 prefetch），先不阻塞，等 resolve 后再用缓存或发请求
    const isPromise = typeof cachedContentOrPromise?.then === 'function';
    let cachedContent = isPromise ? null : (cachedContentOrPromise ?? null);
    if (isPromise) {
      try {
        cachedContent = await cachedContentOrPromise;
        clearChatPrefetch();
      } catch {
        cachedContent = null;
        clearChatPrefetch();
      }
    }

    isStreamingRef.current = !cachedContent;

    // 自动重试：首次失败后静默重试一次，全部失败再走错误逻辑
    const MAX_AUTO_RETRIES = 1;
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_AUTO_RETRIES; attempt++) {
      // 重试前重置打字机 & AI 占位符
      if (attempt > 0) {
        console.warn(`发送消息失败，正在自动重试 (${attempt}/${MAX_AUTO_RETRIES})...`);
        bufferRef.current = '';
        displayedRef.current = '';
        clearTypewriterTimer();
        isStreamingRef.current = true;
        setMessages(prev => prev.map(msg =>
          msg.id === aiMsgId ? { ...msg, content: '', status: 'loading' } : msg
        ));
      }

      try {
        // 判断是否使用打字机缓冲（mock 模式已有打字机效果，不需要缓冲）
        const useTypewriterBuffer = !IS_MOCK_MODE;

        if (cachedContent) {
          // 使用预热缓存的响应内容
          if (useTypewriterBuffer) {
            bufferRef.current = cachedContent;
            startTypewriter();
          } else {
            if (!reportStartedRef.current && cachedContent.includes('[Report]')) {
              reportStartedRef.current = true;
              onReportStart?.();
            }
            if (reportStartedRef.current) {
              onReportUpdate?.(cachedContent);
            }
            setMessages(prev => prev.map(msg =>
              msg.id === aiMsgId
                ? { ...msg, content: cachedContent, status: 'loading' }
                : msg
            ));
          }
        } else {
          // 调用 sendMessage，使用流式回调更新内容，传递聊天模式
          await sendMessage(apiMessages, (streamContent) => {
            if (useTypewriterBuffer) {
              // 真实 API：将内容放入缓冲区，启动打字机
              bufferRef.current = streamContent;
              startTypewriter();
            } else {
              // Mock 模式：直接更新（mock 已有打字机效果）
              if (!reportStartedRef.current && streamContent.includes('[Report]')) {
                reportStartedRef.current = true;
                onReportStart?.();
              }
              if (reportStartedRef.current) {
                onReportUpdate?.(streamContent);
              }
              setMessages(prev => prev.map(msg => 
                msg.id === aiMsgId 
                  ? { ...msg, content: streamContent, status: 'loading' }
                  : msg
              ));
            }
          }, mode);
        }

        // 标记流式输出结束
        isStreamingRef.current = false;

        // 如果使用打字机缓冲，等待所有内容显示完成
        if (useTypewriterBuffer) {
          await new Promise(resolve => {
            const checkComplete = setInterval(() => {
              if (displayedRef.current.length >= bufferRef.current.length) {
                clearInterval(checkComplete);
                resolve();
              }
            }, 50);
          });
        }

        // 完成后只更新状态
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId 
            ? { ...msg, status: 'success' }
            : msg
        ));

        // 如果是报告，调用完成回调
        if (reportStartedRef.current) {
          onReportComplete?.();
        }

        lastError = null;
        break; // 成功，跳出重试循环

      } catch (error) {
        lastError = error;
        console.error(`发送消息失败 (第${attempt + 1}次):`, error);
        isStreamingRef.current = false;
        clearTypewriterTimer();
        // 如果还有重试机会，继续循环
      }
    }

    // 所有重试都失败
    if (lastError) {
      if (reportStartedRef.current) {
        // 报告生成过程中失败：通知上层
        onReportError?.(lastError);
      } else {
        // 普通消息失败：删除 AI 消息占位符，标记用户消息为失败状态
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== aiMsgId);
          if (userMsgId) {
            return filtered.map(msg =>
              msg.id === userMsgId
                ? { ...msg, status: 'error' }
                : msg
            );
          }
          return filtered;
        });
      }
    }

    setIsLoading(false);
  }, [isLoading, mode, onReportStart, onReportUpdate, onReportComplete, onReportError, clearTypewriterTimer, startTypewriter]);

  // 发送消息给大模型
  // cachedResponse: 可选，预热缓存的 AI 回复内容；传入时跳过 API 调用
  const sendUserMessage = useCallback(async (userMessage, cachedResponse = null) => {
    if (!userMessage.trim() || isLoading) return;

    // 添加用户消息
    const newUserMsg = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      status: 'local'
    };
    
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);

    // 用户消息加入后立即通知（在 AI 占位符加入前），保证最后一次输入被实时保存到本地
    onUserMessageSent?.(updatedMessages);

    // 构建发送给 API 的消息格式
    const apiMessages = updatedMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    await sendMessageInternal(apiMessages, newUserMsg.id, cachedResponse);
  }, [messages, isLoading, sendMessageInternal, onUserMessageSent]);

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // 设置消息（用于恢复对话）
  const restoreMessages = useCallback((msgs) => {
    setMessages(msgs || []);
  }, []);

  // 重新发送失败的消息
  const retryMessage = useCallback(async (failedMessageId) => {
    // 找到失败的消息
    const failedMessage = messages.find(msg => msg.id === failedMessageId);
    if (!failedMessage || failedMessage.status !== 'error') {
      return;
    }

    // 找到失败消息的索引
    const failedIndex = messages.findIndex(msg => msg.id === failedMessageId);
    
    // 保留失败消息及其之前的所有消息，移除失败消息之后的所有消息（包括可能存在的 AI 占位符）
    const messagesToKeep = messages.slice(0, failedIndex + 1); // +1 表示包含失败消息本身
    setMessages(messagesToKeep);
    
    // 构建发送给 API 的消息格式（包含失败消息）
    const apiMessages = messagesToKeep.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // 直接调用内部发送方法，不添加新的用户消息
    await sendMessageInternal(apiMessages, failedMessageId);
  }, [messages, sendMessageInternal]);

  return {
    messages,
    isLoading,
    sendUserMessage,
    clearMessages,
    restoreMessages,
    retryMessage,
  };
}

