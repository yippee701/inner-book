import { View, Text } from '@tarojs/components';

/**
 * 消息气泡组件（小程序版，替代 antd Bubble）
 */
export default function MessageBubble({ message, onRetry }) {
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'loading';
  const isError = message.status === 'error';
  const isLoading = isStreaming && !message.content;

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
        <Text className={`bubble-text ${isUser ? 'bubble-text-user' : 'bubble-text-ai'}`}>
          {message.content}
        </Text>
      </View>
      {isError && (
        <View className='bubble-error-row'>
          <Text className='bubble-error-icon'>⚠️</Text>
          <Text className='bubble-retry-btn' onClick={() => onRetry?.(message.id)}>重新发送</Text>
        </View>
      )}
    </View>
  );
}
