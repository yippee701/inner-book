import { View, Text, ScrollView } from '@tarojs/components';
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
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

const MessageList = forwardRef(function MessageList({
  messages, onRetry, recommendedAnswers = [], onSuggestionClick,
}, ref) {
  const [scrollIntoView, setScrollIntoView] = useState('');
  const lastMessage = messages[messages.length - 1];
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const isStreaming = lastMessage?.status === 'loading';

  // 推荐逻辑
  const currentRoundIndex = userMessageCount - 1;
  const currentRoundSuggestion = Array.isArray(recommendedAnswers) && currentRoundIndex >= 0 && currentRoundIndex <= 2
    ? recommendedAnswers[currentRoundIndex]
    : null;

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    setScrollIntoView('msg-end');
    setTimeout(() => setScrollIntoView(''), 100);
  }, []);

  useImperativeHandle(ref, () => ({ scrollToBottom }), [scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, lastMessage?.content, scrollToBottom]);

  return (
    <ScrollView
      scrollY
      scrollIntoView={scrollIntoView}
      scrollWithAnimation
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
            />
          );
        })}

        {/* 推荐气泡 */}
        {currentRoundSuggestion && lastMessage?.role === 'assistant' && !isStreaming && (
          <View className='suggestion-bubble'>
            <Text className='suggestion-text'>
              你上次这样回答过：{currentRoundSuggestion}
            </Text>
            <Text className='suggestion-action' onClick={() => onSuggestionClick?.(currentRoundSuggestion)}>
              输入
            </Text>
          </View>
        )}

        <View id='msg-end' className='msg-end-anchor' />
      </View>
    </ScrollView>
  );
});

export default MessageList;
