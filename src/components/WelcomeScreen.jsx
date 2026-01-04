import { WELCOME_MESSAGE } from '../api/chat';

/**
 * 欢迎界面组件 - 显示欢迎消息和开始按钮
 */
export default function WelcomeScreen({ onStart, isLoading }) {
  return (
    <div className="text-center">
      <div className="inline-block max-w-[90%] md:max-w-[85%] p-4 rounded-2xl bg-transparent text-left">
        <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
          {WELCOME_MESSAGE}
        </p>
      </div>
      
      {/* 开始按钮 */}
      <div className="mt-8">
        <button
          onClick={onStart}
          disabled={isLoading}
          className="relative group px-10 py-4 rounded-full text-white text-lg font-medium transition-all duration-300"
        >
          {/* 按钮背景 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 group-hover:border-purple-400/50 transition-all" />
          {/* 按钮发光效果 */}
          <div 
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
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

