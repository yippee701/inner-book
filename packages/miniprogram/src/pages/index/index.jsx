import { View, Text } from '@tarojs/components';
import { useHomePage } from '../../hooks/useHomePage';
import { useShareAppMessage } from '@tarojs/taro';
import './index.scss';

export default function Homepage() {
  const {
    showNoQuotaDialog,
    handleStartChat,
    goToProfile,
    closeNoQuotaDialog,
  } = useHomePage();

  useShareAppMessage(() => {
    return {
      title: 'Inner Book',
      path: '/pages/index/index',
    };
  }, []);

  return (
    <View className='homepage'>
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
          <Text className='home-archive-seal-text'>ib</Text>
        </View>
        <View className='home-archive-copy'>
          <Text className='home-archive-label'>YOUR ARCHIVE</Text>
          <Text className='home-archive-title'>我的识心笔记</Text>
        </View>
      </View>

      <View className='main-content'>
        <View className='home-hero'>
          <Text className='home-dear'>Dear you,</Text>
          <Text className='home-title'>识心笔记</Text>
          <Text className='home-subtitle'>An Inner Correspondence</Text>
          <View className='home-wave' />
        </View>

        <View className='orb-container'>
          <View className='orb-shadow' />
          <View className='book-ribbon' />
          <View className='book-pages' />
          <View className='book-cover'>
            <View className='book-frame' />
            <Text className='book-kicker'>VOL I</Text>
            <Text className='book-title'>识心笔记</Text>
            <Text className='book-subtitle'>Inner Book</Text>
            <View className='book-seal'>
              <Text className='book-seal-text'>ib</Text>
            </View>
            <Text className='book-number'>NO 001</Text>
          </View>
        </View>

        <View className='carousel-area home-fixed-copy'>
          <Text className='carousel-title'>于几轮往来对话，</Text>
          <Text className='carousel-subtitle'>重新认识那个住在你心里的人。</Text>
        </View>
      </View>

      <View className='bottom-buttons safe-area-bottom'>
        <View className='btn-row'>
          <View className='btn-secondary btn-flex' onClick={() => handleStartChat('understand-others')}>
            <Text>了解他人</Text>
          </View>
          <View className='btn-primary btn-flex' onClick={() => handleStartChat('discover-self')}>
            <Text>发掘自己</Text>
          </View>
        </View>
      </View>

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
