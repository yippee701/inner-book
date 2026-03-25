import { View, Text, Image, ScrollView, RichText, Input, Button } from '@tarojs/components';
import { useEffect, useCallback, useState } from 'react';
import Taro, { useRouter, useShareAppMessage } from '@tarojs/taro';
import { useReport } from '../../contexts/ReportContext';
import {
  generateReportTitle,
  getModeLabel,
  markdownToHtml,
  getReportDetail as getReportDetailApi,
} from '@know-yourself/core';
import { useDb } from '../../contexts/cloudbaseContext';
import { OFFICIAL_ACCOUNT_ARTICLE_URL } from '../../config/brand';
import './index.scss';

/** 小程序用 Image + data URI；不要用 HTML 的 <img> */
const INNER_BOOK_ICON_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABB0lEQVR4AeyS0Q3CMBBDT12GbgMjIIYARgCGQIwA25RpoP44NYouaYQl2g9XskqSs3ly031W/nS28keA7AdSg2qQbYD1z97B92Dmej3NUmG/BoBzV+rDb+zXvH5WBETA7WJ2TYTgVDg77CdoD2W8nuHvENDBhrE9H6y9HRo+COC/eKP/CAFbw/NA+KB8v2Vd8oWALYH/mhEg27QaVINsA6xfd1ANsg2wft3BlTTIYpT9+sTlbtpO1GBbT+Wp2Qb73ux0nnR/mEHY2+7MoFI84/XMENCDAXIc4TYjpMuNWAMOwhzeOGO88OcKAR0qH66tAQhQxhvlh4DR4FJ7AmSbV4NqkG2A9X8BAAD//5ftfh4AAAAGSURBVAMA9wUTwFGTBLkAAAAASUVORK5CYII=';
const QUOTE_ICON_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACk0lEQVR4AeyaP2/CQAzFT5FYKAtDmdu53/+jdG5nOrBQpIqhzS+pEZT8OfvIKT2MZA4S+5793jtEK6rvO39U4c4fTsCdGyC4A9wBd86AH4EpDHA8hLB7b4PXU2Bo96SPw7btid6k/mYOAICNt681yFsIx8829jWogOVe//a0/2h7ojfpJYkAAGD1fGjZWFbAyJP3OVbwEGP3K0QXJn1z3UyAAMAqGw1FLhcwlPQF8YM91W7gvpoA2EXxMQA2lyCXOnl/65W9GRwxwIrdnzoVAYBgq1iAHHmN6gNWH+oBZ0YRAFNa1QV48RDC+jmExVKu3G5FEFS37Lh6rPt6CuNfhRneqrqATDW8xu5CEoJsXkJYbtorVbt0P6cMj+oC0r27/SrKW4YXQc6RewmQs3WeHPua4adQHfyU4bsE6SXAeramHB5RrMp3DQ+hnQQAxE1tYLGplKcniyic+b7hme+KACsQww8BAZYSluHBW9ef9Kx9cUWAFWix6oNIv44oll0QZazugoAUoLlZn8FjHHlBgFV9wOYWMerT84kAq/psEsM0edqgJ6sosUfyRIAVKJZp7fCp+bFHsiEAplMBp6jPIUpDQErzsVbTYuQSpSHAyjRDxVqN3DlGxR88KY3x3TwmtDhf9T9WrX1RG9MTOdVxb4Vp6/huHhVKHPZsEfTP1MZGcwT0ENNWaN0y1M3YvQq7jCWVfH+eDlAelxSBZklAykDa2ooPC21RSfnugJLUtMziDrCwVlKNO6AkNS2zuAMsrJVU4w4oSU3LLO4AC2tzrtH25g7QMlZavjugNEW187gDtIyVlu8OKE1R7TwVPxrMEZrfEJCboycw/AhoLVNavjugNEW187gDtIyVlv/vHZAqyA8AAAD//3GD8NkAAAAGSURBVAMAUXAtn9G4v8MAAAAASUVORK5CYII=';

/**
 * 底部转化区 - 与 H5 一致：分享报告（主）+ 复制链接（次），签名 INNER BOOK
 * 分享使用 Button open-type="share" 触发
 */
function ConversionZone({ onCopyLink }) {
  return (
    <View className='rr-conversion'>
      <View className='rr-conversion-btns'>
        <Button className='rr-btn-primary rr-btn-share' openType='share'>
          <Text className='rr-btn-text'>分享报告</Text>
        </Button>
      </View>
      <View className='rr-signature'>
        <View className='rr-signature-line' />
        <Text className='rr-signature-text'>INNER BOOK</Text>
        <View className='rr-signature-line' />
      </View>
    </View>
  );
}

