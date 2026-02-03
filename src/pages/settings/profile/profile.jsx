import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/cloudbaseContext';
import { useProfile } from '../../../hooks/useProfile';
import { REPORT_STATUS } from '../../../constants/reportStatus';
import logo from '../../../assets/2cfcc019a9c1169b9f8b00040383d02be4ab717f.png';

// ========== 子组件 ==========

/**
 * 用户头像图标（设计稿：圆形线性图标）
 */
function UserCircleIcon({ className = 'w-9 h-9' }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-user w-9 h-9 text-purple-600" data-fg-d3bl7="0.8:24.3615:/src/app/App.tsx:34:13:961:66:e:UserCircle::::::DndB">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="10" r="3"></circle>
      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662">
      </path>
    </svg>
  );
}

/**
 * 用户头部区（设计稿：左侧头像+用户名+退出图标，右侧首页图标）
 */
function UserHeader({ user, onLogout }) {
  if (!user) return null;
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3 ml-1">
        <div className="flex items-center justify-center" style={{ color: '#7C3AED' }}>
          <UserCircleIcon />
        </div>
        <span className="text-2xl font-semibold text-gray-800">{user.username}</span>
        <button
          type="button"
          onClick={onLogout}
          className="p-2 rounded-full transition-colors hover:bg-white/50"
          title="退出登录"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
      <Link
        to="/"
        className="p-2 rounded-full transition-colors hover:bg-white/50"
        title="返回首页"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </Link>
    </div>
  );
}

/**
 * 对话卡片组件（设计稿：白底圆角、顶部/底部装饰线、标题+时间）
 */
