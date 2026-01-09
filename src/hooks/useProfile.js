import { useState, useEffect, useCallback } from 'react';
import { getProfilePageData, restartConversation } from '../api/profile';

/**
 * Profile 页面数据 Hook - 管理用户资料、对话历史和裂变进度
 */
export function useProfile() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [fission, setFission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 加载页面数据
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getProfilePageData();
      setUser(data.user);
      setConversations(data.conversations);
      setFission(data.fission);
    } catch (err) {
      console.error('加载 Profile 数据失败:', err);
      setError(err.message || '加载失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    user,
    conversations,
    fission,
    isLoading,
    error,
    refresh,
    restartConversation: handleRestartConversation,
  };
}

