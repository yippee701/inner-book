import { WELCOME_MESSAGE } from '../../api/chat';

/**
 * 欢迎界面组件 - 显示欢迎消息和开始按钮（Quiet Luxury 风格）
 * @param {Function} onStart - 开始按钮点击回调
 * @param {string} welcomeMessage - 欢迎消息（可选，默认使用挖掘自己的消息）
 */
export default function WelcomeScreen({ onStart, welcomeMessage = WELCOME_MESSAGE }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
      {/* 欢迎消息 */}
      <div className="text-left mb-6">
        <p 
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ 
            fontFamily: '"Noto Serif SC", serif',
            color: '#3A3A3A',
            letterSpacing: '0.01em',
            lineHeight: '2.5',
          }}
        >
          {welcomeMessage}
        </p>
      </div>
      
      {/* 开始按钮 */}
      <div className="mt-6">
        <button
          onClick={onStart}
          className="relative top-12 px-8 py-3 rounded-full text-white text-base font-medium transition-all duration-300 active:scale-[0.98] disabled:opacity-60"
          style={{
            backgroundColor: '#324155',
            boxShadow: '0 6px 16px rgba(143, 168, 155, 0.25)',
          }}
        >
          {/* 高光效果 */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
            }}
          />
          <span className="relative z-10">
            {'我知道了，开始吧'}
          </span>
        </button>
      </div>
      </div>
    </div>
  );
}

