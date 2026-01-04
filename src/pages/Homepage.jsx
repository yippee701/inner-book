import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';

export default function Homepage() {
  const canvasRef = useRef(null);

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

    // 星空粒子
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2,
      opacity: Math.random(),
      speed: Math.random() * 0.5 + 0.1,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach((star) => {
        star.opacity += (Math.random() - 0.5) * 0.02;
        star.opacity = Math.max(0.1, Math.min(1, star.opacity));
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#1a0a2e] to-[#0d1033] relative overflow-hidden">
      {/* 星空背景 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      
      {/* 主内容 */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        {/* 能量环 */}
        <div className="relative w-72 h-72 mb-8">
          {/* 外环发光 */}
          <div className="absolute inset-0 rounded-full animate-spin-slow"
            style={{
              background: 'conic-gradient(from 0deg, #ff00ff, #00ffff, #8b5cf6, #ec4899, #ff00ff)',
              filter: 'blur(20px)',
              opacity: 0.6,
            }}
          />
          {/* 主环 */}
          <div className="absolute inset-4 rounded-full animate-spin-reverse"
            style={{
              background: 'conic-gradient(from 180deg, transparent, #00ffff, transparent, #ff00ff, transparent)',
              filter: 'blur(3px)',
            }}
          />
          {/* 内环 */}
          <div className="absolute inset-8 rounded-full animate-pulse-glow"
            style={{
              background: 'conic-gradient(from 90deg, #8b5cf6, #06b6d4, #ec4899, #8b5cf6)',
              filter: 'blur(8px)',
              opacity: 0.8,
            }}
          />
          {/* 中心黑洞 */}
          <div className="absolute inset-16 rounded-full bg-[#0a0a1a]"
            style={{
              boxShadow: 'inset 0 0 60px rgba(139, 92, 246, 0.3)',
            }}
          />
          {/* 光点效果 */}
          <div className="absolute top-4 left-1/2 w-3 h-3 bg-white rounded-full animate-twinkle"
            style={{ filter: 'blur(1px)', boxShadow: '0 0 20px #fff' }}
          />
          <div className="absolute bottom-8 right-8 w-2 h-2 bg-cyan-400 rounded-full animate-twinkle-delay"
            style={{ filter: 'blur(1px)', boxShadow: '0 0 15px #06b6d4' }}
          />
          <div className="absolute top-1/3 left-4 w-2 h-2 bg-fuchsia-500 rounded-full animate-twinkle"
            style={{ filter: 'blur(1px)', boxShadow: '0 0 15px #d946ef' }}
          />
        </div>

        {/* 标题 */}
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4 tracking-wide"
          style={{ textShadow: '0 0 40px rgba(139, 92, 246, 0.5)' }}>
          发现你
        </h1>
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6 tracking-wide"
          style={{ textShadow: '0 0 40px rgba(139, 92, 246, 0.5)' }}>
          真正的天赋
        </h1>

        {/* 副标题 */}
        <p className="text-lg text-purple-200/80 text-center mb-16 tracking-wider">
          一场对话，解锁你的心灵之书
        </p>

        {/* 开启对话按钮 */}
        <Link
          to="/chat"
          className="relative group px-12 py-4 rounded-full text-white text-lg font-medium transition-all duration-300"
        >
          {/* 按钮背景 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 group-hover:border-purple-400/50 transition-all" />
          {/* 按钮发光效果 */}
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
            }}
          />
          <span className="relative z-10">开启对话</span>
        </Link>
      </div>
    </div>
  );
}

