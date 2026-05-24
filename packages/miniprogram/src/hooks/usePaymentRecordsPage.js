import { useEffect, useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { useDb, useOpenidReady } from '../contexts/cloudbaseContext';
import { getPaymentRecords } from '../services/paymentRecords';

export function usePaymentRecordsPage() {
  const db = useDb();
  const openidReady = useOpenidReady();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecords = useCallback(async () => {
    if (!db || !openidReady) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await getPaymentRecords(db);
      setRecords(result);
    } catch (err) {
      setError(err?.message || '获取支付记录失败');
    } finally {
      setIsLoading(false);
    }
  }, [db, openidReady]);

  useEffect(() => {
    if (!db || !openidReady) return;
    loadRecords();
  }, [db, loadRecords, openidReady]);

  const handleBack = useCallback(() => {
    const pages = Taro.getCurrentPages();
    if (pages.length > 1) {
      Taro.navigateBack();
      return;
    }
    Taro.reLaunch({ url: '/pages/profile/index' });
  }, []);

  const handleViewDetail = useCallback((outTradeNo) => {
    if (!outTradeNo) return;
    Taro.navigateTo({
      url: `/pages/payment-record-detail/index?outTradeNo=${encodeURIComponent(outTradeNo)}`,
    });
  }, []);

  return {
    records,
    isLoading,
    error,
    loadRecords,
    handleBack,
    handleViewDetail,
  };
}
