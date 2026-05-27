import { View, Text, ScrollView, Input } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { REPORT_STATUS } from '@know-yourself/core';
import { useProfilePage } from '../../hooks/useProfilePage';
import { useShareAppMessage } from '@tarojs/taro';
import { NicknameEditDialog } from '../../components/ProfileDialogs';
import './index.scss';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MODE_LABELS = {
  'discover-self': '发现天赋',
  'reduce-inner-friction': '消除内耗',
  'life-choice': '人生选择器',
  'understand-others': '读懂亲友',
  'understand-child': '读懂孩子',
  'understand-lover': '读懂爱人',
};

function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'object') {
    if (typeof value.getTime === 'function') {
      const date = new Date(value.getTime());
      return Number.isNaN(date.getTime()) ? null : date;
    }
    if (typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000);
    }
    if (typeof value._seconds === 'number') {
      return new Date(value._seconds * 1000);
    }
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatArchiveTime(value) {
  const date = normalizeDate(value);
  if (!date) return 'Undated';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} · ${hours}:${minutes}`;
}

function formatArchiveSince(reports) {
  const dates = reports
    .map((report) => normalizeDate(report.createdAt))
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());
  if (dates.length === 0) return 'first letter';
  const first = dates[0];
  return `${MONTHS[first.getMonth()]} ${first.getFullYear()}`;
}

function getArchiveInitial(username) {
  const name = (username || '').trim();
  if (!name || name === '微信用户') return 'me';
  const first = name[0];
  return /^[a-z]$/i.test(first) ? first.toLowerCase() : first;
}

function getArchiveStatus({ isCompleted, isExpired, isLocked }) {
  if (isLocked) return '未解锁';
  if (isCompleted) return '已解锁';
  if (isExpired) return '已过期';
  return '书写中';
}

/**
 * 报告卡片，与 H5 一致：支持内联编辑标题（onStartEditTitle / onSaveTitle / onCancelEditTitle）
 */
function ReportCard({
  report,
  index,
  total,
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
  const archiveNo = total - index;
  const displayTitle = title || `${MODE_LABELS[mode] || '识心笔记'} · 卷${archiveNo}`;
  const archiveStatus = getArchiveStatus({ isCompleted, isExpired, isLocked });
  const statusClass = isLocked ? 'status-sealed' : isExpired ? 'status-expired' : isCompleted ? 'status-delivered' : 'status-pending';

  const handleCardClick = () => {
    if (isEditing) return;
    if (isCompleted && onView) onView(report);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setEditTitle(title || '');
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
      onClick={handleCardClick}
    >
      <Text className='report-card-index'>№{String(archiveNo).padStart(2, '0')}</Text>
      <View className='report-card-main'>
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
            <Text className='report-card-title'>{displayTitle}</Text>
            <Text className='report-card-time'>{formatArchiveTime(report.createdAt)}</Text>
          </>
        )}
      </View>
      <View className='report-card-state'>
        {isLocked ? (
          <View className='report-card-lock'>
            <mp-icon icon="lock" color="#6E4030" size="16" />
          </View>
        ) : !isEditing ? (
          <View className='report-card-edit' onClick={handleEditClick}>
            <mp-icon icon="pencil" color="#B7B0A4" size="16" />
          </View>
        ) : null}
        <Text className={`report-card-status ${statusClass}`}>{archiveStatus}</Text>
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
    handleViewPaymentRecords,
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
  const username = user?.username || '微信用户';
  const archiveInitial = getArchiveInitial(username);
  const archiveSummary = reports.length > 0
    ? `共 ${reports.length} 篇笔记 · 起始于 ${formatArchiveSince(reports)}`
    : '暂无识心笔记 · 等待开启';

  useShareAppMessage(() => ({
    title: 'INNER BOOK',
    imageUrl: 'https://inner-book.top/share.png',
    path: '/pages/index/index',
  }), []);

  return (
    <View className='profile-page'>
      <View className='profile-grain' />

      <View className='profile-top'>
        <View className='profile-kicker-row'>
          <Text className='profile-kicker'>MY ARCHIVE</Text>
          <View className='profile-home-link' onClick={handleGoHome}>
            <Text>HOME · </Text>
            <Text> 回到首页 ↗</Text>
          </View>
        </View>

        <View className='profile-identity'>
          <View className='profile-avatar'>
            <Text className='profile-avatar-letter'>{archiveInitial}</Text>
          </View>
          <View className='profile-copy'>
            <View className='profile-name-row'>
              <Text className='profile-username'>{username}</Text>
              <Text className='profile-role' onClick={() => openNicknameDialog(username)}>· 修改</Text>
            </View>
            <Text className='profile-archive-count'>{archiveSummary}</Text>
          </View>
        </View>

        <View className='profile-divider' />
      </View>

      <ScrollView scrollY className='profile-scroll' enhanced showScrollbar={false}>
        <View className='profile-content'>
          <View className='profile-section-head'>
            <Text className='profile-section-title'>我的识心笔记</Text>
            <View className='profile-ledger-button' onClick={handleViewPaymentRecords}>
              <Text>支付记录</Text>
            </View>
          </View>
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
              <Text className='profile-empty-text'>暂无笔记</Text>
            </View>
          ) : (
            <View className='report-list'>
              {reports.map((report, index) => (
                <ReportCard
                  key={report.reportId || report._id}
                  report={report}
                  index={index}
                  total={reports.length}
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
