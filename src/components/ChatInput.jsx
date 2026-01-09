import { useState } from 'react';
import { Sender } from '@ant-design/x';

/**
 * 聊天输入组件 - 使用 @ant-design/x Sender 实现
 * @see https://x.ant.design/components/sender
 */
export default function ChatInput({ onSend, isLoading, disabled }) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (message) => {
    if (!message?.trim() || isLoading || disabled) return;
    onSend(message.trim());
    setInputValue('');
  };

  return (
    <Sender
      value={inputValue}
      onChange={setInputValue}
      onSubmit={handleSubmit}
      loading={isLoading}
      disabled={disabled}
      placeholder="输入消息..."
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid rgba(0, 0, 0, 0.03)',
        boxShadow: '0 2px 8px rgba(143, 168, 155, 0.08)',
      }}
      styles={{
        input: {
          fontFamily: '"Noto Sans SC", sans-serif',
          color: '#3A3A3A',
          fontSize: '14px',
          padding: '4px 10px',
          minHeight: '36px',
        },
        suffix: {
          color: '#8FA89B',
        },
      }}
    />
  );
}

