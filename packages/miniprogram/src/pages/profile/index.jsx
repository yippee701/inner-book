import { View, Text, ScrollView, Input } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { REPORT_STATUS } from '@know-yourself/core';
import { useProfilePage } from '../../hooks/useProfilePage';
import { useShareAppMessage } from '@tarojs/taro';
import { NicknameEditDialog } from '../../components/ProfileDialogs';
import './index.scss';

/**
 * 报告卡片，与 H5 一致：支持内联编辑标题（onStartEditTitle / onSaveTitle / onCancelEditTitle）
 */
function ReportCard({
  report,
  onView,
  onStartEditTitle,
  onSaveTitle,
  onCancelEditTitle,
  editingReportId,
  isSavingTitle,
}) {
  const { status, title, mode, reportId, lock } = report;
  const isCompleted = status === REPORT_STATUS.COMPLETED;
  const isExpired = status === REPORT_STATUS.EXPIRED;
  const isLocked = lock === true;
  const isEditing = editingReportId === reportId;
  const [editTitle, setEditTitle] = useState(title || '');

  const createdAt = new Date(report.createdAt).toLocaleString();
  const modeColors = {
    'discover-self': { border: '#a78bfa', bg: 'rgba(167, 139, 250, 0.08)' },
    'understand-others': { border: '#60a5fa', bg: 'rgba(96, 165, 250, 0.08)' },
  };
  const colors = modeColors[mode] || modeColors['discover-self'];

  useShareAppMessage(() => ({
    title: 'Inner Book',
    path: '/pages/index/index',
  }), []);

  useEffect(() => {
    if (isEditing) setEditTitle(report.title || '');
  }, [isEditing, report.title]);

  const handleCardClick = () => {
    if (isEditing) return;
    if (isCompleted && onView) onView(report);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onStartEditTitle?.(reportId);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    const v = (editTitle || '').trim();
    if (v) onSaveTitle?.(reportId, v);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    onCancelEditTitle?.();
  };

  return (
    <View
      className={`report-card ${isExpired ? 'report-card-expired' : ''} ${isCompleted ? 'report-card-clickable' : ''}`}
      style={{ borderLeftColor: colors.border, backgroundColor: colors.bg }}
      onClick={handleCardClick}
    >
      <View className='report-card-head'>
        {isEditing ? (
          <View className='report-card-edit-inline' catchClick={(e) => e.stopPropagation()}>
            <Input
              className='report-card-edit-input'
              placeholder='报告标题'
              value={editTitle}
              onInput={(e) => setEditTitle(e.detail.value)}
              disabled={isSavingTitle}
              maxlength={50}
            />
            <View className='report-card-edit-actions'>
              <View className='report-card-btn report-card-btn-primary' onClick={handleSave}>
                <Text>{isSavingTitle ? '保存中...' : '保存'}</Text>
              </View>
              <View className='report-card-btn report-card-btn-secondary' onClick={handleCancel}>
                <Text>取消</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            <Text className='report-card-title'>{title || '未命名报告'}</Text>
            {isLocked ? (
              <View className='report-card-edit'>
                <mp-icon icon="lock" color="#1F2937" size="20" />
              </View>
            ) : (
              <View className='report-card-edit' onClick={handleEditClick}>
                <mp-icon icon="pencil" color="#1F2937" size="20" />
              </View>
            )}
          </>
        )}
      </View>
      <View className='report-card-meta'>
        <Text className='report-card-time'>{createdAt}</Text>
        <Text className={`report-card-status ${isCompleted ? 'status-done' : isExpired ? 'status-expired' : 'status-pending'}`}>
          {isCompleted ? '已完成' : isExpired ? '已过期' : '进行中'}
        </Text>
      </View>
    </View>
  );
}

export default function ProfilePage() {
  const {
    reports,
    user,
    isLoading,
    error,
    handleViewReport,
    handleGoHome,
    openNicknameDialog,
    showNicknameDialog,
    nicknameInput,
    setNicknameInput,
    closeNicknameDialog,
    confirmNickname,
    isSubmittingNickname,
    editingReportId,
    startEditTitle,
    saveReportTitle,
    cancelEditTitle,
    isSavingReport,
  } = useProfilePage();

  return (
    <View className='profile-page'>
      <View className='bg-glow bg-glow-1' />
      <View className='bg-glow bg-glow-2' />

      <View className='profile-header'>
        <View className='profile-header-left'>
          <View className='profile-avatar'>
            <mp-icon icon="me" color="#1F2937" size="28" />
          </View>
          <Text className='profile-username'>{user?.username || '微信用户'}</Text>
          <View className='profile-username-edit' onClick={() => openNicknameDialog(user?.username)}>
            <mp-icon icon="pencil" color="#1F2937" size="20" />
          </View>
        </View>
        <View className='profile-header-home' onClick={handleGoHome}>
          <mp-icon icon="home" color="#1F2937" size="28" />
        </View>
      </View>

      <ScrollView scrollY className='profile-scroll'>
        <View className='profile-content'>
          <Text className='profile-section-title'>对话记录</Text>
          {isLoading ? (
            <View className='profile-empty'>
              <Text className='profile-empty-text'>加载中...</Text>
            </View>
          ) : error ? (
            <View className='profile-empty'>
              <Text className='profile-empty-text'>{error}</Text>
            </View>
          ) : reports.length === 0 ? (
            <View className='profile-empty'>
              <Text className='profile-empty-text'>暂无对话记录</Text>
            </View>
          ) : (
            <View className='report-list'>
              {reports.map((report) => (
                <ReportCard
                  key={report.reportId || report._id}
                  report={report}
                  onView={handleViewReport}
                  onStartEditTitle={startEditTitle}
                  onSaveTitle={saveReportTitle}
                  onCancelEditTitle={cancelEditTitle}
                  editingReportId={editingReportId}
                  isSavingTitle={isSavingReport}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <NicknameEditDialog
        visible={showNicknameDialog}
        value={nicknameInput}
        onInput={setNicknameInput}
        onConfirm={confirmNickname}
        onCancel={closeNicknameDialog}
        loading={isSubmittingNickname}
      />
    </View>
  );
}
