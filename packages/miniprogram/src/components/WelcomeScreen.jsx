import { View, Text } from '@tarojs/components';
import { trackClickEvent } from '@know-yourself/core';

/**
 * 欢迎界面组件（小程序版）
 */
export default function WelcomeScreen({
  onStart,
  onResume,
  onStartNew,
  hasPendingReport = false,
  welcomeMessage,
}) {
  return (
    <View className='welcome-screen'>
      <View className='welcome-inner'>
        {/* 欢迎消息 */}
        <View className='welcome-message'>
          <Text className='welcome-text'>{welcomeMessage}</Text>
        </View>

        {/* 按钮区域 */}
        <View className='welcome-buttons'>
          {hasPendingReport ? (
            <>
              <View className='btn-primary' onClick={onResume}>
                <Text>继续上次对话</Text>
              </View>
              <View className='welcome-secondary-btn' onClick={onStartNew}>
                <Text className='welcome-secondary-text'>开始新对话</Text>
              </View>
            </>
          ) : (
            <View className='btn-primary' onClick={onStart}>
              <Text>我知道了，开始吧</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
