import Taro from '@tarojs/taro';
import { View, Text, RichText } from '@tarojs/components';
import { markdownToHtml } from '@know-yourself/core';

/**
 * 消息气泡组件（小程序版，替代 antd Bubble）
 */
export default function MessageBubble({ message, onRetry, canCopy = false }) {
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'loading';
  const isError = message.status === 'error';
  const isLoading = isStreaming && !message.content;
  const markdownContent = !isUser && typeof message.content === 'string'
    ? markdownToHtml(message.content)
    : '';

  const handleCopy = () => {
    const content = typeof message.content === 'string' ? message.content : '';
    if (!content.trim()) return;
    Taro.setClipboardData({
      data: content,
      success: () => {
        Taro.showToast({ title: '已复制', icon: 'success', duration: 1200 });
      },
      fail: () => {
        Taro.showToast({ title: '复制失败', icon: 'none' });
      },
    });
  };

  if (isLoading) {
    return (
      <View className='bubble-row bubble-row-ai'>
        <View className='bubble bubble-ai bubble-loading'>
          <View className='loading-indicator'>
            <View className='loading-dot' />
            <Text className='loading-text'>Dora 正在思考...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={`bubble-row ${isUser ? 'bubble-row-user' : 'bubble-row-ai'}`}>
      <View className={`bubble ${isUser ? 'bubble-user' : 'bubble-ai'}`}>
        {isUser ? (
          <Text className={`bubble-text ${isUser ? 'bubble-text-user' : 'bubble-text-ai'}`}>
            {message.content}
          </Text>
        ) : (
          <RichText nodes={markdownContent} className='bubble-rich' />
        )}
      </View>
      {(canCopy || isError) && (
        <View className={`bubble-action-row ${isUser ? 'bubble-action-row-user' : 'bubble-action-row-ai'}`}>
          {isError && <Text className='bubble-error-text'>发送失败</Text>}
          {canCopy && (
            <View
              className='bubble-copy-btn'
              aria-label='复制'
              onClick={handleCopy}
            />
          )}
          {isError && (
            <Text className='bubble-retry-btn' onClick={() => onRetry?.(message.id)}>重新发送</Text>
          )}
        </View>
      )}
    </View>
  );
}
