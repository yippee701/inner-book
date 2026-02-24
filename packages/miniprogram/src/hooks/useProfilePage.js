import Taro from '@tarojs/taro';
import { useProfile } from './useProfile';
import { isLoggedIn } from '@know-yourself/core';

/**
 * 个人中心页：聚合 useProfile + 导航回调，页面只做展示
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

  return {
    ...profile,
    userLoggedIn,
    handleViewReport,
    handleGoHome,
  };
}