/**
 * 报告内容卡片 - 与 H5 ReportContentCard 一致：白卡 + 头部 + 引用区 + 正文
 */
function ReportCard({ modeLabel, subTitle, contentHtml }) {
  return (
    <View className='rr-card'>
      {/* Header: INNER BOOK + 模式标签 */}
      <View className='rr-card-header'>
        <View className='rr-card-brand'>
          <Image className='rr-card-brand-icon' src={INNER_BOOK_ICON_DATA_URI} mode='aspectFit' />
          <Text className='rr-card-brand-text'>INNER BOOK</Text>
        </View>
        <View className='rr-card-badge'>
          <Text className='rr-card-badge-text'>{modeLabel}</Text>
        </View>
      </View>
      {/* 引用区：引号图标 + 副标题 + 渐变线 */}
      <View className='rr-card-quote'>
        <Image className='rr-card-quote-icon' src={QUOTE_ICON_DATA_URI} mode='aspectFit' />
        <Text className='rr-card-quote-title'>{subTitle || ''}</Text>
        <View className='rr-card-quote-line' />
      </View>
      {/* 正文 */}
      <View className='rr-card-body'>
        <RichText nodes={contentHtml} className='rr-rich' />
      </View>
    </View>
  );
}

export default function ReportResult() {
  const router = useRouter();
  const mode = router?.params?.mode || 'discover-self';
  const reportId = router?.params?.reportId;
  const modeLabel = getModeLabel(mode);
  const db = useDb();
  const {
    getReportDetail,
    subTitle,
    isLoggedIn: reportIsLoggedIn,
    handleInviteCodeSubmit,
  } = useReport();

  const [displayContent, setDisplayContent] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showInviteCodeDialog, setShowInviteCodeDialog] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showShare, setShowShare] = useState(true);

  // 加载报告
  useEffect(() => {
    if (!db || !getReportDetail || !reportId) {
      if (!reportId) setLoadError('报告 ID 不存在');
      setIsLoadingReport(false);
      return;
    }

    const loadReport = async () => {
      setIsLoadingReport(true);
      setLoadError(null);
      try {
        const detail = await getReportDetail(reportId);
        if (!detail) {
          setLoadError('报告内容不存在');
          return;
        }
        setDisplayContent(detail.content || '');
        if (detail.lock === true) {
          setShowInviteCodeDialog(true);
          setShowShare(false);
        }
      } catch {
        setLoadError('加载报告失败，请稍后重试');
      } finally {
        setIsLoadingReport(false);
      }
    };
    loadReport();
  }, [getReportDetail, db, reportId]);

  useShareAppMessage(() => {
    return {
      title: subTitle || generateReportTitle(mode),
      path: `/pages/report-result/index?mode=${mode}&reportId=${reportId}`,
    };
  });

  // 邀请码提交
  const handleSubmitInviteCode = useCallback(async () => {
    if (!inviteCode.trim() || !reportId) return;
    setIsVerifying(true);
    try {
      await handleInviteCodeSubmit(reportId, inviteCode.trim());
      setShowInviteCodeDialog(false);
      setShowShare(true);
      Taro.showToast({ title: '邀请码验证成功', icon: 'success' });
      if (db) {
        const detail = await getReportDetailApi(db, reportId, true);
        if (detail) setDisplayContent(detail.content || '');
      }
    } catch (err) {
      Taro.showToast({ title: err.message || '验证失败', icon: 'error' });
    } finally {
      setIsVerifying(false);
    }
  }, [inviteCode, reportId, handleInviteCodeSubmit, db]);

  // 复制链接（小程序内 path，便于转发）
  const handleCopyLink = useCallback(() => {
    const path = `/pages/report-result/index?mode=${mode}&reportId=${reportId}`;
    Taro.setClipboardData({
      data: path,
      success: () => Taro.showToast({ title: '已复制', icon: 'success' }),
    });
  }, [mode, reportId]);

  /** 有上一页则返回，否则（如分享直达）回首页 */
  const handleHeaderBack = useCallback(() => {
    const pages = Taro.getCurrentPages();
    if (pages.length > 1) {
      Taro.navigateBack();
    } else {
      Taro.reLaunch({ url: '/pages/index/index' });
    }
  }, []);

  /** 打开公众号图文（需在 brand.js 配置 OFFICIAL_ACCOUNT_ARTICLE_URL） */
  const handleOpenOfficialAccount = useCallback(() => {
    const articleUrl = OFFICIAL_ACCOUNT_ARTICLE_URL?.trim();
    if (!articleUrl) {
      Taro.showToast({ title: '请配置公众号文章链接', icon: 'none' });
      return;
    }
    const wxApi = typeof globalThis !== 'undefined' ? globalThis.wx : undefined;
    if (!wxApi?.openOfficialAccountArticle) return;
    wxApi.openOfficialAccountArticle({
      url: articleUrl,
      fail: (err) => {
        const msg = err?.errMsg || '';
        if (msg.includes('cancel') || msg.includes('取消')) return;
        console.error(err);
        Taro.showToast({ title: msg || '无法打开文章', icon: 'none' });
      },
    });
  }, []);

  // 加载失败页 - 与 H5 一致
  if (loadError) {
    return (
      <View className='report-result rr-error-page'>
        <View className='rr-error-header'>
          <View className='rr-error-home' onTouchEnd={() => Taro.reLaunch({ url: '/pages/index/index' })}>
            <Text className='rr-error-home-icon'>🏠</Text>
          </View>
        </View>
        <View className='rr-error-body'>
          <Text className='rr-error-msg'>{loadError}</Text>
          <View className='rr-error-btn-wrap' onTouchEnd={() => Taro.reLaunch({ url: '/pages/index/index' })}>
            <Text className='rr-error-btn-text'>返回首页</Text>
          </View>
        </View>
      </View>
    );
  }

  // 加载中 - 与 H5 一致
  if (isLoadingReport || !displayContent) {
    return (
      <View className='report-result rr-loading-page'>
        <Text className='rr-loading-text'>加载中...</Text>
      </View>
    );
  }

  const contentHtml = markdownToHtml(displayContent);

  return (
    <View className='report-result'>
      {/* 背景光晕 - 与 H5 BackgroundBlobs 一致 */}
      <View className='rr-blob rr-blob-1' />
      <View className='rr-blob rr-blob-2' />
      <View className='rr-blob rr-blob-3' />

      {/* 顶部栏 - 与 H5 header 一致 */}
      <View className='rr-header'>
        <View className='rr-header-back' onTouchEnd={handleHeaderBack}>
          <Text className='rr-header-back-icon'>←</Text>
        </View>
        <Text className='rr-header-title'>{generateReportTitle(mode)}</Text>
        <View className='rr-header-placeholder' />
      </View>

      {/* 内容区 - 卡片 + 可选「查看完整对话过程」 */}
      <ScrollView scrollY className='rr-scroll' enhanced showScrollbar={false}>
        <View className='rr-content-wrap'>
          <ReportCard modeLabel={modeLabel} subTitle={subTitle} contentHtml={contentHtml} />
          <View className='rr-history-link-wrap'>
            <Text
              className='rr-history-link'
              onTouchEnd={() => Taro.navigateTo({ url: `/pages/chat/index?mode=${mode}` })}
            >
              查看完整对话过程
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 底部转化区 - 与 H5 ConversionZone 一致 */}
      {showShare && (
        <View className='rr-bottom'>
          <ConversionZone onCopyLink={handleCopyLink} />
        </View>
      )}

      {/* 邀请码弹窗 */}
      {showInviteCodeDialog && (
        <View className='rr-dialog-mask'>
          <View className='rr-dialog-content'>
            <Text className='rr-dialog-title'>输入邀请码</Text>
            <Text className='rr-dialog-desc rr-dialog-desc-link' onClick={handleOpenOfficialAccount}>
              关注 Inner Book 公众号，获取邀请码
            </Text>
            <View className='rr-invite-input-row'>
              <Input
                type='text'
                value={inviteCode}
                className='rr-invite-input'
                placeholder='请输入邀请码'
                placeholderClass='rr-invite-placeholder'
                onInput={(e) => setInviteCode(e.detail.value)}
              />
            </View>
            <View className='rr-invite-btns'>
              <View className='rr-invite-cancel' onTouchEnd={() => setShowInviteCodeDialog(false)}>
                <Text>取消</Text>
              </View>
              <View
                className={`rr-invite-confirm ${isVerifying ? 'rr-invite-disabled' : ''}`}
                onTouchEnd={handleSubmitInviteCode}
              >
                <Text>{isVerifying ? '验证中...' : '确认'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
