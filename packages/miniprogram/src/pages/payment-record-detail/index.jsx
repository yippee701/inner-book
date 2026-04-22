import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { usePaymentRecordDetailPage } from '../../hooks/usePaymentRecordDetailPage';
import {
  formatPaymentAmount,
  formatPaymentTime,
} from '../../services/paymentRecords';
import './index.scss';

function DetailRow({ label, value, valueClassName = '' }) {
  return (
    <View className='payment-detail-row'>
      <Text className='payment-detail-label'>{label}</Text>
      <Text className={`payment-detail-value ${valueClassName}`}>{value || '-'}</Text>
    </View>
  );
}

export default function PaymentRecordDetailPage() {
  const router = useRouter();
  const {
    record,
    reportSummary,
    isLoading,
    error,
    loadDetail,
    handleBack,
    handleViewReport,
  } = usePaymentRecordDetailPage(router?.params);

  return (
    <View className='payment-detail-page'>
      <View className='payment-detail-blob payment-detail-blob-1' />
      <View className='payment-detail-blob payment-detail-blob-2' />

      <View className='payment-detail-header'>
        <View className='payment-detail-back' onClick={handleBack}>
          <Text className='payment-detail-back-icon'>←</Text>
        </View>
        <Text className='payment-detail-title'>支付详情</Text>
        <View className='payment-detail-placeholder' />
      </View>

      <ScrollView scrollY className='payment-detail-scroll' enhanced showScrollbar={false}>
        <View className='payment-detail-content'>
          {isLoading ? (
            <View className='payment-detail-empty'>
              <Text className='payment-detail-empty-text'>加载中...</Text>
            </View>
          ) : error ? (
            <View className='payment-detail-empty'>
              <Text className='payment-detail-empty-text'>{error}</Text>
              <View className='payment-detail-retry' onClick={loadDetail}>
                <Text className='payment-detail-retry-text'>重新加载</Text>
              </View>
            </View>
          ) : !record ? (
            <View className='payment-detail-empty'>
              <Text className='payment-detail-empty-text'>支付记录不存在</Text>
            </View>
          ) : (
            <>
              <View className='payment-detail-card'>
                <DetailRow label='订单号' value={record.outTradeNo} valueClassName='payment-detail-order' />
                <DetailRow label='支付状态' value={record.payStatusLabel} valueClassName={`status-${record.payStatus}`} />
                <DetailRow label='时间' value={formatPaymentTime(record.createTime)} />

                <View className='payment-detail-row payment-detail-row-report'>
                  <Text className='payment-detail-label'>报告标题</Text>
                  {reportSummary?.reportId ? (
                    <Text className='payment-detail-link' onClick={handleViewReport}>
                      {reportSummary.title || '查看报告'}
                    </Text>
                  ) : (
                    <Text className='payment-detail-value'>-</Text>
                  )}
                </View>

                <View className='payment-detail-group'>
                  <Text className='payment-detail-group-title'>微信支付信息</Text>
                  <DetailRow label='商户单号' value={record.weChatPayInfo?.mchOrderNo} />
                  <DetailRow label='支付时间' value={formatPaymentTime(record.weChatPayInfo?.paidTime)} />
                  <DetailRow label='交易单号' value={record.weChatPayInfo?.transactionId} />
                </View>

                <View className='payment-detail-group'>
                  <Text className='payment-detail-group-title'>购买内容</Text>
                  <DetailRow label='道具名称' value={record.productName} />
                  <DetailRow label='道具 ID' value={record.productId} />
                </View>

                <DetailRow label='支付金额' value={`${formatPaymentAmount(record.price)} 元`} />
              </View>

              {reportSummary?.reportId && (
                <View className='payment-detail-footer'>
                  <View className='payment-detail-primary-btn' onClick={handleViewReport}>
                    <Text className='payment-detail-primary-btn-text'>查看对应报告</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
