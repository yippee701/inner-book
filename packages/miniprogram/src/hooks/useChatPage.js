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
  checkCanStartChat,
} from '@know-yourself/core';
import { useReport } from '../contexts/ReportContext';
import { useProfile } from '../hooks/useProfile';

/**
 * 聊天页业务逻辑：模式、状态、与报告/对话的联动，全部收敛在此
 * 页面只负责把返回的数据与回调交给 UI 组件
 */
export function useChatPage(routerParams) {
  const chatMode = getModeFromParams(routerParams || {});
  useStayTime('chat_duration', { auto: true, data: { mode: chatMode } });

  const [hasStarted, setHasStarted] = useState(false);
  const [pendingReport, setPendingReport] = useState(null);
  const [suggestionToFill, setSuggestionToFill] = useState(null);
  const [showNoQuotaDialog, setShowNoQuotaDialog] = useState(false);
  const messageListRef = useRef(null);

  const { isLoggedIn, userExtraInfo, isLoading: isProfileLoading } = useProfile();
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
    startReport();
    Taro.redirectTo({ url: `/pages/report-loading/index?mode=${chatMode}` });
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
      resumeReport(pendingReport);
      restoreMessages(pendingReport.messages);
      setHasStarted(true);
      setPendingReport(null);
      setTimeout(() => messageListRef.current?.scrollToBottom(), 100);
      trackClickEvent('resume_chat');
    }
  }, [pendingReport, resumeReport, restoreMessages]);

  const handleStartNew = useCallback(async () => {
    setPendingReport(null);
    setHasStarted(true);
    await createReport(chatMode);
    sendUserMessage('你好，我准备好了，请开始吧。', getChatPrefetchResult(chatMode));
    trackClickEvent('start_new_chat', { mode: chatMode });
  }, [chatMode, createReport, sendUserMessage]);

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
