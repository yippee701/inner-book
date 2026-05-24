import { trackClickEvent } from '../../utils/track';

/**
 * 欢迎界面组件 - 显示欢迎消息和开始按钮（Quiet Luxury 风格）
 * @param {Function} onStart - 开始按钮点击回调
 * @param {Function} onResume - 继续上次对话回调
 * @param {Function} onStartNew - 开始新对话回调
 * @param {boolean} hasPendingReport - 是否有未完成的报告
 * @param {string} welcomeMessage - 欢迎消息（可选，默认使用挖掘自己的消息）
 */
export default function WelcomeScreen({ 
  onStart, 
  onResume, 
  onStartNew,
  hasPendingReport = false,
  welcomeMessage,
}) {
  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8 overflow-y-auto">
      <div className="flex-shrink-0">
        {/* 欢迎消息 */}
        <div className="text-left mb-8">
          <p 
            className="text-base text-dora leading-relaxed whitespace-pre-wrap"
            style={{ 
              color: '#3A3A3A',
              letterSpacing: '0.01em',
              lineHeight: '1.6',
            }}
          >
            {welcomeMessage}
          </p>
        </div>
        
        {/* 按钮区域 - 固定在内容底部 */}
        <div className="flex flex-col items-center gap-3 pb-4">
          {hasPendingReport ? (
            <>
              {/* 有未完成对话时显示两个按钮 */}
              <button
                onClick={onResume}
                className="btn-primary relative text-base font-medium transition-all duration-300 active:scale-[0.98]"
              >
                继续上次对话
              </button>
              <button
                onClick={onStartNew}
                className="px-6 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                开始新对话
              </button>
            </>
          ) : (
            /* 没有未完成对话时显示原始按钮 */
            <button
              onClick={onStart}
              className="btn-primary relative mt-4 text-base font-medium transition-all duration-300 active:scale-[0.98] disabled:opacity-60"
            >
              {'我知道了，开始吧'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

