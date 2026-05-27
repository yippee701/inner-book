import { Image, View, Text } from '@tarojs/components';
import { useHomePage } from '../../hooks/useHomePage';
import { useMenuButtonLayout } from '../../hooks/useMenuButtonLayout';
import { useShareAppMessage } from '@tarojs/taro';
import { CHAT_MODES } from '@know-yourself/core';
import indexHeader from '../../assets/index-header.png';
import indexOrb from '../../assets/index-orb.png';
import './index.scss';

export default function Homepage() {
  const menuButtonLayout = useMenuButtonLayout();
  const {
    showNoQuotaDialog,
    showSelfModeDialog,
    showPeopleModeDialog,
    handleSelectSelfMode,
    handleSelectPeopleMode,
    goToProfile,
    closeNoQuotaDialog,
    openSelfModeDialog,
    closeSelfModeDialog,
    openPeopleModeDialog,
    closePeopleModeDialog,
  } = useHomePage();

  useShareAppMessage(() => {
    return {
      title: 'INNER BOOK',
      path: '/pages/index/index',
    };
  }, []);

  return (
    <View className='homepage' style={menuButtonLayout}>
      <View className='bg-glow bg-glow-1' />
      <View className='bg-glow bg-glow-2' />
      <View className='bg-glow bg-glow-3' />

      <View className='home-kicker'>
        <Text>VOL I</Text>
        <Text>INNER BOOK</Text>
        <Text>NO 001</Text>
      </View>
      <View className='home-rule' />

      <View className='home-archive-entry' onClick={goToProfile}>
        <View className='home-archive-seal'>
          <Text className='home-archive-seal-text'>B</Text>
        </View>
        <View className='home-archive-copy'>
          <Text className='home-archive-label'>MY ARCHIVE</Text>
          <Text className='home-archive-title'>我的识心笔记</Text>
        </View>
      </View>

      <View className='main-content'>
        <Image className='home-header-image' src={indexHeader} mode='aspectFit' />

        <View className='orb-container'>
          <Image
            className='book-image'
            src={indexOrb}
            mode='aspectFit'
          />
        </View>
      </View>

      <View className='bottom-buttons safe-area-bottom'>
        <View className='btn-row'>
          <View className='home-action'>
            <View className='btn-secondary btn-flex' onClick={openPeopleModeDialog}>
              <Text>识人</Text>
            </View>
            <Text className='home-action-desc'>亲友/孩子/爱人</Text>
          </View>
          <View className='home-action'>
            <View className='btn-primary btn-flex' onClick={openSelfModeDialog}>
              <Text>识己</Text>
            </View>
            <Text className='home-action-desc'>天赋/内耗/选择</Text>
          </View>
        </View>
      </View>

      {showSelfModeDialog && (
        <View className='dialog-mask' onClick={closeSelfModeDialog}>
          <View className='dialog-content people-mode-dialog' onClick={(e) => e.stopPropagation()}>
            <Text className='dialog-title'>识己</Text>
            <Text className='dialog-desc'>选择你想先看清自己的哪一面</Text>
            <View className='people-mode-options'>
              <View className='people-mode-option' onClick={() => handleSelectSelfMode(CHAT_MODES.DISCOVER_SELF)}>
                <Text className='people-mode-title'>发现天赋</Text>
              </View>
              <View className='people-mode-option' onClick={() => handleSelectSelfMode(CHAT_MODES.REDUCE_INNER_FRICTION)}>
                <Text className='people-mode-title'>消除内耗</Text>
              </View>
              <View className='people-mode-option' onClick={() => handleSelectSelfMode(CHAT_MODES.LIFE_CHOICE)}>
                <Text className='people-mode-title'>人生选择器</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {showPeopleModeDialog && (
        <View className='dialog-mask' onClick={closePeopleModeDialog}>
          <View className='dialog-content people-mode-dialog' onClick={(e) => e.stopPropagation()}>
            <Text className='dialog-title'>识人</Text>
            <Text className='dialog-desc'>选择你想理解的对象</Text>
            <View className='people-mode-options'>
              <View className='people-mode-option' onClick={() => handleSelectPeopleMode(CHAT_MODES.UNDERSTAND_OTHERS)}>
                <Text className='people-mode-title'>读懂亲友</Text>
              </View>
              <View className='people-mode-option' onClick={() => handleSelectPeopleMode(CHAT_MODES.UNDERSTAND_CHILD)}>
                <Text className='people-mode-title'>读懂孩子</Text>
              </View>
              <View className='people-mode-option' onClick={() => handleSelectPeopleMode(CHAT_MODES.UNDERSTAND_LOVER)}>
                <Text className='people-mode-title'>读懂爱人</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {showNoQuotaDialog && (
        <View className='dialog-mask' onClick={closeNoQuotaDialog}>
          <View className='dialog-content' onClick={(e) => e.stopPropagation()}>
            <Text className='dialog-title'>对话次数不足</Text>
            <Text className='dialog-desc'>您的对话次数已用完，请稍后再试或联系客服。</Text>
            <View className='btn-primary dialog-btn' onClick={closeNoQuotaDialog}>
              <Text>我知道了</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
