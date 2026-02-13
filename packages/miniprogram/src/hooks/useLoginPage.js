import { useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { useAuth } from '../contexts/cloudbaseContext';
import { useReport } from '../contexts/ReportContext';

/**
 * 登录页业务逻辑：表单状态、账号登录、微信登录
 */
export function useLoginPage() {
  const auth = useAuth();
  const { checkLoginAndSync } = useReport();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = username.length >= 3 && password.length >= 6;

  const handleLogin = useCallback(async () => {
    if (!canSubmit || loading) return;
    setError('');
    setLoading(true);
    try {
      await auth.signIn({ username, password });
      await checkLoginAndSync();
      Taro.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 1000);
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  }, [canSubmit, loading, username, password, auth, checkLoginAndSync]);

  const handleWechatLogin = useCallback(async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const { code } = await Taro.login();
      const { result } = await Taro.cloud.callFunction({ name: 'login', data: { code } });
      if (result?.success) {
        await checkLoginAndSync();
        Taro.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => Taro.navigateBack(), 1000);
      } else {
        setError(result?.message || '微信登录失败');
      }
    } catch (err) {
      setError(err.message || '微信登录失败');
    } finally {
      setLoading(false);
    }
  }, [loading, checkLoginAndSync]);

  return {
    username,
    setUsername,
    password,
    setPassword,
    loading,
    error,
    canSubmit,
    handleLogin,
    handleWechatLogin,
  };
}
