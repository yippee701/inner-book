import { useCallback, useState } from 'react';
import Taro from '@tarojs/taro';
import { trackVisitEvent, CAROUSEL_TEXTS, useCarouselIndex, checkCanStartChat } from '@know-yourself/core';
import { useProfile } from './useProfile';

/**
 * 首页业务逻辑：轮播、次数校验、跳转
 */
export function useHomePage() {
  const [showNoQuotaDialog, setShowNoQuotaDialog] = useState(false);
  const [showSelfModeDialog, setShowSelfModeDialog] = useState(false);
  const [showPeopleModeDialog, setShowPeopleModeDialog] = useState(false);
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

  const openSelfModeDialog = useCallback(() => setShowSelfModeDialog(true), []);
  const closeSelfModeDialog = useCallback(() => setShowSelfModeDialog(false), []);
  const closeNoQuotaDialog = useCallback(() => setShowNoQuotaDialog(false), []);
  const openPeopleModeDialog = useCallback(() => setShowPeopleModeDialog(true), []);
  const closePeopleModeDialog = useCallback(() => setShowPeopleModeDialog(false), []);

  const handleSelectSelfMode = useCallback(
    (mode) => {
      setShowSelfModeDialog(false);
      handleStartChat(mode);
    },
    [handleStartChat]
  );

  const handleSelectPeopleMode = useCallback(
    (mode) => {
      setShowPeopleModeDialog(false);
      handleStartChat(mode);
    },
    [handleStartChat]
  );

  return {
    carouselTexts: CAROUSEL_TEXTS,
    currentTextIndex,
    showNoQuotaDialog,
    showSelfModeDialog,
    showPeopleModeDialog,
    handleStartChat,
    handleSelectSelfMode,
    handleSelectPeopleMode,
    goToProfile,
    closeNoQuotaDialog,
    openSelfModeDialog,
    closeSelfModeDialog,
    openPeopleModeDialog,
    closePeopleModeDialog,
  };
}
