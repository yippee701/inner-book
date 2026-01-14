import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './useUser';
import { getConversations, getFissionProgress, restartConversation } from '../api/profile';

/**
 * Profile 页面数据 Hook - 管理用户资料、对话历史和裂变进度
 */
export function useProfile() {
  const navigate = useNavigate();
  const { user, isLoading: userLoading, isLoggedIn, refresh: refreshUser } = useUser();
  const [conversations, setConversations] = useState([]);
  const [fission, setFission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 加载页面数据（对话历史和裂变进度）
  const loadData = useCallback(async () => {
    if (userLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (!isLoggedIn) {
        setConversations([]);
        setFission(null);
        return;
      }
      
      // 获取对话历史和裂变进度
      const [convData, fissionData] = await Promise.all([
        getConversations(),
        getFissionProgress(),
      ]);
      
      setConversations(convData);
      setFission(fissionData);
    } catch (err) {
      console.error('加载 Profile 数据失败:', err);
      setError(err.message || '加载失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [userLoading, isLoggedIn]);

  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 重新开启对话
  const handleRestartConversation = useCallback(async (conversationId) => {
    try {
      const result = await restartConversation(conversationId);
      if (result.success) {
        // 刷新对话列表
        await loadData();
        return result.newConversationId;
      }
    } catch (err) {
      console.error('重新开启对话失败:', err);
      throw err;
    }
  }, [loadData]);

  // 刷新数据
  const refresh = useCallback(async () => {
    await refreshUser();
    await loadData();
  }, [refreshUser, loadData]);

  // 跳转到登录页
  const goToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  return {
    user,
    conversations,
    fission,
    isLoading: userLoading || isLoading,
    error,
    isLoggedIn,
    refresh,
    restartConversation: handleRestartConversation,
    goToLogin,
  };
}

