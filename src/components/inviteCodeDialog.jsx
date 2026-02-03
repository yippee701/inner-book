import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 邀请码输入对话框
 */
export default function InviteCodeDialog({ isOpen, onClose, onSubmit, isLoading = false }) {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!inviteCode.trim()) {
      setError('请输入邀请码');
      return;
    }

    try {
      await onSubmit(inviteCode.trim());
      setInviteCode('');
    } catch (err) {
      setError(err.message || '邀请码验证失败');
    }
  };

  const handleClose = () => {
    setInviteCode('');
    setError('');
    onClose();
    navigate('/');
  };

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
        {/* 锁图标 */}
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
          style={{
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(139, 168, 255, 0.1))',
          }}
        >
          <svg className="w-8 h-8" style={{ color: '#8B5CF6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h3 
          className="text-lg mb-1"
          style={{
            fontWeight: 'bold',
            color: '#1F2937',
          }}
        >
          输入邀请码
        </h3>
        <p className="text-sm text-center mb-1" style={{ color: '#6B7280', maxWidth: '240px' }}>
          立刻解锁专属于你的INNER BOOK报告
        </p>
        
        {/* 输入框 */}
        <form onSubmit={handleSubmit} className="mb-2">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => {
              setInviteCode(e.target.value);
              setError('');
            }}
            placeholder="请输入邀请码"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-center text-lg tracking-wider"
            disabled={isLoading}
            autoFocus
          />
          
          {/* 错误提示 */}
          {error && (
            <p className="text-red-500 text-sm mt-2 text-left">{error}</p>
          )}
          
          {/* 按钮 */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl text-gray-600 bg-gray-100 font-medium transition-colors hover:bg-gray-200"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl text-white bg-gray-900 font-medium transition-colors hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? '验证中...' : '确认'}
            </button>
          </div>
        </form>
        <p
        className="mt-1 text-sm text-center"
        style={{ color: '#8B5CF6' }}>
          没有邀请码？立即上小红书关注 INNER BOOK 官方账号获取
        </p>
      </div>
    </div>
  );
}
