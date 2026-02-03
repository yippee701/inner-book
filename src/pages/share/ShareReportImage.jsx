import { useRef, useEffect, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { useToast } from '../../components/Toast';

/** 去掉 markdown 格式，得到纯文本 */
function stripMarkdown(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 取纯文本前 N 字，超出部分用省略 */
const REPORT_PREVIEW_CHARS = 200;
function truncatePlainText(text, maxChars = REPORT_PREVIEW_CHARS) {
  const t = stripMarkdown(text || '');
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars) + '…';
}

/**
 * 分享报告长图 - 用 HTML 还原设计稿，再用 html2canvas 截图
 */
export default function ShareReportImage({ isOpen, onClose, title, subTitle, content, shareUrl, username }) {
  const cardRef = useRef(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const { message } = useToast();

  const displayTitle = title || '你的内心世界档案';
  const displayDescription = truncatePlainText(content);

  // 生成二维码
  useEffect(() => {
    if (!isOpen || !shareUrl?.trim()) {
      setQrDataUrl('');
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(shareUrl.trim(), {
      width: 240,
      margin: 0,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((e) => {
        if (!cancelled) setQrDataUrl('');
        console.warn('二维码生成失败:', e);
      });
    return () => { cancelled = true; };
  }, [isOpen, shareUrl]);

  // 用 html2canvas 截取卡片（有 shareUrl 时等二维码生成后再截）
  useEffect(() => {
    if (!isOpen || !content || !cardRef.current) {
      setImageDataUrl(null);
      return;
    }
    if (shareUrl?.trim() && !qrDataUrl) return;
    setGenerating(true);
    const el = cardRef.current;
    const timer = setTimeout(() => {
      html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#F5F3FF',
        logging: false,
      })
        .then((canvas) => {
          setImageDataUrl(canvas.toDataURL('image/png'));
        })
        .catch((e) => {
          console.error('截图失败:', e);
          message.error('生成长图失败，请重试');
        })
        .finally(() => {
          setGenerating(false);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [isOpen, content, shareUrl, qrDataUrl, displayTitle, displayDescription, message]);

  const handleSave = useCallback(() => {
    if (!imageDataUrl) return;
    const link = document.createElement('a');
    const safeTitle = (title || '分享').replace(/[/\\?*:|"]/g, '-').slice(0, 50);
    link.download = `Inner-Book-报告-${safeTitle}.png`;
    link.href = imageDataUrl;
    link.click();
    message.success('图片已保存');
  }, [imageDataUrl, title, message]);

  if (!isOpen) return null;

  return (
    <>
      {/* 用于截图的卡片 DOM，放在视口外避免闪烁 */}
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: 375,
          minHeight: 600,
          padding: 20,
          backgroundColor: '#F5F3FF',
        }}
      >
        {/* 渐变描边：外层 1px 渐变，内层白底 */}
        <div
          style={{
            position: 'relative',
            maxWidth: 335,
            margin: '0 auto',
            borderRadius: 20,
            padding: 1,
            background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
          }}
        >
          <div
            style={{
              position: 'relative',
              borderRadius: 19,
              padding: 24,
              background: '#FFFFFF',
              boxShadow: '0 12px 48px rgba(139, 92, 246, 0.12)',
            }}
          >
          {/* 四角装饰 */}
          <div style={{ position: 'absolute', top: 12, left: 12, width: 16, height: 16, borderColor: '#E9D5FF', borderStyle: 'solid', borderWidth: 0, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderTopLeftRadius: 6 }} />
          <div style={{ position: 'absolute', top: 12, right: 12, width: 16, height: 16, borderColor: '#E9D5FF', borderStyle: 'solid', borderWidth: 0, borderTopWidth: 1.5, borderRightWidth: 1.5, borderTopRightRadius: 6 }} />
          <div style={{ position: 'absolute', bottom: 12, left: 12, width: 16, height: 16, borderColor: '#E9D5FF', borderStyle: 'solid', borderWidth: 0, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderBottomLeftRadius: 6 }} />
          <div style={{ position: 'absolute', bottom: 12, right: 12, width: 16, height: 16, borderColor: '#E9D5FF', borderStyle: 'solid', borderWidth: 0, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderBottomRightRadius: 6 }} />

          {/* Logo */}
          <div style={{ fontSize: 18, fontWeight: 600, color: '#333', letterSpacing: '-0.5px' }}>
            INNER BOOK
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 8, lineHeight: 1.5 }}>
            {username || '好友'} 邀请你体验 INNER BOOK，探索内心世界
          </div>

          {/* 标题 + 装饰线 + 描述 */}
          <div style={{ marginTop: 24 }}>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: '#000',
                lineHeight: 1.4,
                marginBottom: 12,
                wordBreak: 'break-word',
              }}
            >
              {displayTitle}
            </h1>
            <div
              style={{
                width: 60,
                height: 3,
                background: '#8B5CF6',
                borderRadius: 1.5,
                marginBottom: 20,
              }}
            />
            <div
              style={{
                fontSize: 14,
                color: '#333',
                lineHeight: 1.8,
                marginBottom: 28,
                maxHeight: 200,
                overflow: 'hidden',
                textAlign: 'justify',
                maskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)',
              }}
            >
              {displayDescription}
            </div>
          </div>

          {/* 白色渐变遮罩：从上到下逐渐不透明 */}
          {/* <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '55%',
              background: 'linear-gradient(to top, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.5) 40%, transparent 100%)',
              pointerEvents: 'none',
            }}
          /> */}

          {/* 二维码区域 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 'auto',
              paddingBottom: 10,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                background: '#FFFFFF',
                border: '1px solid #F0F0F0',
                borderRadius: 12,
                padding: 10,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt=""
                  width={120}
                  height={120}
                  style={{ display: 'block' }}
                />
              ) : (
                <span style={{ fontSize: 12, color: '#999' }}>二维码加载中</span>
              )}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: '#999', textAlign: 'center' }}>
              长按识别二维码
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* 弹窗 UI（与之前一致） */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl overflow-hidden mx-4 max-w-md w-full max-h-[90vh] flex flex-col"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">分享报告长图</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 flex flex-col items-center">
            {generating && (
              <div className="py-12 text-gray-500">生成中...</div>
            )}
            {!generating && imageDataUrl && (
              <>
                <img
                  src={imageDataUrl}
                  alt="报告分享长图"
                  className="w-full max-w-[335px] rounded-xl shadow-lg"
                  style={{ maxHeight: '60vh', objectFit: 'contain' }}
                />
                <p className="text-xs text-gray-400 mt-3">长按图片保存到相册后分享</p>
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn-primary mt-3 w-full max-w-[335px] h-12 font-medium hover:bg-gray-800 active:scale-[0.98]"
                >
                  保存图片
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
