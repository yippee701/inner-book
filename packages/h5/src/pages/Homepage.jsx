import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useProfile, checkCanStartChat } from '../hooks/useProfile';
import NoQuotaDialog from '../components/NoQuotaDialog';
import { trackVisitEvent } from '../utils/track';
import { CHAT_MODES } from '../constants/modes';

// 轮播文字配置
const CAROUSEL_TEXTS = [
  { title: '发现你的天赋', subtitle: '探索内在潜力与独特优势 ✨' },
  { title: '了解更真实的他', subtitle: '深度洞察人际关系本质 💫' },
  { title: '解决你的社交难题', subtitle: '智能分析与精准建议 🎯' },
];

const SELF_MODE_OPTIONS = [
  {
    mode: CHAT_MODES.DISCOVER_SELF,
    title: '发现天赋',
    subtitle: '找到你的底层天赋',
  },
  {
    mode: CHAT_MODES.REDUCE_INNER_FRICTION,
    title: '消除内耗',
    subtitle: '拆解反复消耗你的念头',
  },
  {
    mode: CHAT_MODES.LIFE_CHOICE,
    title: '人生选择器',
    subtitle: '推演选择、代价与行动',
  },
];

const PEOPLE_MODE_OPTIONS = [
  {
    mode: CHAT_MODES.UNDERSTAND_OTHERS,
    title: '读懂亲友',
    subtitle: '看懂亲友与身边人的底层动机',
  },
  {
    mode: CHAT_MODES.UNDERSTAND_CHILD,
    title: '读懂孩子',
    subtitle: '理解孩子的底色与需要',
  },
  {
    mode: CHAT_MODES.UNDERSTAND_LOVER,
    title: '读懂爱人',
    subtitle: '看见亲密关系的互动模式',
  },
];

