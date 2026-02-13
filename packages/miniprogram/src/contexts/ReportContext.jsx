import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';
import {
  getCurrentUsername, isLoggedIn, getCurrentUserId,
  generateReportTitle, extractReportSubTitle, cleanReportContent, generateReportId,
  REPORT_STATUS,
  sendMessage,
  getReportDetail, verifyInviteCode, saveMessages,
  trackVisitEvent, trackConversationRound,
} from '@know-yourself/core';
import { useAuth, useCloudbaseApp, useDb } from './cloudbaseContext';

const ReportContext = createContext(null);
const LOCAL_REPORTS_KEY = 'pendingReports';
const DISCOVER_SELF_FIRST_3_ANSWERS_KEY = 'discoverSelfFirst3Answers';

/** 读取本地报告列表 */
function readLocalReports() {
  try {
    const raw = Taro.getStorageSync(LOCAL_REPORTS_KEY);
    return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
  } catch { return []; }
}

/** 写入本地报告列表 */
function writeLocalReports(reports) {
  try {
    Taro.setStorageSync(LOCAL_REPORTS_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('写入本地报告失败:', e);
  }
}

/** 本地报告 LRU 裁剪 */
function trimLocalReports(reports) {
  const completed = reports.filter(r => r.status === 'completed');
  const pending = reports.filter(r => r.status === 'pending');
  const completedKeep = [...completed]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);
  const pendingByMode = {};
  pending.forEach(r => {
    const m = r.mode || 'unknown';
    if (!pendingByMode[m] || new Date(r.createdAt) > new Date(pendingByMode[m].createdAt)) {
      pendingByMode[m] = r;
    }
  });
  return [...completedKeep, ...Object.values(pendingByMode)];
}

