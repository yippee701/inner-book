import { View, Text, Image, ScrollView, RichText, Button } from '@tarojs/components';
import { useEffect, useCallback, useState } from 'react';
import Taro, { useRouter, useShareAppMessage } from '@tarojs/taro';
import { useReport } from '../../contexts/ReportContext';
import {
  generateReportTitle,
  getModeLabel,
  markdownToHtml,
  getReportDetail as getReportDetailApi,
} from '@know-yourself/core';
import { useDb } from '../../contexts/cloudbaseContext';
import { REPORT_UNLOCK_PAYMENT_CONFIG, formatPriceFen } from '../../config/payment';
import './index.scss';

/** 小程序用 Image + data URI；不要用 HTML 的 <img> */
const INNER_BOOK_ICON_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABB0lEQVR4AeyS0Q3CMBBDT12GbgMjIIYARgCGQIwA25RpoP44NYouaYQl2g9XskqSs3ly031W/nS28keA7AdSg2qQbYD1z97B92Dmej3NUmG/BoBzV+rDb+zXvH5WBETA7WJ2TYTgVDg77CdoD2W8nuHvENDBhrE9H6y9HRo+COC/eKP/CAFbw/NA+KB8v2Vd8oWALYH/mhEg27QaVINsA6xfd1ANsg2wft3BlTTIYpT9+sTlbtpO1GBbT+Wp2Qb73ux0nnR/mEHY2+7MoFI84/XMENCDAXIc4TYjpMuNWAMOwhzeOGO88OcKAR0qH66tAQhQxhvlh4DR4FJ7AmSbV4NqkG2A9X8BAAD//5ftfh4AAAAGSURBVAMA9wUTwFGTBLkAAAAASUVORK5CYII=';
const QUOTE_ICON_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACk0lEQVR4AeyaP2/CQAzFT5FYKAtDmdu53/+jdG5nOrBQpIqhzS+pEZT8OfvIKT2MZA4S+5793jtEK6rvO39U4c4fTsCdGyC4A9wBd86AH4EpDHA8hLB7b4PXU2Bo96SPw7btid6k/mYOAICNt681yFsIx8829jWogOVe//a0/2h7ojfpJYkAAGD1fGjZWFbAyJP3OVbwEGP3K0QXJn1z3UyAAMAqGw1FLhcwlPQF8YM91W7gvpoA2EXxMQA2lyCXOnl/65W9GRwxwIrdnzoVAYBgq1iAHHmN6gNWH+oBZ0YRAFNa1QV48RDC+jmExVKu3G5FEFS37Lh6rPt6CuNfhRneqrqATDW8xu5CEoJsXkJYbtorVbt0P6cMj+oC0r27/SrKW4YXQc6RewmQs3WeHPua4adQHfyU4bsE6SXAeramHB5RrMp3DQ+hnQQAxE1tYLGplKcniyic+b7hme+KACsQww8BAZYSluHBW9ef9Kx9cUWAFWix6oNIv44oll0QZazugoAUoLlZn8FjHHlBgFV9wOYWMerT84kAq/psEsM0edqgJ6sosUfyRIAVKJZp7fCp+bFHsiEAplMBp6jPIUpDQErzsVbTYuQSpSHAyjRDxVqN3DlGxR88KY3x3TwmtDhf9T9WrX1RG9MTOdVxb4Vp6/huHhVKHPZsEfTP1MZGcwT0ENNWaN0y1M3YvQq7jCWVfH+eDlAelxSBZklAykDa2ooPC21RSfnugJLUtMziDrCwVlKNO6AkNS2zuAMsrJVU4w4oSU3LLO4AC2tzrtH25g7QMlZavjugNEW187gDtIyVlu8OKE1R7TwVPxrMEZrfEJCboycw/AhoLVNavjugNEW187gDtIyVlv/vHZAqyA8AAAD//3GD8NkAAAAGSURBVAMAUXAtn9G4v8MAAAAASUVORK5CYII=';
const VIRTUAL_PAYMENT_MIN_SDK_VERSION = '2.19.2';

