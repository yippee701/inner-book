import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// ========== 常量配置 ==========

const COUNTDOWN_SECONDS = 60; // 验证码倒计时秒数

// ========== 子组件 ==========

/**
 * 背景装饰组件
 */
function BackgroundDecoration() {
  return (
    <>
      {/* 渐变光晕 */}
      <div 
        className="absolute top-0 right-0 w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(168, 197, 184, 0.2) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(155, 174, 200, 0.15) 0%, transparent 70%)',
          transform: 'translate(-40%, 40%)',
        }}
      />
      
      {/* 漂浮光点 */}
      <div 
        className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full animate-float"
        style={{ backgroundColor: 'rgba(168, 197, 184, 0.4)' }}
      />
      <div 
        className="absolute top-[35%] right-[20%] w-1.5 h-1.5 rounded-full animate-float-delay"
        style={{ backgroundColor: 'rgba(155, 174, 200, 0.4)' }}
      />
      <div 
        className="absolute bottom-[30%] left-[25%] w-1 h-1 rounded-full animate-float-delay-2"
        style={{ backgroundColor: 'rgba(168, 197, 184, 0.3)' }}
      />
    </>
  );
}

/**
 * Logo 组件
 */
function Logo() {
  return (
    <div className="flex flex-col items-center mb-12">
      {/* 光圈 Logo */}
      <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
        <div 
          className="absolute w-24 h-24 rounded-full animate-breathe"
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(168, 197, 184, 0.4)',
          }}
        />
        <div 
          className="absolute w-16 h-16 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.4)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
          }}
        />
        <svg 
          className="relative z-10 w-8 h-8"
          style={{ color: '#A8C5B8' }}
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
        </svg>
      </div>
      
      <h1 
        className="text-2xl font-bold tracking-wide"
        style={{ 
          fontFamily: '"Noto Serif SC", serif',
          color: '#3A3A3A',
        }}
      >
        天赋发现
      </h1>
      <p 
        className="text-sm mt-2"
        style={{ color: '#888' }}
      >
        发现你的内在潜能
      </p>
    </div>
  );
}

/**
 * 手机号输入框
 */
function PhoneInput({ value, onChange, disabled }) {
  return (
    <div className="mb-4">
      <label 
        className="block text-sm mb-2"
        style={{ color: '#666' }}
      >
        手机号
      </label>
      <div 
        className="flex items-center px-4 py-3 rounded-xl transition-all"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(168, 197, 184, 0.3)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        }}
      >
        <span className="text-gray-400 mr-2">+86</span>
        <div className="w-px h-5 bg-gray-200 mr-3" />
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 11))}
          placeholder="请输入手机号"
          disabled={disabled}
          className="flex-1 outline-none bg-transparent text-base"
          style={{ 
            fontFamily: '"Noto Sans SC", sans-serif',
            color: '#3A3A3A',
          }}
        />
      </div>
    </div>
  );
}

/**
 * 验证码输入框
 */
function CodeInput({ value, onChange, onSendCode, countdown, disabled, canSendCode }) {
  return (
    <div className="mb-6">
      <label 
        className="block text-sm mb-2"
        style={{ color: '#666' }}
      >
        验证码
      </label>
      <div 
        className="flex items-center px-4 py-3 rounded-xl transition-all"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(168, 197, 184, 0.3)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="请输入验证码"
          disabled={disabled}
          maxLength={6}
          className="flex-1 outline-none bg-transparent text-base tracking-widest"
          style={{ 
            fontFamily: '"Noto Sans SC", sans-serif',
            color: '#3A3A3A',
          }}
        />
        <button
          onClick={onSendCode}
          disabled={!canSendCode || countdown > 0}
          className="text-sm px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
          style={{
            backgroundColor: canSendCode && countdown === 0 ? 'rgba(168, 197, 184, 0.15)' : 'transparent',
            color: canSendCode && countdown === 0 ? '#A8C5B8' : '#999',
            fontWeight: 500,
          }}
        >
          {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
        </button>
      </div>
    </div>
  );
}

/**
 * 提交按钮
 */
function SubmitButton({ onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-4 rounded-xl text-white text-lg font-medium transition-all active:scale-[0.98] disabled:opacity-60"
      style={{
        backgroundColor: '#A8C5B8',
        boxShadow: disabled ? 'none' : '0 8px 20px rgba(168, 197, 184, 0.3)',
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          登录中...
        </span>
      ) : (
        '登录 / 注册'
      )}
    </button>
  );
}

/**
 * 协议提示
 */
function Agreement() {
  return (
    <p 
      className="text-center text-xs mt-6 leading-relaxed"
      style={{ color: '#999' }}
    >
      登录即表示同意
      <a href="#" className="mx-1" style={{ color: '#A8C5B8' }}>《用户协议》</a>
      和
      <a href="#" className="mx-1" style={{ color: '#A8C5B8' }}>《隐私政策》</a>
    </p>
  );
}

// ========== 主页面组件 ==========

export default function UserAuthPage() {
  const navigate = useNavigate();
  
  // 表单状态
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 手机号格式验证
  const isValidPhone = /^1[3-9]\d{9}$/.test(phone);
  
  // 是否可以发送验证码
  const canSendCode = isValidPhone && countdown === 0;
  
  // 是否可以提交
  const canSubmit = isValidPhone && code.length === 6;

  // 倒计时逻辑
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    if (!canSendCode) return;
    
    setError('');
    
    try {
      // TODO: 调用发送验证码 API
      console.log('发送验证码到:', phone);
      
      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // 开始倒计时
      setCountdown(COUNTDOWN_SECONDS);
      
    } catch (err) {
      setError('验证码发送失败，请稍后重试');
      console.error('发送验证码失败:', err);
    }
  }, [canSendCode, phone]);

  // 登录/注册
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || loading) return;
    
    setError('');
    setLoading(true);
    
    try {
      // TODO: 调用登录/注册 API
      console.log('登录/注册:', { phone, code });
      
      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // 登录成功，跳转首页
      navigate('/');
      
    } catch (err) {
      setError('登录失败，请检查验证码是否正确');
      console.error('登录失败:', err);
    } finally {
      setLoading(false);
    }
  }, [canSubmit, loading, phone, code, navigate]);

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ backgroundColor: '#F5F1ED' }}
    >
      <BackgroundDecoration />
      
      {/* 顶部返回按钮 */}
      <header className="relative z-10 h-14 flex items-center px-5">
        <Link 
          to="/"
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 transition-colors"
          style={{ color: '#666' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      </header>
      
      {/* 主内容区 */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 pb-10">
        {/* Logo */}
        <Logo />
        
        {/* 表单 */}
        <div className="w-full max-w-sm mx-auto">
          {/* 错误提示 */}
          {error && (
            <div 
              className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
              }}
            >
              {error}
            </div>
          )}
          
          {/* 手机号输入 */}
          <PhoneInput 
            value={phone}
            onChange={setPhone}
            disabled={loading}
          />
          
          {/* 验证码输入 */}
          <CodeInput
            value={code}
            onChange={setCode}
            onSendCode={handleSendCode}
            countdown={countdown}
            disabled={loading}
            canSendCode={canSendCode}
          />
          
          {/* 提交按钮 */}
          <SubmitButton
            onClick={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
          />
          
          {/* 协议提示 */}
          <Agreement />
        </div>
      </div>
      
      {/* 底部装饰线 */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(168, 197, 184, 0.3), transparent)',
        }}
      />
    </div>
  );
}
