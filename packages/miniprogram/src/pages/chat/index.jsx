import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import MessageList from '../../components/MessageList';
import WelcomeScreen from '../../components/WelcomeScreen';
import ChatInput from '../../components/ChatInput';
import { useChatPage } from '../../hooks/useChatPage';
import './index.scss';

export default function ChatPage() {
  const router = useRouter();
  const {
    hasStarted,
    pendingReport,
    showNoQuotaDialog,
    welcomeMessage,
    recommendedAnswers,
    progress,
    messages,
    isLoading,
    suggestionToFill,
    setSuggestionToFill,
    messageListRef,
    handleStart,
    handleResume,
    handleStartNew,
    sendUserMessage,
    retryMessage,
    closeNoQuotaDialog,
  } = useChatPage(router?.params);

  return (
    <View className='chat-page'>
      {/* 背景装饰 */}
      <View className='bg-glow bg-glow-1' />
      <View className='bg-glow bg-glow-2' />

      {/* 顶部标题栏 */}
      <View className='chat-header'>
        <View className='chat-header-back' onClick={() => Taro.navigateBack()}>
          <Text className='chat-header-back-icon'>←</Text>
        </View>
        <Text className='chat-header-title'>Talking with Dora</Text>
        <View className='chat-header-placeholder' />
      </View>

      {/* Progress 状态栏 */}
      <View className='chat-progress-bar'>
        <View className='chat-progress-orb' />
        <Text className='chat-progress-text'>Progress: {String(progress).padStart(2, '0')}/10</Text>
      </View>

      {/* 聊天内容区 */}
      <View className='chat-content'>
        {!hasStarted ? (
          <WelcomeScreen
            onStart={handleStart}
            onResume={handleResume}
            onStartNew={handleStartNew}
            hasPendingReport={!!pendingReport}
            welcomeMessage={welcomeMessage}
          />
        ) : (
          <MessageList
            ref={messageListRef}
            messages={messages}
            onRetry={retryMessage}
            recommendedAnswers={recommendedAnswers}
            onSuggestionClick={setSuggestionToFill}
          />
        )}
      </View>

      {/* 输入区域 */}
      {hasStarted && (
        <View className='chat-input-wrapper safe-area-bottom'>
          <ChatInput
            onSend={sendUserMessage}
            isLoading={isLoading}
            disabled={!hasStarted}
            suggestionToFill={suggestionToFill}
            onSuggestionConsumed={() => setSuggestionToFill(null)}
          />
        </View>
      )}

      {/* 次数不足弹窗 */}
      {showNoQuotaDialog && (
        <View className='dialog-mask' onClick={closeNoQuotaDialog}>
          <View className='dialog-content' onClick={(e) => e.stopPropagation()}>
            <Text className='dialog-title'>对话次数不足</Text>
            <Text className='dialog-desc'>您的对话次数已用完，请稍后再试。</Text>
            <View className='btn-primary dialog-btn' onClick={closeNoQuotaDialog}>
              <Text>返回首页</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
