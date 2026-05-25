import { Image, View, Text } from '@tarojs/components';
import { useHomePage } from '../../hooks/useHomePage';
import { useMenuButtonLayout } from '../../hooks/useMenuButtonLayout';
import { useShareAppMessage } from '@tarojs/taro';
import indexHeader from './index-header.png';
import indexOrb from './index-orb.png';
import './index.scss';

export default function Homepage() {
  const menuButtonLayout = useMenuButtonLayout();
  const {
    showNoQuotaDialog,
    showPeopleModeDialog,
    handleStartChat,
    handleSelectPeopleMode,
    goToProfile,
    closeNoQuotaDialog,
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

        <View className='carousel-area home-fixed-copy'>
          <Text className='carousel-title'>于几轮往来对话，</Text>
          <Text className='carousel-subtitle'>重新认识那个住在你心里的人。</Text>
        </View>
      </View>

      <View className='bottom-buttons safe-area-bottom'>
        <View className='btn-row'>
          <View className='btn-secondary btn-flex' onClick={openPeopleModeDialog}>
            <Text>识人</Text>
          </View>
          <View className='btn-primary btn-flex' onClick={() => handleStartChat('discover-self')}>
            <Text>识己</Text>
          </View>
        </View>
      </View>

      {showPeopleModeDialog && (
        <View className='dialog-mask' onClick={closePeopleModeDialog}>
          <View className='dialog-content people-mode-dialog' onClick={(e) => e.stopPropagation()}>
            <Text className='dialog-title'>识人</Text>
            <Text className='dialog-desc'>选择你想理解的对象</Text>
            <View className='people-mode-options'>
              <View className='people-mode-option' onClick={() => handleSelectPeopleMode('understand-others')}>
                <Text className='people-mode-title'>看懂他人</Text>
              </View>
              <View className='people-mode-option' onClick={() => handleSelectPeopleMode('understand-child')}>
                <Text className='people-mode-title'>读懂孩子</Text>
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
