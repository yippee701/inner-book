import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';

export default function Result() {
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

    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach((star) => {
        star.opacity += (Math.random() - 0.5) * 0.01;
        star.opacity = Math.max(0.1, Math.min(0.5, star.opacity));
        
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

  const resultContent = {
    title: '真理捕捉者',
    sections: [
      {
        heading: '第一部分：你的核心天赋——真理捕捉者',
        content: `我将你的核心天赋命名为"真理捕捉者"。这是一个复合型天赋，由三个密不可分的核心模块构成：

创造引擎：源自你童年时自驱的绘画与编故事。它让你本能地从无到有构建新事物，无论是故事、画面，还是一个解决方案的雏形。它不产出细节，而是……`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#1a0a2e] to-[#0d1033] relative overflow-hidden flex flex-col">
      {/* 星空背景 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      
      {/* 顶部能量环 */}
      <div className="relative z-10 flex justify-center pt-8 pb-6">
        <div className="relative w-44 h-44">
          <div className="absolute inset-0 rounded-full animate-spin-slow"
            style={{
              background: 'conic-gradient(from 0deg, #ff00ff, #00ffff, #8b5cf6, #ec4899, #ff00ff)',
              filter: 'blur(15px)',
              opacity: 0.5,
            }}
          />
          <div className="absolute inset-3 rounded-full animate-spin-reverse"
            style={{
              background: 'conic-gradient(from 180deg, transparent, #00ffff, transparent, #ff00ff, transparent)',
              filter: 'blur(2px)',
            }}
          />
          <div className="absolute inset-6 rounded-full animate-pulse-glow"
            style={{
              background: 'conic-gradient(from 90deg, #8b5cf6, #06b6d4, #ec4899, #8b5cf6)',
              filter: 'blur(6px)',
              opacity: 0.7,
            }}
          />
          <div className="absolute inset-10 rounded-full bg-[#0a0a1a]"
            style={{
              boxShadow: 'inset 0 0 40px rgba(139, 92, 246, 0.3)',
            }}
          />
        </div>
      </div>

      {/* 结果内容区 */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6">
        <div className="max-w-2xl mx-auto">
          {/* 主标题 */}
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8"
            style={{ textShadow: '0 0 30px rgba(139, 92, 246, 0.4)' }}>
            你好，{resultContent.title}
          </h1>

          {/* 内容区块 */}
          {resultContent.sections.map((section, idx) => (
            <div key={idx} className="mb-8">
              <h2 className="text-lg text-purple-200 mb-4 font-medium">
                {section.heading}
              </h2>
              <div className="text-white/85 leading-relaxed whitespace-pre-wrap">
                {section.content}
                <button className="ml-2 text-purple-300/60 hover:text-purple-300 transition-colors inline-flex items-center">
                  🔊
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部按钮区 */}
      <div className="relative z-10 px-6 pb-8 pt-4">
        <div className="max-w-2xl mx-auto flex gap-4">
          {/* 重新对话按钮 */}
          <Link
            to="/chat"
            className="flex-1 relative group py-4 rounded-xl text-center"
          >
            <div className="absolute inset-0 rounded-xl bg-transparent border border-purple-500/40 group-hover:border-purple-400/60 transition-all"
              style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)' }}
            />
            <span className="relative z-10 text-purple-200 font-medium">重新对话</span>
          </Link>
          
          {/* 保存按钮 */}
          <button
            className="flex-1 relative group py-4 rounded-xl text-center"
          >
            <div className="absolute inset-0 rounded-xl bg-transparent border border-purple-500/40 group-hover:border-purple-400/60 transition-all"
              style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)' }}
            />
            <span className="relative z-10 text-purple-200 font-medium">保存</span>
          </button>
        </div>
      </div>
    </div>
  );
}

