import { View, Text, ScrollView, RichText, Input, Button } from '@tarojs/components';
import { useEffect, useCallback, useState } from 'react';
import Taro, { useRouter, useShareAppMessage } from '@tarojs/taro';
import { useReport } from '../../contexts/ReportContext';
import { generateReportTitle, getModeLabel, markdownToHtml, getReportDetail as getReportDetailApi } from '@know-yourself/core';
import { useDb } from '../../contexts/cloudbaseContext';
import './index.scss';

export default function ReportResult() {
  const router = useRouter();
  const mode = router?.params?.mode || 'discover-self';
  const reportId = router?.params?.reportId;
  const modeLabel = getModeLabel(mode);
  const db = useDb();
  const {
    getReportDetail, content, subTitle, isLoggedIn: reportIsLoggedIn,
    handleInviteCodeSubmit,
  } = useReport();

  const [displayContent, setDisplayContent] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showInviteCodeDialog, setShowInviteCodeDialog] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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
      title: 'Inner Book',
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
      Taro.showToast({ title: '邀请码验证成功', icon: 'success' });
      // 重新加载
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

  // 加载失败
  if (loadError) {
    return (
      <View className='report-result'>
        <View className='rr-error'>
          <Text className='rr-error-text'>{loadError}</Text>
          <View className='btn-primary rr-error-btn' onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}>
            <Text>返回首页</Text>
          </View>
        </View>
      </View>
    );
  }

  // 加载中
  if (isLoadingReport || !displayContent) {
    return (
      <View className='report-result rr-loading'>
        <Text className='rr-loading-text'>加载中...</Text>
      </View>
    );
  }

  return (
    <View className='report-result'>
      {/* 背景 */}
      <View className='bg-glow bg-glow-1' />
      <View className='bg-glow bg-glow-2' />

      {/* Header */}
      <View className='rr-header'>
        <View className='rr-header-back' onClick={() => Taro.navigateBack()}>
          <Text className='rr-header-back-icon'>←</Text>
        </View>
        <Text className='rr-header-title'>{generateReportTitle(mode)}</Text>
        <View className='rr-header-action' onClick={() => Taro.navigateTo({ url: '/pages/profile/index' })}>
          <Text className='rr-header-action-icon'>👤</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView scrollY className='rr-scroll'>
        <View className='rr-content'>
          {/* 模式标签 */}
          <View className='rr-mode-badge'>
            <Text className='rr-mode-badge-text'>{modeLabel}</Text>
          </View>

          {/* 副标题 */}
          {subTitle && (
            <Text className='rr-subtitle'>{subTitle}</Text>
          )}

          {/* 报告正文 */}
          <View className='rr-body'>
            <RichText nodes={markdownToHtml(displayContent)} />
          </View>
        </View>
      </ScrollView>

      {/* 底部分享区 */}
      <View className='rr-bottom safe-area-bottom'>
        <Button className='btn-primary rr-share-btn' open-type="share">分享报告</Button>
        <View className='rr-signature'>
          <View className='rr-signature-line' />
          <Text className='rr-signature-text'>INNER BOOK</Text>
          <View className='rr-signature-line' />
        </View>
      </View>

      {/* 邀请码弹窗 */}
      {showInviteCodeDialog && (
        <View className='dialog-mask'>
          <View className='dialog-content'>
            <Text className='dialog-title'>输入邀请码</Text>
            <Text className='dialog-desc'>请输入邀请码解锁报告</Text>
            <View className='invite-input-row'>
              <Input
                type='text'
                value={inviteCode}
                className='invite-input'
                placeholder='请输入邀请码'
                onInput={(e) => setInviteCode(e.detail.value)}
              />
            </View>
            <View className='invite-btns'>
              <View className='btn-secondary invite-cancel' onClick={() => setShowInviteCodeDialog(false)}>
                <Text>取消</Text>
              </View>
              <View
                className={`btn-primary invite-confirm ${isVerifying ? 'btn-disabled' : ''}`}
                onClick={handleSubmitInviteCode}
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
