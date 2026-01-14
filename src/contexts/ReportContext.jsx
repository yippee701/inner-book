import { createContext, useContext, useState, useCallback } from 'react';

const ReportContext = createContext(null);

export function ReportProvider({ children }) {
  const [reportState, setReportState] = useState({
    content: '',        // 报告内容（去除 [Report] 前缀）
    isGenerating: false, // 正在生成中
    isComplete: false,   // 生成完成
    isFromHistory: false, // 是否来自历史报告
  });

  // 开始生成报告
  const startReport = useCallback(() => {
    setReportState({
      content: '',
      isGenerating: true,
      isComplete: false,
    });
  }, []);

  // 更新报告内容（流式）
  const updateReportContent = useCallback((content) => {
    // 移除 [Report] 前缀
    const cleanContent = content.replace(/^\[Report\]\s*/i, '');
    setReportState(prev => ({
      ...prev,
      content: cleanContent,
    }));
  }, []);

  // 完成报告生成
  const completeReport = useCallback(() => {
    setReportState(prev => ({
      ...prev,
      isGenerating: false,
      isComplete: true,
    }));
  }, []);

  // 重置报告状态
  const resetReport = useCallback(() => {
    setReportState({
      content: '',
      isGenerating: false,
      isComplete: false,
    });
  }, []);

  // 设置历史报告内容（用于查看历史记录）
  const setHistoryReport = useCallback((content) => {
    setReportState({
      content: content || '',
      isGenerating: false,
      isComplete: true,
      isFromHistory: true,
    });
  }, []);

  return (
    <ReportContext.Provider value={{
      ...reportState,
      startReport,
      updateReportContent,
      completeReport,
      resetReport,
      setHistoryReport,
    }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}

