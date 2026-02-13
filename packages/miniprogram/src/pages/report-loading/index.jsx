import { View, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { useReport } from '../../contexts/ReportContext';
import './index.scss';

// 加载省略号
function LoadingDots() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return <Text className='loading-dots'>{dots}</Text>;
}

// 进度条组件
function ProgressBar({ current, total }) {
  const progress = Math.min((current / total) * 100, 100);
  return (
    <View className='progress-container'>
      <View className='progress-track'>
        <View className='progress-fill' style={{ width: `${progress}%` }} />
      </View>
      <Text className='progress-text'>已生成 {current.toLocaleString()} 字</Text>
    </View>
  );
}

export default function ReportLoading() {
  const REPORT_TOTAL_CHARS = 3000;
  const router = useRouter();
  const mode = router?.params?.mode || 'discover-self';
  const { isComplete, content, currentReportId, reportError, retryReport } = useReport();

  const currentChars = content ? content.length : 0;
  const totalChars = Math.max(REPORT_TOTAL_CHARS, currentChars);

  // 完成后跳转
  useEffect(() => {
    if (isComplete && content) {
      setTimeout(() => {
        Taro.redirectTo({
          url: `/pages/report-result/index?mode=${mode}&reportId=${currentReportId}`,
        });
      }, 1000);
    }
  }, [isComplete, content, mode, currentReportId]);

  return (
    <View className='report-loading'>
      {/* 背景 */}
      <View className='bg-glow bg-glow-1' />
      <View className='bg-glow bg-glow-2' />
      <View className='bg-glow bg-glow-3' />

      {/* 顶部 */}
      <View className='rl-header'>
        <View className='rl-header-back' onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}>
          <Text className='rl-header-back-icon'>←</Text>
        </View>
        <Text className='rl-header-title'>生成报告中</Text>
        <View className='rl-header-placeholder' />
      </View>

      {/* 主体 */}
      <View className='rl-content'>
        {/* 球体 */}
        <View className='orb-container'>
          <View className='orb-shadow' />
          <View className='orb-outer-glow' />
          <View className='orb-base' />
          <View className='orb-glass' />
          <View className='orb-highlight' />
        </View>

        {/* 文字/错误 */}
        {reportError ? (
          <View className='rl-error'>
            <Text className='rl-error-title'>报告生成失败</Text>
            <Text className='rl-error-desc'>
              {typeof reportError === 'string' ? reportError : '请求出现异常，请重试'}
            </Text>
            <View className='rl-retry-btn' onClick={retryReport}>
              <Text className='rl-retry-text'>重新生成</Text>
            </View>
          </View>
        ) : (
          <View className='rl-status'>
            <Text className='rl-status-text'>
              {mode === 'understand-others'
                ? 'Dora正在分析TA的人格档案'
                : 'Dora 正在解析你的内心档案'}
              <LoadingDots />
            </Text>
            <Text className='rl-status-sub'>请稍候，这需要一些时间...</Text>
          </View>
        )}

        <ProgressBar current={currentChars} total={totalChars} />
      </View>
    </View>
  );
}
