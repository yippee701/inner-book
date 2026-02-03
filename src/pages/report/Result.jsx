import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import XMarkdown from '@ant-design/x-markdown';
import { useReport } from '../../contexts/ReportContext';
import { generateReportTitle} from '../../utils/chat';
import { getModeFromSearchParams } from '../../constants/modes';
import { useToast } from '../../components/Toast';
import ShareDialog from '../share/shareDialog';
import ShareReportImage from '../../components/ShareReportImage';
import InviteCodeDialog from '../../components/inviteCodeDialog';
import InviteLoginDialog from '../../components/inviteLoginDialog';
import { useRdb } from '../../contexts/cloudbaseContext';
import { getReportDetail as getReportDetailApi } from '../../api/report';
import { getModeLabel } from '../../constants/modes';
import { BackgroundBlobs } from '../../components/reportBackground';

/**
 * 底部转化区组件 - 分享报告长图（主）+ 分享链接（次），并排展示，强化长图、弱化链接
 */
function ConversionZone({ onShareImage, onShareLink }) {
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 min-h-28 flex flex-col items-center justify-end pb-4 z-50"
      style={{
        background: 'linear-gradient(to top, #FFFFFF 85%, rgba(255, 255, 255, 0) 100%)',
      }}
    >
      <div className="flex items-center gap-2 mb-4 w-full max-w-md px-6">
        <button 
          onClick={onShareImage}
          className="flex-1 min-w-0 h-12 rounded-full text-base font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{
            color: '#FFFFFF',
            backgroundColor: '#1F2937',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6 6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          分享报告长图
        </button>
        <button 
          onClick={onShareLink}
          className="flex-shrink-0 h-12 px-3 rounded-full text-xs font-normal transition-all active:scale-[0.98]"
          style={{
            color: '#9CA3AF',
            backgroundColor: 'transparent',
            border: '1px solid rgba(209, 213, 219, 0.6)',
          }}
        >
          分享链接
        </button>
      </div>

      {/* 签名 */}
      <div 
        className="flex items-center gap-1.5 text-xs tracking-widest uppercase"
        style={{ color: '#9CA3AF' }}
      >
        <span className="w-5 h-px" style={{ backgroundColor: '#D1D5DB' }} />
        <span>INNER BOOK</span>
        <span className="w-5 h-px" style={{ backgroundColor: '#D1D5DB' }} />
      </div>
    </div>
  );
}

/**
 * 自定义 Markdown 组件 - 用于结构化展示报告
 * 注意：XMarkdown 的 components prop 接收 domNode 和 streamStatus，需要用 children 获取子元素
 */
