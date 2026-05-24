import { View, Textarea, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';

/**
 * 聊天输入组件（小程序版，替代 antd Sender）
 */
export default function ChatInput({ onSend, isLoading, disabled, suggestionToFill, onSuggestionConsumed }) {
  const [inputValue, setInputValue] = useState('');

  // 推荐内容填入
  useEffect(() => {
    if (suggestionToFill != null && suggestionToFill !== '') {
      setInputValue(suggestionToFill);
      onSuggestionConsumed?.();
    }
  }, [suggestionToFill]);

  const handleSubmit = () => {
    const msg = inputValue.trim();
    if (!msg || isLoading || disabled) return;
    onSend(msg);
    setInputValue('');
  };

  return (
    <View className='chat-input-container'>
      <View className='chat-input-row'>
        <Textarea
          className='chat-input-textarea'
          value={inputValue}
          onInput={(e) => setInputValue(e.detail.value)}
          placeholder='输入消息...'
          placeholderClass='chat-input-placeholder'
          autoHeight
          maxlength={2000}
          disabled={disabled || isLoading}
          confirmType='send'
          onConfirm={handleSubmit}
          adjustPosition
          showConfirmBar={false}
          cursorSpacing={20}
        />
        <View
          className={`chat-send-btn ${(!inputValue.trim() || isLoading || disabled) ? 'chat-send-btn-disabled' : ''}`}
          onClick={handleSubmit}
        >
          {isLoading ? (
            <View className='send-loading' />
          ) : (
            <Text className='send-icon'>↑</Text>
          )}
        </View>
      </View>
      <View className='chat-input-tip'>
        <Text className='chat-input-tip-text'>推荐使用输入法的语音输入功能</Text>
      </View>
    </View>
  );
}
