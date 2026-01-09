import { useState } from 'react';

// 组件
import MessageList from '../components/MessageList';
import WelcomeScreen from '../components/WelcomeScreen';
import ChatInput from '../components/ChatInput';

// Hook
import { useChat } from '../hooks/useChat';

// 粒子图标组件
function ParticleIcon() {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      <div className="absolute w-8 h-8 rounded-full border border-[#8FA89B]/20 animate-breathe" />
      <div className="absolute w-[22px] h-[22px] rounded-full border border-[#8FA89B]/50 animate-breathe-reverse" />
      <div className="absolute w-3 h-3 rounded-full border border-[#8FA89B]/80 bg-[#8FA89B]/10" />
      <div className="w-1 h-1 rounded-full bg-[#8FA89B]" style={{ boxShadow: '0 0 8px rgba(143, 168, 155, 0.8)' }} />
    </div>
  );
}

// 环境光效果组件
function AmbientLight() {
  return (
    <div 
      className="absolute -top-24 -right-24 w-96 h-96 pointer-events-none"
      style={{
        background: 'radial-gradient(circle, rgba(143, 168, 155, 0.15) 0%, transparent 70%)',
      }}
    />
  );
}

// 纹理叠加层
function TextureOverlay() {
  return (
    <div 
      className="absolute inset-0 pointer-events-none opacity-40"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

export default function Chat() {
  const [hasStarted, setHasStarted] = useState(false);
  const { messages, isLoading, sendUserMessage } = useChat();
  
  // 计算当前问题进度（基于 AI 回复数量）
  const aiMessageCount = messages.filter(m => m.role === 'assistant').length;
  const progress = Math.min(aiMessageCount, 10);

  // 开始对话
  const handleStart = async () => {
    setHasStarted(true);
    await sendUserMessage('你好，我准备好了，请开始吧。');
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ backgroundColor: '#F5F1ED' }}
    >
      <TextureOverlay />
      <AmbientLight />

      {/* 顶部状态栏 */}
      <header 
        className="absolute top-0 left-0 right-0 h-[60px] px-6 flex justify-between items-center z-50"
        style={{
          background: 'rgba(245, 241, 237, 0.7)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <ParticleIcon />
        <span 
          className="text-sm tracking-wide"
          style={{ 
            fontFamily: 'monospace',
            color: '#8C8C8C',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          Progress: {String(progress).padStart(2, '0')}/10
        </span>
      </header>

      {/* 聊天内容区 */}
      <div className="relative z-10 flex-1 overflow-y-auto pt-[90px] pb-[140px] px-6">
        <div className="max-w-lg mx-auto">
          {!hasStarted ? (
            <WelcomeScreen onStart={handleStart} isLoading={isLoading} />
          ) : (
            <MessageList messages={messages} />
          )}
        </div>
      </div>

      {/* 输入区域 */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-20"
        style={{
          background: 'rgba(245, 241, 237, 0.9)',
          backdropFilter: 'blur(20px)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div className="px-6 pt-6 pb-2">
          <ChatInput 
            onSend={sendUserMessage} 
            isLoading={isLoading}
            disabled={!hasStarted}
          />
        </div>
        <p 
          className="text-center text-[10px] tracking-wide opacity-80 pb-7"
          style={{ color: '#A0A0A0' }}
        >
          点击输入框激活输入区 · 点击发送按钮发送消息
        </p>
      </div>
    </div>
  );
}