const markdownComponents = {
  // 一级标题 - 主标题（通常是报告标题）
  h1: (
    { children }) => (
    <div className="text-center mb-2">
      <h1>
        {children}
      </h1>
    </div>
  ),

  // 二级标题 - 章节标题
  h2: ({ children }) => (
    <div className="mb-5 mt-10 first:mt-0">
      <h2 
        className="text-xl"
          style={{ 
            fontFamily: '"Noto Serif SC", serif',
          fontWeight: 700,
          color: '#1F2937',
        }}
      >
        {children}
      </h2>
    </div>
  ),

  // 三级标题 - 副标题
  h3: ({ children }) => (
    <p 
      className="text-base mb-4 -mt-3"
      style={{ color: '#666666' }}
        >
      {children}
        </p>
  ),

  // 四级标题 - 子章节
  h4: ({ children }) => (
    <p 
      className="text-sm mb-3 mt-6 pl-1"
      style={{ color: '#666666' }}
    >
      {children}
    </p>
  ),

  // 引用块 - 核心洞察框
  blockquote: ({ children }) => (
        <div 
      className="rounded-2xl p-5 mb-4"
      style={{
        background: 'linear-gradient(135deg, rgba(107, 107, 255, 0.08), rgba(139, 92, 246, 0.08))',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        backdropFilter: 'blur(10px)',
      }}
        >
      <div 
        className="text-base leading-relaxed"
        style={{ 
          color: '#1F2937',
          fontWeight: 500,
        }}
      >
        {children}
      </div>
    </div>
  ),

  // 段落
  p: ({ children }) => (
    <p 
      className="text-[15px] leading-[1.7] mb-3"
      style={{ color: '#1F2937' }}
    >
      {children}
    </p>
  ),

  // 无序列表
  ul: ({ children }) => (
    <div className="mt-2 mb-4">
      {children}
    </div>
  ),

  // 列表项 - insight-box 包裹 + 发光圆点
  li: ({ children }) => (
    <div 
      className="rounded-2xl p-4 mb-4 last:mb-0"
      style={{
        background: 'linear-gradient(135deg, rgba(107, 107, 255, 0.08), rgba(139, 92, 246, 0.08))',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex gap-3 items-start">
        {/* 发光圆点 */}
        <div 
          className="flex-shrink-0 mt-1 w-4 h-4 rounded-full relative"
          style={{
            background: 'linear-gradient(135deg, #6B6BFF, #8B5CF6)',
            boxShadow: '0 0 8px rgba(107, 107, 255, 0.5)',
          }}
        >
          <div 
            className="absolute top-[3px] left-[3px] w-1 h-1 rounded-full"
              style={{ 
              background: 'rgba(255,255,255,0.8)',
              filter: 'blur(1px)',
              }}
          />
        </div>
        {/* 文字 */}
        <div 
          className="flex-1 text-[15px] leading-[1.7]"
          style={{ color: '#1F2937' }}
            >
          {children}
        </div>
      </div>
    </div>
  ),

  // 有序列表
  ol: ({ children }) => (
    <div className="mt-2 mb-4">
      {children}
    </div>
  ),

  // 加粗文字
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700, color: '#1F2937' }}>
      {children}
    </strong>
  ),

  // 斜体
  em: ({ children }) => (
    <em style={{ color: '#8B5CF6' }}>{children}</em>
  ),

  // 分割线
  hr: () => (
    <div 
      className="my-8 h-px"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
      }}
    />
  ),
};

/**
 * 报告内容渲染组件
 * 使用 XMarkdown 渲染 Markdown 格式的报告，带自定义样式
 */
function ReportContent({ content, subTitle, modeLabel }) {
    return (
      <div 
      className="rounded-3xl p-4 sm:p-8"
        style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-2 text-indigo-500 font-bold text-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            INNER BOOK
          </div>
          <div className="bg-purple-100 text-purple-700 text-xs px-3 py-1.5 rounded-full font-semibold">
            {modeLabel}
          </div>
        </div>    

        {/* Quote Section */}
        <div className="text-center mb-6">
          <svg className="w-8 h-8 text-purple-200 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <h1 
            className="text-2xl leading-relaxed text-indigo-500 mb-4"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            {subTitle}
          </h1>
          <div 
            className="w-10 h-1 mx-auto rounded-full"
            style={{ background: 'linear-gradient(to right, #8B5CF6, #B794F6)' }}
          />
        </div>

        <XMarkdown 
          components={markdownComponents}
          content={content}
        />
      </div>
    );
}

// ========== 主组件 ==========

