import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDb } from '../../contexts/cloudbaseContext';
import { getModeLabel } from '../../constants/modes';
import { BackgroundBlobs } from '../../components/reportBackground';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { getReportDetail } from '../../api/report';
import ReportContentCard from '../../components/ReportContentCard';
import { trackVisitEvent, trackClickEvent } from '../../utils/track';
// ========== 分享者信息卡片 ==========
function SharerCard({ username }) {
  return (
    <div 
      className="w-full bg-white rounded-2xl p-4 mb-4 shadow-sm flex items-center gap-4"
      style={{ 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        animation: 'fadeInDown 0.8s ease-out'
      }}
    >
      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-gray-900">{username || '好友'}</span>
        <span className="text-sm text-gray-500">邀请你一起体验 INNER BOOK，探索内心世界</span>
      </div>
    </div>
  );
}

// ========== 功能特点卡片 ==========
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col items-center text-center shadow-sm">
      <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-3 text-purple-600">
        {icon}
      </div>
      <h3 className="font-bold text-sm text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ========== 社会证明 ==========
function SocialProof() {
  return (
    <div 
      className="w-full bg-purple-50 rounded-xl p-4 flex items-center justify-center gap-3 mb-8"
      style={{ animation: 'fadeInUp 0.8s ease-out 0.7s backwards' }}
    >
      <div className="flex -space-x-2">
        <div className="w-7 h-7 rounded-full border-2 border-white bg-yellow-400" />
        <div className="w-7 h-7 rounded-full border-2 border-white bg-emerald-400" />
        <div className="w-7 h-7 rounded-full border-2 border-white bg-blue-400" />
      </div>
      <span className="text-sm text-indigo-500 font-medium">
        已有 10,000+ 用户发现了更好的自己
      </span>
    </div>
  );
}

// ========== 页脚 ==========
function Footer() {
  return (
    <div 
      className="text-center py-5 opacity-60"
      style={{ animation: 'fadeIn 1s ease-out 1s backwards' }}
    >
      <div className="font-bold text-sm text-gray-400 tracking-wider mb-1">
        INNER BOOK
      </div>
      <div className="text-xs text-gray-300">
        Explore your inner universe.
      </div>
    </div>
  );
}

// ========== 主组件 ==========
export default function ShareLanding() {
  const db = useDb();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'discover-self';
  const reportId = searchParams.get('reportId');
  
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const modeLabel = useMemo(() => getModeLabel(mode), [mode]);

  // 加载报告数据
  useEffect(() => {
    if (!reportId) {
      setLoading(false);
      return;
    }
    if (!db) {
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        const reportDetail = await getReportDetail(db, reportId, true);
        if (!reportDetail) {
          setError('报告不存在或已被删除');
          setLoading(false);
          return;
        }
        if (reportDetail.lock === 1) {
          setError('报告未解锁');
          setLoading(false);
          return;
        }
        setReport(reportDetail);
        setLoading(false);
      } catch (error) {
        console.error('获取报告失败:', error);
        setError('报告不存在或已被删除');
        setLoading(false);
        return;
      }
    };

    fetchReport();
  }, [reportId, db]);
  
  const handleTryNow = useCallback(() => {
    trackClickEvent('share_landing_try_now');
  }, []);

  useEffect(() => {
    trackVisitEvent('share_landing_expose');
  }, []);

  if (loading) {
    return (
      <div className="h-screen-safe bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-screen-safe bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationCircleOutlined className="text-purple-500 text-2xl mx-auto mb-4" />
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen-safe bg-gray-50 relative overflow-y-auto">
      <BackgroundBlobs />
      
      {/* 主容器 */}
      <div className="relative z-10 max-w-md mx-auto px-5 py-5 min-h-full">
        
        {/* 1. 分享者信息卡片 */}
        <SharerCard username={report?.username} />

        {/* 2. 内容展示卡片 */}
        <ReportContentCard
          subTitle={report?.subTitle}
          content={report?.content}
          modeLabel={modeLabel}
          className="w-full mb-8 relative"
          style={{
            boxShadow: '0 8px 30px rgba(107, 107, 255, 0.08)',
            minHeight: '400px',
            animation: 'fadeInUp 0.8s ease-out 0.2s backwards',
          }}
          contentClassName="text-gray-600 text-sm leading-relaxed text-justify text-dora"
        />

        {/* 4. 产品介绍 */}
        <div 
          className="text-center mb-8"
          style={{ animation: 'fadeInUp 0.8s ease-out 0.5s backwards' }}
        >
          <h2 className="font-bold text-xl text-gray-900 mb-3">INNER BOOK 是什么?</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            通过深度对话，发现你不曾察觉的一面。<br />
            AI 陪伴你探索内心，记录成长轨迹，重塑自我认知。
          </p>
        </div>

        {/* 5. 功能特点 */}
        <div 
          className="grid grid-cols-3 gap-3 mb-8"
          style={{ animation: 'fadeInUp 0.8s ease-out 0.6s backwards' }}
        >
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            title="深度对话"
            desc="AI 引导式提问 直击内心深处"
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            title="自我发现"
            desc="挖掘潜在天赋 重构自我认知"
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            title="成长记录"
            desc="生成专属书册 见证你的蜕变"
          />
        </div>

        {/* 6. 社会证明 */}
        <SocialProof />

        {/* 7. 页脚 */}
        <Footer />
        
        {/* 底部占位，避免内容被浮动按钮遮挡 */}
        <div className="h-20" />
      </div>

      {/* 8. 浮动吸底 CTA 按钮 */}
      <div className="fixed bottom-3 left-0 right-0 z-50 px-5 pb-safe bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-4">
        <div className="max-w-md mx-auto">
          <Link
            to="/"
            className="btn-primary flex items-center justify-center gap-2 w-full font-bold transition-all hover:bg-black active:scale-[0.98]"
            onClick={handleTryNow}
          >
            我也要探索
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
