import { useCallback, useState } from 'react';
import Taro from '@tarojs/taro';
import { trackVisitEvent, CAROUSEL_TEXTS, useCarouselIndex, checkCanStartChat } from '@know-yourself/core';
import { useProfile } from './useProfile';

/**
 * 首页业务逻辑：轮播、次数校验、跳转
 */
export function useHomePage() {
  const [showNoQuotaDialog, setShowNoQuotaDialog] = useState(false);
  const { isLoggedIn, userExtraInfo } = useProfile();
  const currentTextIndex = useCarouselIndex(CAROUSEL_TEXTS.length, 4000);

  const handleStartChat = useCallback(
    (mode) => {
      if (!checkCanStartChat(isLoggedIn, userExtraInfo)) {
        setShowNoQuotaDialog(true);
        return;
      }
      Taro.navigateTo({ url: `/pages/chat/index?mode=${mode}` });
      trackVisitEvent('start_chat', { mode });
    },
    [isLoggedIn, userExtraInfo]
  );

  const goToProfile = useCallback(() => {
    Taro.navigateTo({ url: '/pages/profile/index' });
  }, []);

  const closeNoQuotaDialog = useCallback(() => setShowNoQuotaDialog(false), []);

  return {
    carouselTexts: CAROUSEL_TEXTS,
    currentTextIndex,
    showNoQuotaDialog,
    handleStartChat,
    goToProfile,
    closeNoQuotaDialog,
  };
}
