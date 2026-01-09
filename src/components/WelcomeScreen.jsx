import { WELCOME_MESSAGE } from '../api/chat';

/**
 * 欢迎界面组件 - 显示欢迎消息和开始按钮（Quiet Luxury 风格）
 */
export default function WelcomeScreen({ onStart, isLoading }) {
  return (
    <div className="text-center">
      {/* 欢迎消息 */}
      <div className="text-left mb-10">
        <p 
          className="text-lg leading-relaxed whitespace-pre-wrap"
          style={{ 
            fontFamily: '"Noto Serif SC", serif',
            color: '#3A3A3A',
            letterSpacing: '0.02em',
            lineHeight: '1.8',
          }}
        >
          {WELCOME_MESSAGE}
        </p>
      </div>
      
      {/* 开始按钮 */}
      <div className="mt-12">
        <button
          onClick={onStart}
          disabled={isLoading}
          className="relative px-10 py-4 rounded-full text-white text-lg font-medium transition-all duration-300 active:scale-[0.98] disabled:opacity-60"
          style={{
            backgroundColor: '#8FA89B',
            boxShadow: '0 10px 25px rgba(143, 168, 155, 0.3)',
          }}
        >
          {/* 高光效果 */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 100%)',
            }}
          />
          <span className="relative z-10">
            {isLoading ? '正在连接...' : '我知道了，开始吧'}
          </span>
        </button>
      </div>
    </div>
  );
}

