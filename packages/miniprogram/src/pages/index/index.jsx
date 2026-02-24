import { View, Text } from '@tarojs/components';
import { useHomePage } from '../../hooks/useHomePage';
import './index.scss';

export default function Homepage() {
  const {
    carouselTexts,
    currentTextIndex,
    showNoQuotaDialog,
    handleStartChat,
    goToProfile,
    closeNoQuotaDialog,
  } = useHomePage();

  return (
    <View className='homepage'>
      <View className='bg-glow bg-glow-1' />
      <View className='bg-glow bg-glow-2' />
      <View className='bg-glow bg-glow-3' />

      <View className='header'>
        <View className='header-placeholder' />
        <View className='header-profile' onClick={goToProfile}>
          <mp-icon icon="me" color="#1F2937" size="28"></mp-icon>
        </View>
      </View>

      <View className='main-content'>
        <View className='orb-container'>
          <View className='orb-shadow' />
          <View className='orb-outer-glow' />
          <View className='orb-inner-glow' />
          <View className='orb-base' />
          <View className='orb-glass' />
          <View className='orb-highlight' />
        </View>

        <View className='carousel-area'>
          {carouselTexts.map((item, index) => (
            <View
              key={item.title}
              className={`carousel-item ${index === currentTextIndex ? 'active' : ''}`}
            >
              <Text className='carousel-title'>{item.title}</Text>
              <Text className='carousel-subtitle'>{item.subtitle}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className='bottom-buttons safe-area-bottom'>
        <View className='btn-row'>
          <View className='btn-primary btn-flex' onClick={() => handleStartChat('understand-others')}>
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