function ConversionZone() {
  return (
    <View className='rr-conversion'>
      <View className='rr-conversion-btns'>
        <Button className='rr-btn-primary rr-btn-share' openType='share'>
          <Text className='rr-btn-text'>分享报告</Text>
        </Button>
      </View>
      <View className='rr-signature'>
        <View className='rr-signature-line' />
        <Text className='rr-signature-text'>INNER BOOK</Text>
        <View className='rr-signature-line' />
      </View>
    </View>
  );
}

function ReportCard({ modeLabel, subTitle, contentHtml }) {
  return (
    <View className='rr-card'>
      <View className='rr-card-header'>
        <View className='rr-card-brand'>
          <Image className='rr-card-brand-icon' src={INNER_BOOK_ICON_DATA_URI} mode='aspectFit' />
          <Text className='rr-card-brand-text'>INNER BOOK</Text>
        </View>
        <View className='rr-card-badge'>
          <Text className='rr-card-badge-text'>{modeLabel}</Text>
        </View>
      </View>
      <View className='rr-card-quote'>
        <Image className='rr-card-quote-icon' src={QUOTE_ICON_DATA_URI} mode='aspectFit' />
        <Text className='rr-card-quote-title'>{subTitle || ''}</Text>
        <View className='rr-card-quote-line' />
      </View>
      <View className='rr-card-body'>
        <RichText nodes={contentHtml} className='rr-rich' />
      </View>
    </View>
  );
}

function compareVersion(versionA, versionB) {
  const first = String(versionA || '').split('.');
  const second = String(versionB || '').split('.');
  const length = Math.max(first.length, second.length);

  while (first.length < length) first.push('0');
  while (second.length < length) second.push('0');

  for (let index = 0; index < length; index += 1) {
    const current = Number(first[index] || 0);
    const target = Number(second[index] || 0);
    if (current > target) return 1;
    if (current < target) return -1;
  }

  return 0;
}

function canUseVirtualPayment(wxApi) {
  if (!wxApi?.requestVirtualPayment) return false;

  try {
    const sdkVersion = wxApi.getSystemInfoSync?.().SDKVersion;
    if (sdkVersion && compareVersion(sdkVersion, VIRTUAL_PAYMENT_MIN_SDK_VERSION) >= 0) {
      return true;
    }
  } catch {}

  return Boolean(wxApi.canIUse?.('requestVirtualPayment'));
}

function requestVirtualPayment(wxApi, paymentArgs) {
  return new Promise((resolve, reject) => {
    wxApi.requestVirtualPayment({
      ...paymentArgs,
      success: function (res) {
        resolve(res);
      },
      fail: function (error) {
        reject(error);
      },
    });
  });
}

function parseSignData(signData) {
  if (!signData) return {};
  if (typeof signData === 'string') {
    try {
      return JSON.parse(signData);
    } catch {
      return {};
    }
  }
  return signData;
}

function isUserCancelledPayment(error) {
  const message = error?.errMsg || '';
  return error?.errCode === -2 || message.includes('cancel') || message.includes('取消');
}

function loginForPayment() {
  return new Promise((resolve, reject) => {
    Taro.login({
      success: (res) => {
        if (!res?.code) {
          reject(new Error('获取支付登录态失败'));
          return;
        }
        resolve(res.code);
      },
      fail: (error) => reject(new Error(error?.errMsg || '获取支付登录态失败')),
    });
  });
}