function ReportCard({ report, onRestart, onView }) {
  const { status, storageType, storageInfo, title, createdAt, lock } = report;
  const isExpired = status === REPORT_STATUS.EXPIRED;
  const isGenerating = status === REPORT_STATUS.GENERATING;
  const canView = status === REPORT_STATUS.COMPLETED;
  const isLocked = lock === 1;
  const handleClick = () => {
    if (canView && onView) {
      onView(report);
    }
  };

  return (
    <div
      className={`relative rounded-2xl p-6 overflow-hidden transition-all border-2 ${isExpired ? 'opacity-90' : 'hover:shadow-lg hover:scale-[1.02]'} ${canView ? 'cursor-pointer active:scale-[0.98]' : ''}`}
      style={{
        backgroundColor: isExpired ? 'rgba(243, 244, 246, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(4px)',
        boxShadow: isExpired ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        borderColor: isExpired ? 'rgba(209, 213, 219, 0.6)' : 'rgba(216, 180, 254, 0.6)',
      }}
      onClick={handleClick}
    >
      {/* 顶部装饰细线 */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gray-100" />
      {/* 底部装饰细线 */}
      <div className="absolute bottom-0 left-6 right-6 h-px bg-gray-100" />
      {/* INNER BOOK Logo 水印容器 - 带渐变遮罩 */}
      <div 
        className="absolute right-0 w-32 opacity-10"
        style={{ 
          top: '50px',
          transform: 'translateX(20px) rotate(-30deg)',
          maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)'
        }}
      >
        <img 
          src={logo} 
          alt="INNER BOOK" 
          className="w-full"
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="flex-1 text-lg font-bold text-gray-800 truncate">
            {title}
          </h3>
          {isLocked && (
            <span className="shrink-0 p-1 rounded" title="已锁定">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
          )}
          {isGenerating && (
            <span className="text-xs px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: 'rgba(139, 168, 255, 0.15)', color: '#6366F1' }}>
              生成中
            </span>
          )}
          {storageType === 'permanent' && !isGenerating && (
            <span className="text-xs px-2 py-1 rounded-full text-white shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
              永久存储
            </span>
          )}
          {storageType === 'validUntil' && storageInfo && !isGenerating && (
            <span className="text-xs px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: 'rgba(167, 139, 250, 0.1)', color: '#6B7280' }}>
              至 {storageInfo.validUntil}
            </span>
          )}
          {isExpired && (
            <span className="text-xs px-2 py-1 rounded-full shrink-0 border border-gray-300 text-gray-400">
              已过期
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{createdAt}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 底部导航组件（设计稿：白底毛玻璃、意见反馈 + 关于我们）
 */
function BottomNav() {
  const navItems = [
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      ),
      label: '意见反馈',
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      label: '关于我们',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-200/50 shadow-lg">
      <div className="max-w-2xl mx-auto px-4 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex flex-col items-center gap-1 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                {item.icon}
              </svg>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 加载骨架屏组件（设计稿：头部+卡片列表）
 */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3 ml-1">
          <div className="w-9 h-9 rounded-full bg-gray-200" />
          <div className="h-7 bg-gray-200 rounded w-24" />
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="w-5 h-px bg-gray-200" />
        <div className="h-4 bg-gray-200 rounded w-40" />
        <div className="w-5 h-px bg-gray-200" />
      </div>
      <div className="space-y-4 px-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl p-6 bg-white/80 border-2 border-gray-100">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== 主页面组件 ==========

/**
 * 未登录提示组件（设计稿风格：居中、渐变背景内）
 */
function NotLoggedIn({ onLogin }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-white/80 shadow-md border border-purple-100/60">
        <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">尚未登录</h3>
      <p className="text-sm text-gray-500 mb-6">登录后查看你的个人档案和对话记录</p>
      <button
        type="button"
        onClick={onLogin}
        className="px-8 py-3 rounded-full text-white text-sm font-medium bg-gray-800 hover:bg-gray-700 transition-colors shadow-md"
      >
        立即登录
      </button>
      <p className="mt-4 text-xs text-gray-400">
        还没有账号？
        <Link to="/register" className="ml-1 text-purple-600 hover:underline">注册新账号</Link>
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { user, reports, userExtraInfo, isLoading, error, isLoggedIn, restartConversation, goToLogin } = useProfile();

  // 处理重新开启对话
  const handleRestart = async (conversationId) => {
    try {
      await restartConversation(conversationId);
    } catch (err) {
      console.error('重新开启对话失败:', err);
    }
  };

  // 处理查看历史报告
  const handleViewReport = (report) => {
    // 将 reportId 和 mode 拼接到 URL 上
    const mode = report.mode || 'discover-self';
    const reportId = report.reportId;
    navigate(`/report-result?mode=${mode}&reportId=${reportId}`);
  };

  // 处理退出登录
  const handleLogout = async () => {
    try {
      // 退出登录
      await auth.signOut();
      
      // 跳转到首页
      navigate('/');
    } catch (err) {
      console.error('退出登录失败:', err);
    }
  };

  return (
    <div className="h-screen-safe w-full flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100 overflow-hidden">
      {/* 主容器：可滚动区域（flex-1 min-h-0 保证在 flex 下能正确滚动） */}
      <div className="flex-1 min-h-0 overflow-y-auto max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-full text-white bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : !isLoggedIn ? (
          <NotLoggedIn onLogin={goToLogin} />
        ) : (
          <>
            {/* 顶部用户区（头像+用户名+退出图标 | 首页图标） */}
            <UserHeader user={user} onLogout={handleLogout} />

            {/* 解锁提示（设计稿：你已解锁X份INNER BOOK报告） */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-5 h-px bg-gray-300" />
              <p className="text-sm text-gray-500 whitespace-nowrap">
                {reports.length > 0 ? `你已解锁 ${reports.length} 份INNER BOOK报告` : '尚未解锁任何报告'}
              </p>
              <div className="w-5 h-px bg-gray-300" />
            </div>

            {/* 对话卡片列表 */}
            <div className="space-y-4 px-2.5">
              {reports.map((report) => (
                <ReportCard
                  key={report.reportId}
                  report={report}
                  onRestart={handleRestart}
                  onView={handleViewReport}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 底部导航 */}
      <BottomNav />
    </div>
  );
}
