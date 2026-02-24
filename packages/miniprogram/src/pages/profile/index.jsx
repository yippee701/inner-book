import { View, Text, ScrollView } from '@tarojs/components';
import { REPORT_STATUS } from '@know-yourself/core';
import { useProfilePage } from '../../hooks/useProfilePage';
import { useShareAppMessage } from '@tarojs/taro';
import './index.scss';

function ReportCard({ report, onView }) {
  const { status, title, mode } = report;
  const isCompleted = status === REPORT_STATUS.COMPLETED;
  const isExpired = status === REPORT_STATUS.EXPIRED;
  const createdAt = new Date(report.createdAt).toLocaleString();
  const modeColors = {
    'discover-self': { border: '#a78bfa', bg: 'rgba(167, 139, 250, 0.08)' },
    'understand-others': { border: '#60a5fa', bg: 'rgba(96, 165, 250, 0.08)' },
  };
  const colors = modeColors[mode] || modeColors['discover-self'];

  useShareAppMessage(() => {
    return {
      title: 'Inner Book',
      path: `/pages/index/index`,
    };
  }, []);

  return (
    <View
      className={`report-card ${isExpired ? 'report-card-expired' : ''} ${isCompleted ? 'report-card-clickable' : ''}`}
      style={{ borderLeftColor: colors.border, backgroundColor: colors.bg }}
      onClick={() => isCompleted && onView?.(report)}
    >
      <Text className='report-card-title'>{title || '未命名报告'}</Text>
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
  } = useProfilePage();

  return (
    <View className='profile-page'>
      <View className='bg-glow bg-glow-1' />
      <View className='bg-glow bg-glow-2' />

      <View className='profile-header'>
        <View className='profile-header-left'>
          <View className='profile-avatar'>
          <mp-icon icon="me" color="#1F2937" size="28"></mp-icon>
          </View>
          <Text className='profile-username'>{user?.username || '微信用户'}</Text>
        </View>
        <View className='profile-header-home' onClick={handleGoHome}>
          <mp-icon icon="home" color="#1F2937" size="28"></mp-icon>
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
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
