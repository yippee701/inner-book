/**
 * 能量环组件 - 旋转发光的圆环动画效果
 */
export default function EnergyRing({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-24 h-24 md:w-32 md:h-32',
    md: 'w-32 h-32 md:w-40 md:h-40',
    lg: 'w-48 h-48 md:w-56 md:h-56',
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* 外层发光环 */}
      <div 
        className="absolute inset-0 rounded-full animate-spin-slow"
        style={{
          background: 'conic-gradient(from 0deg, #ff00ff, #00ffff, #8b5cf6, #ec4899, #ff00ff)',
          filter: 'blur(15px)',
          opacity: 0.5,
        }}
      />
      {/* 中间环 */}
      <div 
        className="absolute inset-3 rounded-full animate-spin-reverse"
        style={{
          background: 'conic-gradient(from 180deg, transparent, #00ffff, transparent, #ff00ff, transparent)',
          filter: 'blur(2px)',
        }}
      />
      {/* 内部深色圆 */}
      <div 
        className="absolute inset-6 rounded-full bg-[#0a0a1a]"
        style={{
          boxShadow: 'inset 0 0 40px rgba(139, 92, 246, 0.3)',
        }}
      />
    </div>
  );
}

