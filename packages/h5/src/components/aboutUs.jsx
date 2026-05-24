export default function AboutUsDialog({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center"
      style={{
        backdropFilter: 'blur(1px)',
      }}
    >
      <div
        className="flex flex-col items-center p-8 rounded-2xl mx-6"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(167, 139, 250, 0.2)',
        }}
      >
        {/* 图标 */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
          style={{
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(139, 168, 255, 0.1))',
          }}
        >
          <svg className="w-8 h-8" style={{ color: '#8B5CF6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h3
          className="text-lg mb-1"
          style={{
            fontWeight: 'bold',
            color: '#1F2937',
          }}
        >
          关于我们
        </h3>
        <p className="text-sm text-center mb-6" style={{ color: '#6B7280', maxWidth: '280px' }}>
          小红书关注 INNER BOOK 官方账号联系我们
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl text-white font-medium transition-colors hover:bg-black"
          style={{ backgroundColor: '#1F2937' }}
        >
          知道了
        </button>
      </div>
    </div>
  );
}
