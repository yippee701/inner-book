import { Link } from 'react-router-dom';

// ========== 子组件 ==========

/**
 * 噪点纹理背景
 */
function NoiseBackground() {
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

/**
 * 咖啡杯水印装饰
 */
function CoffeeWatermark() {
  return (
    <div 
      className="absolute bottom-48 -right-10 text-[200px] -rotate-[15deg] pointer-events-none select-none"
      style={{ color: '#3A3A3A', opacity: 0.03 }}
    >
      ☕
    </div>
  );
}

/**
 * 对话段落组件
 */
function DialogueParagraph({ dialogue, conclusion, isHighlighted = false }) {
  const content = (
    <>
      {dialogue.map((text, idx) => (
        <p 
          key={idx}
          className="text-lg leading-relaxed mb-3"
          style={{ 
            fontFamily: '"Noto Serif SC", serif',
            color: '#5d5d5d',
            lineHeight: '1.8',
          }}
        >
          "{text}"
        </p>
      ))}
      {conclusion && (
        <div 
          className="relative pl-6 mt-4"
          style={{ borderLeft: '2px solid #A8C5B8' }}
        >
          {conclusion.map((text, idx) => (
            <p 
              key={idx}
              className={`text-lg leading-relaxed ${idx > 0 ? 'mt-2 text-base opacity-90' : ''}`}
              style={{ 
                fontFamily: '"Noto Serif SC", serif',
                color: '#3A3A3A',
                lineHeight: '1.8',
              }}
            >
              {text}
            </p>
          ))}
        </div>
      )}
    </>
  );

  if (isHighlighted) {
    return (
      <div 
        className="mb-10 -mx-5 px-5 py-5 rounded-2xl"
        style={{
          background: 'linear-gradient(180deg, rgba(168, 197, 184, 0.02) 0%, rgba(168, 197, 184, 0.15) 100%)',
        }}
      >
        {content}
      </div>
    );
  }

  return <div className="mb-10">{content}</div>;
}

/**
 * 底部转化区组件
 */
function ConversionZone({ nickname }) {
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 h-60 flex flex-col items-center justify-end pb-8 z-50"
      style={{
        background: 'linear-gradient(to top, #F5F1ED 85%, rgba(245, 241, 237, 0) 100%)',
      }}
    >
      <div className="flex flex-col items-center gap-5 mb-5 w-full">
        {/* 邀请好友按钮 */}
        <div className="flex flex-col items-center gap-2">
          <button 
            className="w-44 h-12 rounded-3xl text-base transition-all active:scale-[0.98]"
            style={{
              fontFamily: '"Noto Serif SC", serif',
              color: '#3A3A3A',
              backgroundColor: 'rgba(245, 241, 237, 0.8)',
              border: '1px solid #A8C5B8',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 8px rgba(168, 197, 184, 0.15)',
            }}
          >
            邀请好友查看
          </button>
          <p 
            className="text-xs text-center underline underline-offset-2"
            style={{ color: '#9A9A9A', letterSpacing: '0.5px' }}
          >
            限时活动: 邀请好友注册成功，可免费升级当前 Inner Book
          </p>
        </div>

        {/* 升级按钮 */}
        <button 
          className="w-44 h-12 rounded-3xl text-base text-white transition-all active:scale-[0.98]"
          style={{
            fontFamily: '"Noto Serif SC", serif',
            backgroundColor: '#A8C5B8',
            boxShadow: '0 6px 16px rgba(168, 197, 184, 0.4)',
            letterSpacing: '1px',
          }}
        >
          升级 Inner Book
        </button>
      </div>

      {/* 签名 */}
      <div 
        className="flex items-center gap-1.5 text-xs tracking-widest uppercase"
        style={{ color: '#B0B0B0' }}
      >
        <span className="w-5 h-px" style={{ backgroundColor: '#D0D0D0' }} />
        <span>Inner Book Authenticity</span>
        <span className="w-5 h-px" style={{ backgroundColor: '#D0D0D0' }} />
      </div>
    </div>
  );
}

// ========== 主组件 ==========

export default function Result() {
  // 模拟数据 - 实际使用时从 API 获取
  const nickname = '探索者';
  
  const paragraphs = [
    {
      dialogue: [
        '你总说自己喜欢喝咖啡，是因为它能让你想起什么吗？',
        '我...其实不太确定，只是每次喝咖啡都觉得很放松',
      ],
      conclusion: ['这种矛盾的表达背后，藏着你对自我认知的不确定性。'],
      isHighlighted: false,
    },
    {
      dialogue: ['你渴望被理解，却又害怕被看透'],
      conclusion: [
        '这种矛盾构成了你最核心的内心冲突。',
        '就像一杯咖啡，表面平静，内里却翻涌着复杂的味道。',
      ],
      isHighlighted: true,
    },
    {
      dialogue: [
        '你习惯用温柔的外表包裹内心的困惑',
      ],
      conclusion: ['但这份善良，让你在关系中容易失去自我。'],
      isHighlighted: false,
    },
  ];

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ backgroundColor: '#F5F1ED' }}
    >
      <NoiseBackground />
      <CoffeeWatermark />

      {/* 顶部标题栏 */}
      <header 
        className="absolute top-5 left-5 right-5 h-[60px] flex items-center justify-center rounded-xl z-50"
        style={{
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
        }}
      >
        <h1 
          className="text-[22px]"
          style={{ 
            fontFamily: '"Noto Serif SC", serif',
            color: '#3A3A3A',
            letterSpacing: '0.5px',
          }}
        >
          {nickname}的 Inner Book
        </h1>
      </header>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pt-[110px] pb-[240px] px-8 relative z-10">
        <div className="max-w-lg mx-auto">
          {paragraphs.map((para, idx) => (
            <DialogueParagraph
              key={idx}
              dialogue={para.dialogue}
              conclusion={para.conclusion}
              isHighlighted={para.isHighlighted}
            />
          ))}
        </div>
      </div>

      {/* 底部转化区 */}
      <ConversionZone nickname={nickname} />
    </div>
  );
}

