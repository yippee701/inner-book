import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports, getUserExtraInfo, restartConversation, updateReportTitle as updateReportTitleApi } from '../api/profile';
import { isLoggedIn, getCurrentUsername } from '../utils/user';
import { useRdb } from '../contexts/cloudbaseContext';
import { USER_INFO_LOCAL_STORAGE_KEY } from '../constants/global';

/**
 * 检查用户是否有剩余对话次数
 * @param {boolean} isUserLoggedIn - 是否已登录
 * @param {object} userExtraInfo - 用户额外信息
 * @returns {boolean} true: 可以对话, false: 次数不足
 */
export function checkCanStartChat(isUserLoggedIn, userExtraInfo) {
  // 未登录用户可以对话（会在完成时提示登录）
  if (!isUserLoggedIn) return true;
  // 已登录用户检查剩余次数
  const remaining = userExtraInfo?.remainingReport ?? 1;
  return remaining > 0;
}

/**
 * Profile 页面数据 Hook - 管理用户资料、对话历史和裂变进度
 */
export function useProfile() {
  const navigate = useNavigate();
  const rdb = useRdb();
  const [reports, setReports] = useState([]);
  const [userExtraInfo, setUserExtraInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isUserLoggedIn = isLoggedIn();

  // 加载页面数据（对话历史和裂变进度）
  const loadData = useCallback(async () => {
    setError(null);
    
    if (!rdb) return;
    if (!isUserLoggedIn) {
      setIsLoading(false);
      return;
    }
    try {
      // 获取对话历史和裂变进度
      const [convData, userExtraInfo] = await Promise.all([
        getReports(rdb),
        getUserExtraInfo(rdb),
      ]);
      
      setReports(convData);
      setUserExtraInfo(userExtraInfo);
    } catch (err) {
      console.error('加载 Profile 数据失败:', err);
      setError(err.message || '加载失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [isUserLoggedIn, rdb]);

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

  // 跳转到登录页
  const goToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  // 更新报告标题
  const handleUpdateReportTitle = useCallback(async (reportId, title) => {
    if (!rdb) throw new Error('数据库未初始化');
    await updateReportTitleApi(rdb, reportId, title);
    await loadData();
  }, [rdb, loadData]);

  return {
    reports,
    userExtraInfo,
    user: {
      username: getCurrentUsername(),
    },
    isLoading: isLoading,
    error,
    restartConversation: handleRestartConversation,
    updateReportTitle: handleUpdateReportTitle,
    isLoggedIn: isUserLoggedIn,
    goToLogin,
  };
}

