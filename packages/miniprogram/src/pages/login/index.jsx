import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useLoginPage } from '../../hooks/useLoginPage';
import './index.scss';

export default function LoginPage() {
  const {
    username,
    setUsername,
    password,
    setPassword,
    loading,
    error,
    canSubmit,
    handleLogin,
    handleWechatLogin,
  } = useLoginPage();

  return (
    <View className='login-page'>
      <View className='bg-glow bg-glow-1' />
      <View className='bg-glow bg-glow-2' />
      <View className='bg-glow bg-glow-3' />

      <View className='login-header'>
        <View className='login-header-placeholder' />
        <View className='login-header-home' onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}>
          <Text className='login-header-home-icon'>🏠</Text>
        </View>
      </View>

      <View className='login-content'>
        <View className='login-logo'>
          <View className='login-logo-orb-outer' />
          <View className='login-logo-orb-inner' />
          <Text className='login-logo-icon'>✨</Text>
        </View>
        <Text className='login-title'>登录</Text>
        <Text className='login-subtitle'>欢迎回来</Text>

        {error ? (
          <View className='login-error'>
            <Text className='login-error-text'>{error}</Text>
          </View>
        ) : null}

        <View className='wechat-login-btn' onClick={handleWechatLogin}>
          <Text className='wechat-login-icon'>💬</Text>
          <Text className='wechat-login-text'>微信一键登录</Text>
        </View>

        <View className='login-divider'>
          <View className='login-divider-line' />
          <Text className='login-divider-text'>或使用账号密码</Text>
          <View className='login-divider-line' />
        </View>

        <View className='login-field'>
          <Text className='login-field-label'>用户名</Text>
          <View className='login-field-input-wrap'>
            <Input
              className='login-field-input'
              value={username}
              onInput={(e) => setUsername(e.detail.value)}
              placeholder='请输入用户名'
              placeholderClass='login-placeholder'
              disabled={loading}
            />
          </View>
        </View>

        <View className='login-field'>
          <Text className='login-field-label'>密码</Text>
          <View className='login-field-input-wrap'>
            <Input
              className='login-field-input'
              type='password'
              password
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
              placeholder='请输入密码'
              placeholderClass='login-placeholder'
              disabled={loading}
            />
          </View>
        </View>

        <View
          className={`btn-primary login-submit ${(!canSubmit || loading) ? 'btn-submit-disabled' : ''}`}
          onClick={handleLogin}
        >
          <Text>{loading ? '登录中...' : '登录'}</Text>
        </View>

        <Text className='login-agreement'>
          登录即表示同意《用户协议》和《隐私政策》
        </Text>
      </View>
    </View>
  );
}