function ModeDialog({ title, description, options, onSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 px-5 pb-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 text-center">
          <h3 className="text-xl font-medium text-gray-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
        </div>
        <div className="flex flex-col gap-3">
          {options.map((option) => (
            <button
              key={option.mode}
              type="button"
              onClick={() => onSelect(option.mode)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors active:bg-gray-100"
            >
              <span className="block text-base font-medium text-gray-900">{option.title}</span>
              <span className="mt-1 block text-sm text-gray-500">{option.subtitle}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Homepage() {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [showNoQuotaDialog, setShowNoQuotaDialog] = useState(false);
  const [showSelfModeDialog, setShowSelfModeDialog] = useState(false);
  const [showPeopleModeDialog, setShowPeopleModeDialog] = useState(false);
  
  // 获取用户信息
  const { isLoggedIn, userExtraInfo } = useProfile();

  // 检查是否可以开始对话
  const handleStartChat = useCallback((mode) => {
    if (!checkCanStartChat(isLoggedIn, userExtraInfo)) {
      setShowNoQuotaDialog(true);
      return;
    }
    navigate(`/chat?mode=${mode}`);
    trackVisitEvent('start_chat', { mode });
  }, [isLoggedIn, userExtraInfo, navigate]);

  const handleSelectMode = useCallback((mode) => {
    setShowSelfModeDialog(false);
    setShowPeopleModeDialog(false);
    handleStartChat(mode);
  }, [handleStartChat]);

  // 文字轮播效果
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % CAROUSEL_TEXTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Canvas 粒子动画
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 柔和漂浮粒子
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.4 + 0.2,
      speedY: (Math.random() - 0.5) * 0.3,
      speedX: (Math.random() - 0.5) * 0.2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity += (Math.random() - 0.5) * 0.01;
        p.opacity = Math.max(0.1, Math.min(0.5, p.opacity));
        
        // 边界循环
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${p.opacity})`;
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      className="h-screen-safe relative overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, rgba(243, 244, 246, 0.5), rgba(243, 232, 255, 0.4) 50%, rgba(249, 250, 251, 0.6))',
      }}
    >
      {/* 粒子背景 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      
      {/* 顶部导航栏 */}
      <header className="relative z-20 flex items-center justify-between px-6 pt-4 pb-8 max-w-lg mx-auto">
        <div className="w-10" />
        <Link 
          to="/profile" 
          className="p-2 hover:bg-gray-200/50 rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>
      </header>
      
      {/* 主内容 */}
      <div className="relative z-10 flex flex-col justify-center min-h-[80vh] max-w-lg mx-auto">
        {/* 中央球体区域 */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="relative flex flex-col items-center justify-center w-full">
            {/* 3D 玻璃球体 */}
            <div className="relative w-56 h-56 mb-12 animate-breathe">
              {/* 底部阴影 */}
              <div 
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-40 h-8 rounded-full blur-2xl animate-breathe-shadow"
                style={{ background: 'rgba(167, 139, 250, 0.15)' }}
              />

              {/* 主球体容器 */}
              <div className="relative w-full h-full rounded-full">
                {/* 外层发光 - 扩散效果 */}
                <div 
                  className="absolute inset-0 rounded-full blur-3xl animate-glow-pulse"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(167, 139, 250, 0.6), rgba(139, 168, 255, 0.5) 50%, rgba(147, 197, 253, 0.4) 80%, transparent)',
                  }}
                />

                {/* 二层发光 - 脉冲效果 */}
                <div 
                  className="absolute inset-0 rounded-full blur-2xl animate-glow-pulse-delayed"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(196, 181, 253, 0.5), rgba(167, 139, 250, 0.4) 60%, transparent)',
                  }}
                />
                
                {/* 玻璃球体基底 */}
                <div 
                  className="absolute inset-2 rounded-full blur-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(196, 181, 253, 0.8) 0%, rgba(139, 168, 255, 0.85) 40%, rgba(167, 139, 250, 0.75) 100%)',
                    boxShadow: '0 20px 50px rgba(139, 92, 246, 0.2), inset 0 0 50px rgba(255, 255, 255, 0.2)',
                  }}
                />

                {/* 流动渐变层 1 */}
                <div
                  className="absolute inset-2 rounded-full blur-sm animate-rotate-slow"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, rgba(167, 139, 250, 0.6) 20%, rgba(139, 168, 255, 0.7) 40%, rgba(147, 197, 253, 0.6) 60%, transparent 80%)',
                    opacity: 0.6,
                  }}
                />

                {/* 流动渐变层 2 - 反向旋转 */}
                <div
                  className="absolute inset-2 rounded-full blur-sm animate-rotate-slow-reverse"
                  style={{
                    background: 'conic-gradient(from 90deg, transparent 0%, rgba(196, 181, 253, 0.5) 30%, rgba(167, 139, 250, 0.6) 50%, transparent 70%)',
                    opacity: 0.5,
                  }}
                />

                {/* 磨砂玻璃层 */}
                <div 
                  className="absolute inset-4 rounded-full backdrop-blur-sm"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.7), rgba(221, 214, 254, 0.45) 35%, rgba(196, 181, 253, 0.35) 70%, transparent 95%)',
                  }}
                />

                {/* 顶部高光 */}
                <div 
                  className="absolute top-10 left-10 w-32 h-18 rounded-full blur-xl animate-highlight-pulse"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.95), transparent 65%)',
                  }}
                />

                {/* 流光效果 */}
                <div
                  className="absolute inset-0 rounded-full opacity-50 animate-shimmer"
                  style={{
                    background: 'linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.15) 40%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0.15) 60%, transparent 100%)',
                  }}
                />

                {/* 粒子光点 */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-white/60 rounded-full blur-sm animate-particle"
                    style={{
                      top: `${20 + Math.sin(i * 1.047) * 30}%`,
                      left: `${50 + Math.cos(i * 1.047) * 35}%`,
                      animationDelay: `${i * 0.5}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* 文字轮播区域 */}
            <div className="relative h-24 flex flex-col items-center justify-start w-full max-w-sm">
              {CAROUSEL_TEXTS.map((item, index) => (
                <div
                  key={item.title}
                  className={`absolute inset-0 flex flex-col items-center justify-start gap-2 transition-all duration-700 ${
                    index === currentTextIndex 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-4'
                  }`}
                >
                  <h2 
                    className="text-2xl font-medium"
                    style={{ color: '#1F2937' }}
                  >
                    {item.title}
                  </h2>
                  <p 
                    className="text-base"
                    style={{ color: 'rgba(107, 114, 128, 0.9)' }}
                  >
                    {item.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部按钮区域 */}
        <div className="fixed bottom-0 left-0 right-0 pb-12 pt-6 px-6 z-20">
          <div className="flex gap-3 items-center justify-center w-full max-w-md mx-auto">
            {/* 识人按钮 */}
            <button 
              onClick={() => setShowPeopleModeDialog(true)}
              className="btn-primary flex-1 text-base font-medium transition-all duration-300 active:scale-[0.99] hover:shadow-xl"
            >
              识人
            </button>

            {/* 识己按钮 */}
            <button 
              onClick={() => setShowSelfModeDialog(true)}
              className="btn-primary flex-1 text-base font-medium transition-all duration-300 active:scale-[0.99] hover:shadow-xl"
            >
              识己
            </button>
          </div>
        </div>
      </div>

      {showSelfModeDialog && (
        <ModeDialog
          title="识己"
          description="选择你想先看清自己的哪一面"
          options={SELF_MODE_OPTIONS}
          onSelect={handleSelectMode}
          onClose={() => setShowSelfModeDialog(false)}
        />
      )}

      {showPeopleModeDialog && (
        <ModeDialog
          title="识人"
          description="选择你想理解的对象"
          options={PEOPLE_MODE_OPTIONS}
          onSelect={handleSelectMode}
          onClose={() => setShowPeopleModeDialog(false)}
        />
      )}

      {/* 对话次数不足弹窗 */}
      <NoQuotaDialog 
        isOpen={showNoQuotaDialog} 
        onClose={() => setShowNoQuotaDialog(false)} 
      />
    </div>
  );
}
