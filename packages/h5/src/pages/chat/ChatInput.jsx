import { useState } from 'react';
import { Sender, XProvider } from '@ant-design/x';

export default function ChatInput({ onSend, isLoading, disabled }) {
  const [inputValue, setInputValue] = useState('');

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
