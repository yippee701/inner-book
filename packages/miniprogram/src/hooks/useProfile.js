import { useState, useEffect, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { getReports, getUserExtraInfo, updateReportTitle as updateReportTitleApi, isLoggedIn, getCurrentUsername } from '@know-yourself/core';
import { useDb, useOpenidReady } from '../contexts/cloudbaseContext';

// 次数校验已迁移到 core，需要时从 @know-yourself/core 引入 checkCanStartChat

/**
 * Profile Hook（小程序版）
 */
export function useProfile() {
  const db = useDb();
  const openidReady = useOpenidReady();
  const [reports, setReports] = useState([]);
  const [userExtraInfo, setUserExtraInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isUserLoggedIn = isLoggedIn();

  const loadData = useCallback(async () => {
    setError(null);
    if (!db) return;
    if (!isUserLoggedIn) {
      setIsLoading(false);
      return;
    }
    try {
      const [convData, extraInfo] = await Promise.all([
        getReports(db),
        // getUserExtraInfo(db),
      ]);
      setReports(convData);
      setUserExtraInfo(extraInfo || {});
    } catch (err) {
      console.error('加载 Profile 失败:', err);
      setError(err.message || '加载失败');
    } finally {
      setIsLoading(false);
    }
  }, [isUserLoggedIn, db]);

  useEffect(() => { loadData(); }, [loadData, openidReady]);

  const handleUpdateReportTitle = useCallback(async (reportId, title) => {
    if (!db) throw new Error('数据库未初始化');
    await updateReportTitleApi(db, reportId, title);
    await loadData();
  }, [db, loadData]);

  return {
    reports,
    userExtraInfo,
    user: { username: getCurrentUsername() },
    isLoading,
    error,
    updateReportTitle: handleUpdateReportTitle,
    isLoggedIn: isUserLoggedIn,
  };
}
