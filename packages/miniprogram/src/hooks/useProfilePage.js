import { useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { useProfile } from './useProfile';
import { isLoggedIn } from '@know-yourself/core';

/**
 * 个人中心页：数据 + 导航 + 弹窗状态/逻辑（与 H5 共用 core 的 updateReportTitle）
 */
export function useProfilePage() {
  const profile = useProfile();
  const userLoggedIn = isLoggedIn();

  const handleViewReport = (report) => {
    Taro.navigateTo({
      url: `/pages/report-result/index?mode=${report.mode}&reportId=${report.reportId}`,
    });
  };

  const handleGoHome = () => Taro.reLaunch({ url: '/pages/index/index' });

  // ---------- 昵称弹窗 ----------
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isSubmittingNickname, setIsSubmittingNickname] = useState(false);

  const openNicknameDialog = useCallback((currentName) => {
    setNicknameInput(currentName || '微信用户');
    setShowNicknameDialog(true);
  }, []);

  const closeNicknameDialog = useCallback(() => {
    setShowNicknameDialog(false);
    setNicknameInput('');
  }, []);

  const confirmNickname = useCallback(async () => {
    const name = (nicknameInput || '').trim();
    if (!name) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    setIsSubmittingNickname(true);
    try {
      await profile.updateUserNickname(name);
      closeNicknameDialog();
      Taro.showToast({ title: '昵称已更新', icon: 'success' });
    } catch (err) {
      Taro.showToast({ title: err.message || '更新失败', icon: 'none' });
    } finally {
      setIsSubmittingNickname(false);
    }
  }, [nicknameInput, profile.updateUserNickname, closeNicknameDialog]);

  // ---------- 报告标题内联编辑（与 H5 一致：editingReportId + save/cancel） ----------
  const [editingReportId, setEditingReportId] = useState(null);
  const [isSavingReport, setIsSavingReport] = useState(false);

  const startEditTitle = useCallback((reportId) => {
    setEditingReportId(reportId);
  }, []);

  const cancelEditTitle = useCallback(() => {
    setEditingReportId(null);
  }, []);

  const saveReportTitle = useCallback(async (reportId, title) => {
    const t = (title || '').trim();
    if (!reportId || !t) {
      Taro.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    setIsSavingReport(true);
    try {
      await profile.updateReportTitle(reportId, t);
      setEditingReportId(null);
      Taro.showToast({ title: '标题已更新', icon: 'success' });
    } catch (err) {
      Taro.showToast({ title: err.message || '更新失败', icon: 'none' });
    } finally {
      setIsSavingReport(false);
    }
  }, [profile.updateReportTitle]);

  return {
    ...profile,
    userLoggedIn,
    handleViewReport,
    handleGoHome,
    // 昵称弹窗
    showNicknameDialog,
    nicknameInput,
    setNicknameInput,
    openNicknameDialog,
    closeNicknameDialog,
    confirmNickname,
    isSubmittingNickname,
    // 报告标题内联编辑（与 H5 一致）
    editingReportId,
    startEditTitle,
    saveReportTitle,
    cancelEditTitle,
    isSavingReport,
  };
}
