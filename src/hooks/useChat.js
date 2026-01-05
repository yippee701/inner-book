import { useState, useCallback } from 'react';
import { sendMessage } from '../api/chat';

/**
 * 聊天逻辑 Hook - 管理消息状态和 API 调用
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 发送消息给大模型
  const sendUserMessage = useCallback(async (userMessage) => {
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
    setIsLoading(true);

    // 添加 AI 消息占位符
    const aiMsgId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      status: 'loading'
    }]);

    try {
      // 构建发送给 API 的消息格式
      const apiMessages = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // 调用 sendMessage，使用流式回调更新内容
      await sendMessage(apiMessages, (streamContent) => {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId 
            ? { ...msg, content: streamContent, status: 'loading' }
            : msg
        ));
      });

      // 完成后只更新状态，不再设置 content（content 已通过流式回调完整更新）
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, status: 'success' }
          : msg
      ));

    } catch (error) {
      console.error('发送消息失败:', error);
      // 移除失败的 AI 消息
      setMessages(prev => prev.filter(msg => msg.id !== aiMsgId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendUserMessage,
    clearMessages,
  };
}

