import { useState, useCallback, useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';
import {
  useChat,
  useStayTime,
  getWelcomeMessage,
  trackClickEvent,
  startChatPrefetch,
  getChatPrefetchResult,
  clearChatPrefetch,
  getModeFromParams,
  getPendingReportByMode,
  getPendingReports,
  checkCanStartChat,
  getMessages,
} from '@know-yourself/core';
import { useReport } from '../contexts/ReportContext';
import { useProfile } from '../hooks/useProfile';
import { useDb } from '../contexts/cloudbaseContext';
import { parseTimestamp } from '../utils/date';

const COMPLETED_REPORT_STATUSES = new Set(['completed', 1, '1']);

function isLockedReport(report) {
  return report?.lock === true || report?.lock === 1 || report?.lock === '1';
}

function getReportTimestamp(report) {
  return parseTimestamp(report?.updatedAt ?? report?.createdAt ?? 0);
}

function findLatestLockedReportByMode(mode, remoteReports = []) {
  const localReports = getPendingReports();
  const reports = [...remoteReports, ...localReports]
    .filter((report) => report?.mode === mode)
    .filter((report) => COMPLETED_REPORT_STATUSES.has(report?.status))
    .filter((report) => isLockedReport(report))
    .filter((report) => Boolean(report?.reportId))
    .sort((first, second) => getReportTimestamp(second) - getReportTimestamp(first));

  return reports[0] || null;
}

/**
 * 聊天页业务逻辑：模式、状态、与报告/对话的联动，全部收敛在此
 * 页面只负责把返回的数据与回调交给 UI 组件
 */
export function useChatPage(routerParams) {
  const chatMode = getModeFromParams(routerParams || {});
  const historyReportId = routerParams?.reportId;
  useStayTime('chat_duration', { auto: true, data: { mode: chatMode } });

  const [hasStarted, setHasStarted] = useState(false);
  const [pendingReport, setPendingReport] = useState(null);
  const [suggestionToFill, setSuggestionToFill] = useState(null);
  const [showNoQuotaDialog, setShowNoQuotaDialog] = useState(false);
  const messageListRef = useRef(null);
  const hasRestoredHistoryRef = useRef(false);
  const hasOpenedReportLoadingRef = useRef(false);
  const db = useDb();

  const { reports, isLoggedIn, userExtraInfo, isLoading: isProfileLoading } = useProfile();
  const {
    startReport,
    updateReportContent,
    completeReport,
    createReport,
    updateMessages,
    resumeReport,
    getDiscoverSelfFirst3Answers,
    setReportError,
  } = useReport();

  useEffect(() => {
    if (isProfileLoading) return;
    if (!checkCanStartChat(isLoggedIn, userExtraInfo)) setShowNoQuotaDialog(true);
  }, [isLoggedIn, userExtraInfo, isProfileLoading]);

  useEffect(() => {
    const pending = getPendingReportByMode(chatMode);
    if (pending?.messages?.length > 0) setPendingReport(pending);
  }, [chatMode]);

  useEffect(() => {
    if (hasStarted) return;
    startChatPrefetch(chatMode);
    return () => clearChatPrefetch();
  }, [chatMode, hasStarted]);

  const handleReportStart = useCallback(() => {
    if (hasOpenedReportLoadingRef.current) return;
    hasOpenedReportLoadingRef.current = true;
    startReport();
    // 保留当前聊天页实例，避免 useChat 在检测到 [Report] 后立刻被卸载，
    // 导致后续 onReportUpdate 无法继续把完整报告写进 ReportContext。
    Taro.navigateTo({ url: `/pages/report-loading/index?mode=${chatMode}` });
  }, [startReport, chatMode]);

  const handleReportUpdate = useCallback((content) => updateReportContent(content), [updateReportContent]);
  const handleReportComplete = useCallback(() => completeReport(), [completeReport]);
  const handleReportError = useCallback((error) => setReportError(error?.message || '报告生成失败'), [setReportError]);
  const handleUserMessageSent = useCallback((msgs) => updateMessages(msgs), [updateMessages]);

  const { messages, isLoading, sendUserMessage, restoreMessages, retryMessage } = useChat({
    mode: chatMode,
    onReportStart: handleReportStart,
    onReportUpdate: handleReportUpdate,
    onReportComplete: handleReportComplete,
    onReportError: handleReportError,
    onUserMessageSent: handleUserMessageSent,
  });

  // 从报告结果页进入时，按 reportId 回放历史对话
  useEffect(() => {
    if (!historyReportId || !db || hasRestoredHistoryRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const historyMessages = await getMessages(db, historyReportId);
        if (cancelled) return;
        const normalizedMessages = Array.isArray(historyMessages) ? historyMessages : [];
        resumeReport({
          reportId: historyReportId,
          mode: chatMode,
          messages: normalizedMessages,
          content: '',
        });
        restoreMessages(normalizedMessages);
        setPendingReport(null);
        setHasStarted(true);
        hasRestoredHistoryRef.current = true;
        setTimeout(() => messageListRef.current?.scrollToBottom(), 100);
      } catch {
        if (!cancelled) Taro.showToast({ title: '加载对话记录失败', icon: 'none' });
      }
    })();
    return () => { cancelled = true; };
  }, [historyReportId, db, chatMode, resumeReport, restoreMessages]);

  useEffect(() => {
    if (!hasStarted || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.status !== 'loading') updateMessages(messages);
  }, [hasStarted, messages, updateMessages]);

  const recommendedAnswers = chatMode === 'discover-self' ? getDiscoverSelfFirst3Answers() : [];
  const welcomeMessage = getWelcomeMessage(chatMode);
  const aiMessageCount = messages.filter((m) => m.role === 'assistant').length;
  const progress = Math.min(aiMessageCount, 10);

  const handleResume = useCallback(() => {
    clearChatPrefetch();
    if (pendingReport) {
      hasOpenedReportLoadingRef.current = false;
      resumeReport(pendingReport);
      restoreMessages(pendingReport.messages);
      setHasStarted(true);
      setPendingReport(null);
      setTimeout(() => messageListRef.current?.scrollToBottom(), 100);
      trackClickEvent('resume_chat');
    }
  }, [pendingReport, resumeReport, restoreMessages]);

  const handleStartNew = useCallback(async () => {
    if (isProfileLoading) {
      Taro.showToast({ title: '正在检查历史报告，请稍候', icon: 'none' });
      return;
    }

    const lockedReport = findLatestLockedReportByMode(chatMode, reports);
    if (lockedReport?.reportId) {
      Taro.navigateTo({
        url: `/pages/report-result/index?mode=${lockedReport.mode || chatMode}&reportId=${lockedReport.reportId}`,
      });
      return;
    }

    hasOpenedReportLoadingRef.current = false;
    setPendingReport(null);
    setHasStarted(true);
    await createReport(chatMode);
    sendUserMessage('你好，我准备好了，请开始吧。', getChatPrefetchResult(chatMode));
    trackClickEvent('start_new_chat', { mode: chatMode });
  }, [chatMode, createReport, isProfileLoading, reports, sendUserMessage]);

  const handleStart = useCallback(async () => {
    if (pendingReport) handleResume();
    else await handleStartNew();
  }, [pendingReport, handleResume, handleStartNew]);

  const closeNoQuotaDialog = useCallback(() => {
    setShowNoQuotaDialog(false);
    Taro.navigateBack();
  }, []);

  return {
    chatMode,
    hasStarted,
    pendingReport,
    showNoQuotaDialog,
    welcomeMessage,
    recommendedAnswers,
    progress,
    messages,
    isLoading,
    suggestionToFill,
    setSuggestionToFill,
    messageListRef,
    handleStart,
    handleResume,
    handleStartNew,
    sendUserMessage,
    retryMessage,
    closeNoQuotaDialog,
  };
}
