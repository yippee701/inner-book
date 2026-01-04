import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';

// 组件
import StarryBackground from '../components/StarryBackground';
import EnergyRing from '../components/EnergyRing';
import MessageList from '../components/MessageList';
import WelcomeScreen from '../components/WelcomeScreen';
import ChatInput from '../components/ChatInput';

// Hook
import { useChat } from '../hooks/useChat';

// Ant Design 主题配置
const antdTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#8b5cf6',
    colorBgContainer: 'transparent',
    colorText: 'rgba(255, 255, 255, 0.9)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.6)',
  },
};

export default function Chat() {
  const [hasStarted, setHasStarted] = useState(false);
  const { messages, isLoading, sendUserMessage } = useChat();

  // 开始对话
  const handleStart = async () => {
    setHasStarted(true);
    await sendUserMessage('你好，我准备好了，请开始吧。');
  };

  return (
    <ConfigProvider theme={antdTheme}>
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#1a0a2e] to-[#0d1033] relative overflow-hidden flex flex-col">
        {/* 星空背景 */}
        <StarryBackground starCount={100} />
        
        {/* 顶部能量环 */}
        <div className="relative z-10 flex justify-center pt-8 pb-4 shrink-0">
          <EnergyRing size="md" />
        </div>

        {/* 聊天内容区 */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 md:px-6 pb-4">
          <div className="max-w-2xl mx-auto">
            {!hasStarted ? (
              <WelcomeScreen onStart={handleStart} isLoading={isLoading} />
            ) : (
              <MessageList messages={messages} />
            )}
          </div>
        </div>

        {/* 底部链接 */}
        <div className="relative z-10 text-center py-2 shrink-0">
          <Link to="/result" className="text-purple-300/60 hover:text-purple-300 transition-colors text-sm">
            查看结果
          </Link>
        </div>

        {/* 输入区域 */}
        {hasStarted && (
          <div className="relative z-10 px-4 pb-6 shrink-0">
            <ChatInput onSend={sendUserMessage} isLoading={isLoading} />
          </div>
        )}
      </div>
    </ConfigProvider>
  );
}