export default function Result() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    getReportDetail, 
    content, 
    subTitle, 
    isLoggedIn: reportIsLoggedIn,
    handleInviteCodeSubmit,
    registerInviteCodeDialog,
    registerInviteLoginDialog,
  } = useReport();
  const rdb = useRdb();
  const [displayContent, setDisplayContent] = useState('');
  const { message } = useToast();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isShareImageOpen, setIsShareImageOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  
  // 对话框状态
  const [showInviteCodeDialog, setShowInviteCodeDialog] = useState(false);
  const [showInviteLoginDialog, setShowInviteLoginDialog] = useState(false);
  const [isVerifyingInviteCode, setIsVerifyingInviteCode] = useState(false);
  const [pendingUnlockReportId, setPendingUnlockReportId] = useState(null);

  // 未登录时滚动到底部后弹出邀请登录对话框，关闭后本页不再自动弹出
  const contentScrollRef = useRef(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [inviteLoginPromptDismissed, setInviteLoginPromptDismissed] = useState(false);
  const SCROLL_BOTTOM_THRESHOLD = 80;

  const checkScrolledToBottom = useCallback(() => {
    const el = contentScrollRef.current;
    if (!el) return;
    const { scrollTop, clientHeight, scrollHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - SCROLL_BOTTOM_THRESHOLD) {
      setHasScrolledToBottom(true);
    }
  }, []);

  const handleContentScroll = useCallback(() => {
    checkScrolledToBottom();
  }, [checkScrolledToBottom]);

  // 内容加载后若区域本身不足一屏，视为已到底
  useEffect(() => {
    if (!displayContent) return;
    const t = setTimeout(checkScrolledToBottom, 100);
    return () => clearTimeout(t);
  }, [displayContent, checkScrolledToBottom]);

  // 未登录且滚动到底部且未关闭过时，弹出邀请登录对话框
  useEffect(() => {
    if (hasScrolledToBottom && !reportIsLoggedIn && !inviteLoginPromptDismissed) {
      setShowInviteLoginDialog(true);
    }
  }, [hasScrolledToBottom, reportIsLoggedIn, inviteLoginPromptDismissed]);

  // 从 URL 参数获取模式
  const mode = useMemo(() => getModeFromSearchParams(searchParams), [searchParams]);
  const modeLabel = useMemo(() => getModeLabel(mode), [mode]);
  
  // 注册对话框回调
  useEffect(() => {
    if (registerInviteCodeDialog) {
      registerInviteCodeDialog((reportId) => {
        setPendingUnlockReportId(reportId);
        setShowInviteCodeDialog(true);
      });
    }
    if (registerInviteLoginDialog) {
      registerInviteLoginDialog(() => {
        setShowInviteLoginDialog(true);
      });
    }
  }, [registerInviteCodeDialog, registerInviteLoginDialog]);
  
  // 处理邀请码提交
  const handleInviteCodeSubmitWrapper = useCallback(async (inviteCode) => {
    if (!pendingUnlockReportId) {
      message.warning('报告 ID 不存在');
      return;
    }
    
    setIsVerifyingInviteCode(true);
    try {
      await handleInviteCodeSubmit(pendingUnlockReportId, inviteCode);
      setShowInviteCodeDialog(false);
      const unlockedReportId = pendingUnlockReportId;
      setPendingUnlockReportId(null);
      message.success('邀请码验证成功，报告已解锁');
      // 未登录时重置「已关闭」标记，使滚动到底部时再弹出邀请登录
      if (!reportIsLoggedIn) {
        setInviteLoginPromptDismissed(false);
      }
      // 重新加载报告内容（跳过缓存）
      if (rdb) {
        const reportDetail = await getReportDetailApi(rdb, unlockedReportId, true);
        if (reportDetail) {
          setDisplayContent(reportDetail.content || '');
        }
      }
    } catch (err) {
      message.error(err.message || '邀请码验证失败');
      throw err;
    } finally {
      setIsVerifyingInviteCode(false);
    }
  }, [pendingUnlockReportId, handleInviteCodeSubmit, getReportDetail, message, reportIsLoggedIn]);

  // 分享链接（打开 ShareDialog）
  const handleShareLink = useCallback(() => {
    const currentSearchParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const reportId = currentSearchParams.get('reportId');
    if (!reportId) {
      message.warning('报告 ID 不存在，无法分享');
      return;
    }
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const url = `${baseUrl}#/share?mode=${mode}&reportId=${reportId}`;
    setShareUrl(url);
    setIsShareDialogOpen(true);
  }, [message, mode]);

  // 分享报告长图（打开 ShareReportImage）
  const handleShareImage = useCallback(() => {
    const currentSearchParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const reportId = currentSearchParams.get('reportId');
    if (!reportId) {
      message.warning('报告 ID 不存在，无法分享');
      return;
    }
    if (!displayContent?.trim()) {
      message.warning('报告内容为空，无法生成长图');
      return;
    }
    setIsShareImageOpen(true);
  }, [message, displayContent]);

  const handleCloseShareDialog = useCallback(() => {
    setIsShareDialogOpen(false);
  }, []);

  const handleCloseShareImage = useCallback(() => {
    setIsShareImageOpen(false);
  }, []);

  // 长图弹窗用的 shareUrl（与分享链接一致）
  const shareUrlForImage = useMemo(() => {
    const currentSearchParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const reportId = currentSearchParams.get('reportId');
    if (!reportId) return '';
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}#/share?mode=${mode}&reportId=${reportId}`;
  }, [mode, searchParams]);

  // 加载报告内容
  useEffect(() => {
    const currentSearchParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const reportId = currentSearchParams.get('reportId');

    // 等待 rdb 和 getReportDetail 初始化完成
    if (!rdb || !getReportDetail) {
      return;
    }

    if (!reportId) {
      message.warning('报告 ID 不存在，无法查看');
      navigate('/');
      return;
    }

    const loadReport = async () => {
      setIsLoadingReport(true);
      try {
        const reportDetail = await getReportDetail(reportId);
        if (!reportDetail) {
          message.warning('报告内容不存在');
          navigate('/');
          return;
        }
        // 从数据库获取的 content 已经移除了 h1 标题，直接使用
        setDisplayContent(reportDetail.content || '');

        if (reportDetail.lock === 1) {
          setShowInviteCodeDialog(true);
        }
      } catch (err) {
        console.error('加载报告失败:', err);
        message.error('加载报告失败，请稍后重试');
        navigate('/');
      } finally {
        setIsLoadingReport(false);
      }
    };

    loadReport();
  }, [navigate, getReportDetail, message, rdb, content, subTitle]);

  // 没有内容时显示加载
  if (isLoadingReport || !displayContent) {
    return (
      <div className="h-screen-safe flex items-center justify-center bg-white">
        <p style={{ color: '#6B7280' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div className="h-screen-safe w-full bg-white flex flex-col overflow-hidden relative">
      {/* 背景装饰光晕 */}
      <BackgroundBlobs />

      {/* 顶部标题栏 */}
      <header 
        className="flex items-center justify-between px-4 py-2 relative z-50"
        style={{ backgroundColor: ' rgba(243, 244, 246, 0.4)', borderBottom: '1px solid rgba(243, 244, 246, 1)' }}
      >
        <Link 
          to="/"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
      >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-gray-900 font-medium">
          {generateReportTitle(mode)}
        </h1>
        <Link 
          to="/profile"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>
      </header>

      {/* 内容区 */}
      <div
        ref={contentScrollRef}
        onScroll={handleContentScroll}
        className="flex-1 overflow-y-auto pb-[220px] px-3 relative z-10"
      >
        <div className="max-w-md mx-auto py-3">
          <ReportContent content={displayContent} subTitle={subTitle} modeLabel={modeLabel}/>
          {/* 查看完整对话过程 */}
          {(
            <div className="mt-4 mb-2 flex items-center gap-2 w-full justify-center">
              <Link
                to={`/chat-history?reportId=${searchParams.get('reportId')}`}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                查看完整对话过程
              </Link>
            </div>
          )}          
        </div>
      </div>

      {/* 底部转化区 */}
      <ConversionZone onShareImage={handleShareImage} onShareLink={handleShareLink} />

      {/* 分享报告长图 */}
      <ShareReportImage
        isOpen={isShareImageOpen}
        onClose={handleCloseShareImage}
        title={subTitle || generateReportTitle(mode)}
        subTitle={subTitle}
        content={displayContent}
        shareUrl={shareUrlForImage}
      />

      {/* 分享链接弹窗 */}
      <ShareDialog 
        isOpen={isShareDialogOpen}
        onClose={handleCloseShareDialog}
        shareUrl={shareUrl}
      />
      
      {/* 邀请码对话框 */}
      <InviteCodeDialog
        isOpen={showInviteCodeDialog}
        onClose={() => {
          setShowInviteCodeDialog(false);
          setPendingUnlockReportId(null);
        }}
        onSubmit={handleInviteCodeSubmitWrapper}
        isLoading={isVerifyingInviteCode}
      />
      
      {/* 邀请登录对话框（未登录时仅滚动到底部后弹出） */}
      <InviteLoginDialog
        isOpen={showInviteLoginDialog}
        onClose={() => {
          setShowInviteLoginDialog(false);
          setInviteLoginPromptDismissed(true);
        }}
        returnUrl={window.location.hash.replace('#', '')}
      />
    </div>
  );
}