export function ReportProvider({ children }) {
  const db = useDb();
  const auth = useAuth();
  const cloudbaseApp = useCloudbaseApp();
  const [reportState, setReportState] = useState({
    content: '',
    subTitle: '',
    messages: [],
    isGenerating: false,
    isPending: true,
    isComplete: false,
    isFromHistory: false,
    currentReportId: null,
    currentMode: null,
    reportError: null,
  });

  const onShowInviteCodeDialogRef = useRef(null);
  const onShowInviteLoginDialogRef = useRef(null);
  const isSavingRef = useRef(false);
  const reportStateRef = useRef(reportState);
  const lastReportedRoundByReportIdRef = useRef({});
  const hasTrackedStartReportByReportIdRef = useRef(new Set());

  useEffect(() => { reportStateRef.current = reportState; }, [reportState]);

  // 保存报告到本地
  const saveReportToLocal = useCallback((report) => {
    try {
      const existing = readLocalReports();
      const idx = existing.findIndex(r => r.reportId === report.reportId);
      if (idx >= 0) existing[idx] = report;
      else existing.push(report);
      writeLocalReports(trimLocalReports(existing));
    } catch (e) { console.error('saveReportToLocal:', e); }
  }, []);

  // 更新本地报告
  const updateLocalReport = useCallback((reportId, updates) => {
    try {
      const existing = readLocalReports();
      const idx = existing.findIndex(r => r.reportId === reportId);
      if (idx >= 0) {
        existing[idx] = { ...existing[idx], ...updates };
        writeLocalReports(trimLocalReports(existing));
      }
    } catch (e) { console.error('updateLocalReport:', e); }
  }, []);

  // 保存报告到远端
  const saveReportToRemote = useCallback((report, options = {}) => {
    if (!db) return Promise.reject(new Error('db 未初始化'));
    const { status = REPORT_STATUS.PENDING, saveUserInfo = false } = options;
    const username = saveUserInfo ? getCurrentUsername() : null;
    const reportId = report.reportId;
    if (!reportId) return Promise.reject(new Error('reportId 不能为空'));

    const insertData = {
      content: cleanReportContent(report.content) || '',
      title: report.title,
      subTitle: report.subTitle || '',
      status,
      mode: report.mode,
      reportId,
    };
    if (saveUserInfo && username) insertData.username = username;

    const finish = (resolve) => {
      if (report.messages?.length > 0) {
        saveMessages(db, reportId, report.messages)
          .then(() => resolve({ data: insertData, reportId }))
          .catch(() => resolve({ data: insertData, reportId }));
      } else {
        resolve({ data: insertData, reportId });
      }
    };

    return new Promise((resolve, reject) => {
      db.collection('report').where({ reportId }).get((res, data) => {
        if (res !== 0) { reject(new Error(data?.message || '查询报告失败')); return; }
        const exists = data?.data?.length > 0;
        const onDone = (res2, data2, action) => {
          if (res2 !== 0) { reject(new Error(data2?.message || `报告${action}失败`)); return; }
          finish(resolve);
        };
        if (exists) {
          insertData.updatedAt = +new Date();
          db.collection('report').where({ reportId }).update(insertData, (r, d) => onDone(r, d, '更新'));
        } else {
          insertData.lock = true;
          insertData.createdAt = +new Date();
          db.collection('report').add(insertData, (r, d) => onDone(r, d, '新增'));
        }
      });
    });
  }, [db]);

  // 同步本地报告到远端
  const syncLocalReportsToRemote = useCallback(async () => {
    try {
      let localReports = readLocalReports();
      const completed = localReports.filter(r => r.status === 'completed');
      if (completed.length === 0) return;

      const neverSynced = completed.filter(r => r.remoteSynced === false || r.synced === false);
      for (const report of neverSynced) {
        try {
          const loggedIn = isLoggedIn();
          await saveReportToRemote(report, { status: REPORT_STATUS.COMPLETED, saveUserInfo: loggedIn });
          updateLocalReport(report.reportId, { remoteSynced: true, userBound: loggedIn });
        } catch {}
      }

      if (isLoggedIn()) {
        localReports = readLocalReports();
        const remaining = localReports.filter(r => {
          if (r.status === 'completed' && r.remoteSynced && r.userBound) return false;
          return true;
        });
        writeLocalReports(trimLocalReports(remaining));
      }
    } catch (e) { console.error('syncLocalReportsToRemote:', e); }
  }, [saveReportToRemote, updateLocalReport]);

  const checkLoginAndSync = useCallback(async () => {
    if (isLoggedIn()) await syncLocalReportsToRemote();
  }, [syncLocalReportsToRemote]);

  useEffect(() => { syncLocalReportsToRemote(); }, [syncLocalReportsToRemote]);

  // ========== 报告生命周期方法 ==========

  const createReport = useCallback(async (mode) => {
    const title = generateReportTitle(mode);
    const reportId = generateReportId();
    const report = {
      reportId, title, content: '', messages: [], status: 'pending',
      mode, createdAt: new Date().toISOString(),
      remoteSynced: false, userBound: false, lock: true,
    };
    setReportState(prev => ({
      ...prev, currentReportId: reportId, currentMode: mode,
      messages: [], content: '', isPending: true, isComplete: false, isFromHistory: false,
    }));
    saveReportToLocal(report);
    try {
      const loggedIn = isLoggedIn();
      await saveReportToRemote(report, { status: REPORT_STATUS.PENDING, saveUserInfo: loggedIn });
      updateLocalReport(reportId, { remoteSynced: true, userBound: loggedIn });
    } catch (e) { console.error('同步失败:', e); }
    return reportId;
  }, [saveReportToLocal, saveReportToRemote, updateLocalReport]);

  const setReportError = useCallback((error) => {
    setReportState(prev => ({ ...prev, reportError: error }));
  }, []);

  const completeReportRef = useRef(null);

  const retryReport = useCallback(async () => {
    const { messages: msgs, currentMode: mode } = reportStateRef.current;
    if (!msgs?.length) return;
    setReportState(prev => ({ ...prev, reportError: null, isGenerating: true, isComplete: false }));
    const apiMessages = msgs.map(m => ({ role: m.role, content: m.content }));
    try {
      let reportContent = '';
      await sendMessage(apiMessages, (streamContent) => {
        if (streamContent.includes('[Report]')) {
          reportContent = streamContent;
          setReportState(prev => ({
            ...prev, subTitle: extractReportSubTitle(streamContent), content: cleanReportContent(streamContent),
          }));
        }
      }, mode);
      if (reportContent) {
        setReportState(prev => ({
          ...prev, subTitle: extractReportSubTitle(reportContent), content: cleanReportContent(reportContent),
        }));
        setTimeout(() => { completeReportRef.current?.(); }, 100);
      }
    } catch (error) {
      setReportState(prev => ({ ...prev, reportError: error?.message || '重试失败' }));
    }
  }, []);

  const startReport = useCallback(() => {
    const reportId = reportStateRef.current?.currentReportId;
    if (reportId && !hasTrackedStartReportByReportIdRef.current.has(reportId)) {
      hasTrackedStartReportByReportIdRef.current.add(reportId);
      trackVisitEvent('start_generate_report_expose');
    }
    setReportState(prev => ({
      ...prev, isGenerating: true, isPending: true, isComplete: false, reportError: null,
    }));
  }, []);

  const updateMessages = useCallback((messages) => {
    const reportId = reportStateRef.current?.currentReportId;
    const round = (messages || []).filter(m => m.role === 'user').length;
    const lastReported = lastReportedRoundByReportIdRef.current[reportId] ?? 0;
    if (reportId && round > lastReported) {
      trackConversationRound(reportId, round);
      lastReportedRoundByReportIdRef.current[reportId] = round;
    }
    setReportState(prev => {
      const newState = { ...prev, messages };
      if (prev.currentReportId) {
        updateLocalReport(prev.currentReportId, { messages });
      }
      // discover-self 模式保存推荐答案
      if (prev.currentMode === 'discover-self' && Array.isArray(messages)) {
        const userContents = messages.filter(m => m.role === 'user' && m.content)
          .map(m => typeof m.content === 'string' ? m.content.trim() : '').filter(Boolean);
        const round2To4 = userContents.slice(1, 4);
        try {
          let existing = [null, null, null];
          const raw = Taro.getStorageSync(DISCOVER_SELF_FIRST_3_ANSWERS_KEY);
          if (raw) {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (Array.isArray(parsed)) existing = [parsed[0] ?? null, parsed[1] ?? null, parsed[2] ?? null];
          }
          const merged = [round2To4[0] ?? existing[0], round2To4[1] ?? existing[1], round2To4[2] ?? existing[2]];
          if (merged.some(Boolean)) Taro.setStorageSync(DISCOVER_SELF_FIRST_3_ANSWERS_KEY, JSON.stringify(merged));
        } catch {}
      }
      return newState;
    });
  }, [updateLocalReport]);

  const updateReportContent = useCallback((content) => {
    setReportState(prev => ({
      ...prev, subTitle: extractReportSubTitle(content), content: cleanReportContent(content),
    }));
  }, []);

  const handleInviteCodeSubmit = useCallback(async (reportId, inviteCode) => {
    try {
      const response = await verifyInviteCode(cloudbaseApp, inviteCode, reportId);
      const result = response.result;
      if (result.retcode !== 0) throw new Error(result.message);
      updateLocalReport(reportId, { lock: 0 });
      return true;
    } catch (err) { throw err; }
  }, [cloudbaseApp, updateLocalReport]);

  const completeReport = useCallback(async () => {
    if (isSavingRef.current) return;
    const currentState = reportStateRef.current;
    const { currentReportId: reportId, content: reportContent, messages: reportMessages, subTitle } = currentState;
    setReportState(prev => ({ ...prev, isGenerating: false, isPending: false, isComplete: true }));
    if (reportId) {
      isSavingRef.current = true;
      const reportUpdate = { content: reportContent, subTitle, messages: reportMessages, status: 'completed' };
      updateLocalReport(reportId, reportUpdate);
      try {
        const localReports = readLocalReports();
        const currentReport = localReports.find(r => r.reportId === reportId);
        if (currentReport) {
          const loggedIn = isLoggedIn();
          await saveReportToRemote({ ...currentReport, ...reportUpdate }, {
            status: REPORT_STATUS.COMPLETED, saveUserInfo: loggedIn,
          });
          if (loggedIn) {
            writeLocalReports(trimLocalReports(localReports.filter(r => r.reportId !== reportId)));
          } else {
            updateLocalReport(reportId, { remoteSynced: true, userBound: false });
          }
          trackVisitEvent('complete_report_expose');
          onShowInviteCodeDialogRef.current?.(reportId);
        }
      } catch (e) { console.error('同步失败:', e); }
      isSavingRef.current = false;
    }
  }, [saveReportToRemote, updateLocalReport]);

  useEffect(() => { completeReportRef.current = completeReport; }, [completeReport]);

  const getReportDetailWrapper = useCallback(async (reportId) => {
    if (!reportId || !db) return null;
    try {
      const detail = await getReportDetail(db, reportId);
      if (detail) {
        setReportState(prev => ({
          ...prev, content: detail.content, subTitle: detail.subTitle,
          isComplete: detail.isCompleted, currentReportId: reportId,
        }));
        if (detail.lock) onShowInviteCodeDialogRef.current?.(reportId);
      }
      return detail;
    } catch { return null; }
  }, [db]);

  const getDiscoverSelfFirst3Answers = useCallback(() => {
    try {
      const raw = Taro.getStorageSync(DISCOVER_SELF_FIRST_3_ANSWERS_KEY);
      if (!raw) return [null, null, null];
      const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(arr) ? [arr[0] ?? null, arr[1] ?? null, arr[2] ?? null] : [null, null, null];
    } catch { return [null, null, null]; }
  }, []);

  const getPendingReport = useCallback((mode) => {
    try {
      return readLocalReports().find(r => r.mode === mode && r.status === 'pending') || null;
    } catch { return null; }
  }, []);

  const resumeReport = useCallback((report) => {
    if (!report) return false;
    setReportState(prev => ({
      ...prev, currentReportId: report.reportId, currentMode: report.mode,
      messages: report.messages || [], content: report.content || '',
      isGenerating: false, isPending: true, isComplete: false, isFromHistory: false,
    }));
    return true;
  }, []);

  return (
    <ReportContext.Provider value={{
      ...reportState,
      isLoggedIn: isLoggedIn(),
      createReport, startReport, updateMessages, updateReportContent, completeReport,
      getPendingReport, getDiscoverSelfFirst3Answers, getReportDetail: getReportDetailWrapper,
      resumeReport, saveReportToLocal, saveReportToRemote, syncLocalReportsToRemote,
      checkLoginAndSync, handleInviteCodeSubmit, setReportError, retryReport,
      registerInviteCodeDialog: (cb) => { onShowInviteCodeDialogRef.current = cb; },
      registerInviteLoginDialog: (cb) => { onShowInviteLoginDialogRef.current = cb; },
    }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const context = useContext(ReportContext);
  if (!context) throw new Error('useReport must be used within a ReportProvider');
  return context;
}
