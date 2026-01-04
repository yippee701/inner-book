import { useEffect, useRef } from 'react';
import { Bubble } from "@ant-design/x";

// 气泡样式配置
const aiBubbleStyles = {
  content: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '16px',
    padding: '12px 16px',
    maxWidth: '85%',
  },
};

const userBubbleStyles = {
  content: {
    background: 'rgba(139, 92, 246, 0.3)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    color: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '16px',
    padding: '12px 16px',
    maxWidth: '85%',
  },
};

/**
 * 消息列表组件 - 展示聊天消息气泡
 */
export default function MessageList({ messages }) {
  const messagesEndRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="space-y-4 pb-4">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const isLoading = msg.status === 'loading';
        
        return (
          <Bubble
            key={msg.id || index}
            placement={isUser ? 'end' : 'start'}
            loading={isLoading && !msg.content}
            content={msg.content}
            typing={!isUser && isLoading && msg.content ? { step: 2, interval: 100, keepPrefix: true } : undefined}
            styles={isUser ? userBubbleStyles : aiBubbleStyles}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