export default function ReportResult() {
  const router = useRouter();
  const mode = router?.params?.mode || 'discover-self';
  const reportId = router?.params?.reportId;
  const modeLabel = getModeLabel(mode);
  const db = useDb();
  const {
    getReportDetail,
    subTitle,
    createReportUnlockOrder,
    confirmReportUnlockPayment,
  } = useReport();

  const [displayContent, setDisplayContent] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!db || !getReportDetail || !reportId) {
      if (!reportId) setLoadError('报告 ID 不存在');
      setIsLoadingReport(false);
      return;
    }

    const loadReport = async () => {
      setIsLoadingReport(true);
      setLoadError(null);
      try {
        const detail = await getReportDetail(reportId);
        if (!detail) {
          setLoadError('报告内容不存在');
          return;
        }
        setDisplayContent(detail.content || '');
        if (detail.lock === true) {
          setIsUnlocked(false);
          setShowUnlockDialog(true);
          setShowShare(false);
        } else {
          setIsUnlocked(true);
          setShowUnlockDialog(false);
          setShowShare(true);
        }
      } catch {
        setLoadError('加载报告失败，请稍后重试');
      } finally {
        setIsLoadingReport(false);
      }
    };
    loadReport();
  }, [db, getReportDetail, reportId]);

  useShareAppMessage(() => {
    return {
      title: subTitle || generateReportTitle(mode),
      path: `/pages/report-result/index?mode=${mode}&reportId=${reportId}`,
    };
  });

  const handleUnlockReport = useCallback(async () => {
    if (!reportId || isPaying) return;

    const wxApi = typeof globalThis !== 'undefined' ? globalThis.wx : undefined;
    if (!canUseVirtualPayment(wxApi)) {
      Taro.showToast({ title: '当前微信版本不支持虚拟支付', icon: 'none' });
      return;
    }

    setIsPaying(true);
    try {
      const code = await loginForPayment();
      const order = await createReportUnlockOrder(reportId, code);
      const requestVirtualPaymentPayload = order?.requestVirtualPayment || order || {};
      const signData = {
          offerId: order?.offerId || REPORT_UNLOCK_PAYMENT_CONFIG.offerId,
          buyQuantity: order?.buyQuantity ?? REPORT_UNLOCK_PAYMENT_CONFIG.buyQuantity,
          env: order?.env ?? REPORT_UNLOCK_PAYMENT_CONFIG.env,
          currencyType: order?.currencyType || REPORT_UNLOCK_PAYMENT_CONFIG.currencyType,
          productId: order?.productId || REPORT_UNLOCK_PAYMENT_CONFIG.productId,
          goodsPrice: order?.goodsPrice ?? REPORT_UNLOCK_PAYMENT_CONFIG.goodsPrice,
          outTradeNo: order?.outTradeNo,
          attach: order?.attach || REPORT_UNLOCK_PAYMENT_CONFIG.attach,
        };
      
        /**
         * 对对象进行 KEY 升序 JSON 序列化（用于签名，绝对稳定）
         * @param {object} obj 要序列化的对象
         * @returns {string} 升序排列后的 JSON 字符串
         */
        function stableStringify(obj) {
          // 基础类型直接返回
          if (typeof obj !== 'object' || obj === null) {
            return JSON.stringify(obj);
          }

          // 数组保持顺序
          if (Array.isArray(obj)) {
            return `[${obj.map(item => stableStringify(item)).join(',')}]`;
          }

          // 对象：key 升序排列
          const sortedKeys = Object.keys(obj).sort();
          const parts = sortedKeys.map(key => {
            const value = obj[key];
            // 递归序列化，保证嵌套也稳定
            return `"${key}":${stableStringify(value)}`;
          });

          return `{${parts.join(',')}}`;
        }
        const sortedParams = stableStringify(signData);
      const paymentArgs = {
        signData: sortedParams,
        paySig: order?.paySig,
        signature: order?.signature,
        mode: REPORT_UNLOCK_PAYMENT_CONFIG.mode,
      };


      if (!paymentArgs.signData || !paymentArgs.paySig || !paymentArgs.signature) {
        throw new Error('支付参数不完整');
      }

      const paymentResult = await requestVirtualPayment(wxApi, paymentArgs);
      const parsedSignData = parseSignData(paymentArgs.signData);
      await confirmReportUnlockPayment(reportId, {
        outTradeNo: order?.outTradeNo || parsedSignData?.outTradeNo,
        signData: sortedParams,
        mode: paymentArgs.mode,
        paymentResult,
        productId: order?.productId || parsedSignData?.productId,
      });

      setShowUnlockDialog(false);
      setIsUnlocked(true);
      setShowShare(true);
      Taro.showToast({ title: '支付成功，已解锁', icon: 'success' });

      if (db) {
        const detail = await getReportDetailApi(db, reportId, true);
        if (detail) setDisplayContent(detail.content || '');
      }
    } catch (error) {
      if (isUserCancelledPayment(error)) {
        Taro.showToast({ title: '已取消支付', icon: 'none' });
        return;
      }
      Taro.showToast({ title: error?.message || error?.errMsg || '解锁失败', icon: 'none' });
    } finally {
      setIsPaying(false);
    }
  }, [createReportUnlockOrder, confirmReportUnlockPayment, db, isPaying, reportId]);

  useEffect(() => {
    if (isUnlocked) {
      Taro.showShareMenu({ showShareItems: ['shareAppMessage', 'shareTimeline'] });
    } else {
      Taro.hideShareMenu();
    }
  }, [isUnlocked]);

  const handleHeaderBack = useCallback(() => {
    const pages = Taro.getCurrentPages();
    if (pages.length > 1) {
      Taro.navigateBack();
    } else {
      Taro.reLaunch({ url: '/pages/index/index' });
    }
  }, []);

  if (loadError) {
    return (
      <View className='report-result rr-error-page'>
        <View className='rr-error-header'>
          <View className='rr-error-home' onTouchEnd={() => Taro.reLaunch({ url: '/pages/index/index' })}>
            <Text className='rr-error-home-icon'>🏠</Text>
          </View>
        </View>
        <View className='rr-error-body'>
          <Text className='rr-error-msg'>{loadError}</Text>
          <View className='rr-error-btn-wrap' onTouchEnd={() => Taro.reLaunch({ url: '/pages/index/index' })}>
            <Text className='rr-error-btn-text'>返回首页</Text>
          </View>
        </View>
      </View>
    );
  }

  if (isLoadingReport || !displayContent) {
    return (
      <View className='report-result rr-loading-page'>
        <Text className='rr-loading-text'>加载中...</Text>
      </View>
    );
  }

  const contentHtml = markdownToHtml(displayContent);

  return (
    <View className='report-result'>
      <View className='rr-blob rr-blob-1' />
      <View className='rr-blob rr-blob-2' />
      <View className='rr-blob rr-blob-3' />

      <View className='rr-header'>
        <View className='rr-header-back' onTouchEnd={handleHeaderBack}>
          <Text className='rr-header-back-icon'>←</Text>
        </View>
        <Text className='rr-header-title'>{generateReportTitle(mode)}</Text>
        <View className='rr-header-placeholder' />
      </View>

      <ScrollView scrollY className='rr-scroll' enhanced showScrollbar={false}>
        <View className='rr-content-wrap'>
          <ReportCard modeLabel={modeLabel} subTitle={subTitle} contentHtml={contentHtml} />
          {isUnlocked && (
            <View className='rr-history-link-wrap'>
              <Text
                className='rr-history-link'
                onClick={() => Taro.navigateTo({ url: `/pages/chat/index?mode=${mode}&reportId=${reportId}` })}
              >
                查看完整对话过程
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {showShare && (
        <View className='rr-bottom'>
          <ConversionZone />
        </View>
      )}

      {showUnlockDialog && (
        <View className='rr-dialog-mask'>
          <View className='rr-dialog-content'>
            <Text className='rr-dialog-title'>解锁完整报告</Text>
            <Text className='rr-dialog-desc'>{REPORT_UNLOCK_PAYMENT_CONFIG.productName}</Text>
            <Text className='rr-dialog-desc rr-dialog-price'>
              支付 {formatPriceFen(REPORT_UNLOCK_PAYMENT_CONFIG.goodsPrice)} 后可查看完整报告与完整对话
            </Text>
            <View className='rr-invite-btns'>
              <View className='rr-invite-cancel' onTouchEnd={() => setShowUnlockDialog(false)}>
                <Text>稍后再看</Text>
              </View>
              <View
                className={`rr-invite-confirm ${isPaying ? 'rr-invite-disabled' : ''}`}
                onTouchEnd={handleUnlockReport}
              >
                <Text>{isPaying ? '支付中...' : '立即解锁'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
