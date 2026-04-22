import { useEffect, useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { useDb, useOpenidReady } from '../contexts/cloudbaseContext';
import { getPaymentRecordDetail, getPaymentReportSummary } from '../services/paymentRecords';

export function usePaymentRecordDetailPage(routerParams) {
  const db = useDb();
  const openidReady = useOpenidReady();
  const outTradeNo = routerParams?.outTradeNo ? decodeURIComponent(routerParams.outTradeNo) : '';
  const [record, setRecord] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDetail = useCallback(async () => {
    if (!db || !openidReady) return;
    if (!outTradeNo) {
      setError('订单号不存在');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const detail = await getPaymentRecordDetail(db, outTradeNo);
      if (!detail) {
        setError('支付记录不存在');
        setRecord(null);
        setReportSummary(null);
        return;
      }
      setRecord(detail);
      if (detail.reportId) {
        const summary = await getPaymentReportSummary(db, detail.reportId);
        setReportSummary(summary);
      } else {
        setReportSummary(null);
      }
    } catch (err) {
      setError(err?.message || '获取支付详情失败');
    } finally {
      setIsLoading(false);
    }
  }, [db, openidReady, outTradeNo]);

  useEffect(() => {
    if (!db || !openidReady) return;
    loadDetail();
  }, [db, loadDetail, openidReady]);

  const handleBack = useCallback(() => {
    const pages = Taro.getCurrentPages();
    if (pages.length > 1) {
      Taro.navigateBack();
      return;
    }
    Taro.reLaunch({ url: '/pages/payment-records/index' });
  }, []);

  const handleViewReport = useCallback(() => {
    if (!reportSummary?.reportId || !reportSummary?.mode) return;
    Taro.navigateTo({
      url: `/pages/report-result/index?mode=${reportSummary.mode}&reportId=${reportSummary.reportId}`,
    });
  }, [reportSummary]);

  return {
    outTradeNo,
    record,
    reportSummary,
    isLoading,
    error,
    loadDetail,
    handleBack,
    handleViewReport,
  };
}
