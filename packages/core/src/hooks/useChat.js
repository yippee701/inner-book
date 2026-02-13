import { useState, useCallback, useRef, useEffect } from 'react';
import { sendMessage, CHAT_MODES, isMockMode } from '../api/chat.js';
import { clearChatPrefetch } from '../utils/chatPrefetch.js';

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
 * @param {Function} options.onUserMessageSent - 用户发送消息后立即回调
 */
export function useChat(options = {}) {
  const { mode = CHAT_MODES.DISCOVER_SELF, initialMessages = [], onReportStart, onReportUpdate, onReportComplete, onReportError, onUserMessageSent } = options;
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const reportStartedRef = useRef(false);
  
  // 打字机缓冲区相关
  const bufferRef = useRef('');
  const displayedRef = useRef('');
  const isStreamingRef = useRef(false);
  const aiMsgIdRef = useRef(null);
  const timerRef = useRef(null);

  const clearTypewriterTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTypewriterTimer();
  }, [clearTypewriterTimer]);

  const startTypewriter = useCallback(() => {
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      if (displayedRef.current.length < bufferRef.current.length) {
        const remaining = bufferRef.current.length - displayedRef.current.length;
        const step = Math.min(Math.ceil(remaining / 10) + 1, 5);
        displayedRef.current = bufferRef.current.slice(0, displayedRef.current.length + step);
        
        const currentContent = displayedRef.current;
        const currentAiMsgId = aiMsgIdRef.current;

        if (!reportStartedRef.current && currentContent.includes('[Report]')) {
          reportStartedRef.current = true;
          onReportStart?.();
        }

        if (reportStartedRef.current) {
          onReportUpdate?.(currentContent);
        }

        setMessages(prev => prev.map(msg => 
          msg.id === currentAiMsgId 
            ? { ...msg, content: currentContent, status: 'loading' }
            : msg
        ));
      } else if (!isStreamingRef.current) {
        clearTypewriterTimer();
      }
    }, TYPEWRITER_SPEED);
  }, [clearTypewriterTimer, onReportStart, onReportUpdate]);

  const sendMessageInternal = useCallback(async (apiMessages, userMsgId = null, cachedContentOrPromise = null) => {
    if (isLoading) return;

    setIsLoading(true);
    reportStartedRef.current = false;

    bufferRef.current = '';
    displayedRef.current = '';
    clearTypewriterTimer();

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

    const MAX_AUTO_RETRIES = 1;
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_AUTO_RETRIES; attempt++) {
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
        const useTypewriterBuffer = !isMockMode();

        if (cachedContent) {
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
          await sendMessage(apiMessages, (streamContent) => {
            if (useTypewriterBuffer) {
              bufferRef.current = streamContent;
              startTypewriter();
            } else {
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

        isStreamingRef.current = false;

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

        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId 
            ? { ...msg, status: 'success' }
            : msg
        ));

        if (reportStartedRef.current) {
          onReportComplete?.();
        }

        lastError = null;
        break;

      } catch (error) {
        lastError = error;
        console.error(`发送消息失败 (第${attempt + 1}次):`, error);
        isStreamingRef.current = false;
        clearTypewriterTimer();
      }
    }

    if (lastError) {
      if (reportStartedRef.current) {
        onReportError?.(lastError);
      } else {
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

  const sendUserMessage = useCallback(async (userMessage, cachedResponse = null) => {
    if (!userMessage.trim() || isLoading) return;

    const newUserMsg = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      status: 'local'
    };
    
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);

    onUserMessageSent?.(updatedMessages);

    const apiMessages = updatedMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    await sendMessageInternal(apiMessages, newUserMsg.id, cachedResponse);
  }, [messages, isLoading, sendMessageInternal, onUserMessageSent]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const restoreMessages = useCallback((msgs) => {
    setMessages(msgs || []);
  }, []);

  const retryMessage = useCallback(async (failedMessageId) => {
    const failedMessage = messages.find(msg => msg.id === failedMessageId);
    if (!failedMessage || failedMessage.status !== 'error') {
      return;
    }

    const failedIndex = messages.findIndex(msg => msg.id === failedMessageId);
    const messagesToKeep = messages.slice(0, failedIndex + 1);
    setMessages(messagesToKeep);
    
    const apiMessages = messagesToKeep.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

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
