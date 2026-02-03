import { useState, useEffect } from 'react';
import { Sender, XProvider } from '@ant-design/x';

export default function ChatInput({ onSend, isLoading, disabled, suggestionToFill, onSuggestionConsumed }) {
  const [inputValue, setInputValue] = useState('');

  // 点击系统推荐气泡时，将推荐内容填入输入框
  useEffect(() => {
    if (suggestionToFill != null && suggestionToFill !== '') {
      setInputValue(suggestionToFill);
      onSuggestionConsumed?.();
    }
  }, [suggestionToFill, onSuggestionConsumed]);

  const handleSubmit = (message) => {
    if (!message?.trim() || isLoading || disabled) return;
    onSend(message.trim());
    setInputValue('');
  };

  return (
    <XProvider theme={{
      token: {
        paddingSM: 6,
        colorPrimary: '#324155',
      },
    }}>
      <Sender
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        loading={isLoading}
        disabled={disabled || isLoading}
        placeholder="输入消息..."
        autoSize={{ minRows: 1, maxRows: 4 }}
        style={{
          border: 'none',
          boxShadow: 'none',
          backgroundColor: '#F3F4F6',
        }}
        styles={{
          input: {
            color: '#000000',
            fontSize: '16px',
            padding: '8px 10px',
            minHeight: '40px',
          },
          suffix: {
            paddingBottom: '3px',
          },
        }}
      />
    </XProvider>
  );
}

