import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

// 轮播文字
const CAROUSEL_TEXTS = [
  '发现你的天赋',
  '了解更真实的他',
  '解决你的社交难题',
];

export default function Homepage() {
  const canvasRef = useRef(null);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

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
        ctx.fillStyle = `rgba(156, 175, 136, ${p.opacity})`;
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
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: '#F5F1ED',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(156, 175, 136, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(155, 174, 200, 0.15) 0%, transparent 40%)
        `,
      }}
    >
      {/* 粒子背景 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      
      {/* 顶部导航栏 */}
      <nav 
        className="absolute top-0 left-0 right-0 h-16 flex justify-between items-center px-6 z-20"
        style={{
          background: 'rgba(245, 241, 237, 0.7)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        <span 
          className="text-lg font-semibold tracking-wide"
          style={{ 
            color: '#2C2C2C',
            fontFamily: '"Noto Serif SC", serif',
          }}
        >
          天赋发现
        </span>
        <Link to="/profile" className="text-xl text-gray-700 hover:text-gray-900 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </nav>
      
      {/* 主内容 */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        {/* 光圈效果 */}
        <div className="relative w-72 h-72 mb-8 flex items-center justify-center">
          {/* 外层光圈 */}
          <div 
            className="absolute w-72 h-72 rounded-full animate-breathe"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)',
              border: '1px solid rgba(156, 175, 136, 0.3)',
              boxShadow: '0 0 30px rgba(255,255,255,0.2)',
            }}
          />
          {/* 中层光圈 */}
          <div 
            className="absolute w-60 h-60 rounded-full animate-breathe-reverse"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(2px)',
              border: '1px solid rgba(155, 174, 200, 0.3)',
            }}
          />
          {/* 内层光圈（玻璃态） */}
          <div 
            className="absolute w-48 h-48 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.35)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.08)',
            }}
          />
          
          {/* 漂浮光点 */}
          <div 
            className="absolute top-[20%] left-[30%] w-1.5 h-1.5 bg-white rounded-full animate-float"
            style={{ filter: 'blur(1px)', opacity: 0.7 }}
          />
          <div 
            className="absolute bottom-[25%] right-[20%] w-2 h-2 bg-white rounded-full animate-float-delay"
            style={{ filter: 'blur(1px)', opacity: 0.6 }}
          />
          <div 
            className="absolute top-[15%] right-[35%] w-1 h-1 bg-white rounded-full animate-float"
            style={{ filter: 'blur(1px)', opacity: 0.5 }}
          />
          <div 
            className="absolute bottom-[15%] left-[40%] w-1.5 h-1.5 bg-white rounded-full animate-float-delay-2"
            style={{ filter: 'blur(1px)', opacity: 0.6 }}
          />

          {/* 文字轮播 */}
          <div className="relative z-10 w-44 h-16 flex items-center justify-center">
            {CAROUSEL_TEXTS.map((text, index) => (
              <span
                key={text}
                className={`absolute text-xl font-medium tracking-wide transition-all duration-700 ${
                  index === currentTextIndex 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-3 scale-95'
                }`}
                style={{ 
                  color: '#2C2C2C',
                  fontFamily: '"Noto Serif SC", serif',
                  textShadow: '0 2px 4px rgba(255,255,255,0.8)',
                }}
              >
                {text}
              </span>
            ))}
          </div>
        </div>

        {/* 底部按钮区域 */}
        <div className="flex gap-4 mt-8">
          {/* 了解他人按钮 */}
          <Link
            to="/chat?mode=understand-others"
            className="group flex flex-col items-center gap-3"
          >
            <button 
              className="relative w-44 h-14 rounded-full text-white text-lg font-medium overflow-hidden transition-transform active:scale-[0.98]"
              style={{
                backgroundColor: '#9CAF88',
                boxShadow: '0 10px 25px rgba(156, 175, 136, 0.3)',
              }}
            >
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 100%)',
                }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 7a3 3 0 100 6 3 3 0 000-6z" />
                </svg>
                了解他人
              </span>
            </button>
            <span className="text-xs text-gray-500 opacity-80">深度解析与洞察</span>
          </Link>

          {/* 发掘自己按钮 */}
          <Link
            to="/chat?mode=discover-self"
            className="group flex flex-col items-center gap-3"
          >
            <button 
              className="relative w-44 h-14 rounded-full text-white text-lg font-medium overflow-hidden transition-transform active:scale-[0.98]"
              style={{
                backgroundColor: '#9BAEC8',
                boxShadow: '0 10px 25px rgba(155, 174, 200, 0.3)',
              }}
            >
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 100%)',
                }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                发掘自己
              </span>
            </button>
            <span className="text-xs text-gray-500 opacity-80">内在潜能探索</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

