import Taro from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import MessageBubble from './MessageBubble';
import { useLoadingSteps } from '@know-yourself/core';

function AnimatedDots() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);
  return <Text className='animated-dots'>{dots}</Text>;
}

function LoadingSteps({ isFirstRound }) {
  const { steps, stepIndex } = useLoadingSteps(isFirstRound, 3);
  return (
    <View className='bubble-row bubble-row-ai'>
      <View className='bubble bubble-ai bubble-loading'>
        <View className='loading-indicator'>
          <View className='loading-dot' />
          <Text className='loading-text'>
            {steps[stepIndex]}
            <AnimatedDots />
          </Text>
        </View>
      </View>
    </View>
  );
}

const MessageList = forwardRef(function MessageList({ messages, onRetry }, ref) {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollWithAnimation, setScrollWithAnimation] = useState(false);
  const lastMessage = messages[messages.length - 1];
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const lastUserMessageIndex = messages.reduce((lastIndex, message, index) => (
    message.role === 'user' ? index : lastIndex
  ), -1);
  const isStreaming = lastMessage?.status === 'loading';

  // 滚动到底部
  const scrollToBottom = useCallback((animated = false) => {
    Taro.nextTick(() => {
      const query = Taro.createSelectorQuery();
      query.select('.message-list').boundingClientRect();
      query.exec((res) => {
        const height = res?.[0]?.height ?? 0;
        setScrollWithAnimation(animated);
        setScrollTop(height);
      });
    });
  }, []);

  useImperativeHandle(ref, () => ({ scrollToBottom }), [scrollToBottom]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (!isStreaming) return;
    scrollToBottom(false);
  }, [lastMessage?.content, isStreaming, scrollToBottom]);

  return (
    <ScrollView
      scrollY
      scrollTop={scrollTop}
      scrollWithAnimation={scrollWithAnimation}
      padding={[0, 24, 0, 24]}
      className='message-list-scroll'
      enhanced
      showScrollbar={false}
    >
      <View className='message-list'>
        {messages.map((msg, index) => {
          const isLoading = msg.status === 'loading' && !msg.content;

          if (isLoading) {
            return <LoadingSteps key={msg.id || index} isFirstRound={userMessageCount === 1} />;
          }

          return (
            <MessageBubble
              key={msg.id || index}
              message={msg}
              onRetry={onRetry}
              canCopy={index === lastUserMessageIndex}
            />
          );
        })}

        <View id='msg-end' className='msg-end-anchor' />
      </View>
    </ScrollView>
  );
});

export default MessageList;
