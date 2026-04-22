import { View, Text, ScrollView } from '@tarojs/components';
import { usePaymentRecordsPage } from '../../hooks/usePaymentRecordsPage';
import { formatPaymentTime } from '../../services/paymentRecords';
import './index.scss';

function PaymentRecordCard({ record, onDetail }) {
  return (
    <View className='payment-record-card'>
      <View className='payment-record-row'>
        <Text className='payment-record-label'>订单号</Text>
        <Text className='payment-record-value payment-record-order'>{record.outTradeNo || '-'}</Text>
      </View>
      <View className='payment-record-row'>
        <Text className='payment-record-label'>支付状态</Text>
        <Text className={`payment-record-status status-${record.payStatus}`}>{record.payStatusLabel}</Text>
      </View>
      <View className='payment-record-row'>
        <Text className='payment-record-label'>时间</Text>
        <Text className='payment-record-value'>{formatPaymentTime(record.createTime)}</Text>
      </View>
      <View className='payment-record-actions'>
        <Text className='payment-record-detail' onClick={() => onDetail(record.outTradeNo)}>详情</Text>
      </View>
    </View>
  );
}

export default function PaymentRecordsPage() {
  const { records, isLoading, error, loadRecords, handleBack, handleViewDetail } = usePaymentRecordsPage();

  return (
    <View className='payment-records-page'>
      <View className='payment-records-blob payment-records-blob-1' />
      <View className='payment-records-blob payment-records-blob-2' />

      <View className='payment-records-header'>
        <View className='payment-records-back' onClick={handleBack}>
          <Text className='payment-records-back-icon'>←</Text>
        </View>
        <Text className='payment-records-title'>支付记录</Text>
        <View className='payment-records-placeholder' />
      </View>

      <ScrollView scrollY className='payment-records-scroll' enhanced showScrollbar={false}>
        <View className='payment-records-content'>
          {isLoading ? (
            <View className='payment-records-empty'>
              <Text className='payment-records-empty-text'>加载中...</Text>
            </View>
          ) : error ? (
            <View className='payment-records-empty'>
              <Text className='payment-records-empty-text'>{error}</Text>
              <View className='payment-records-retry' onClick={loadRecords}>
                <Text className='payment-records-retry-text'>重新加载</Text>
              </View>
            </View>
          ) : records.length === 0 ? (
            <View className='payment-records-empty'>
              <Text className='payment-records-empty-text'>暂无支付记录</Text>
            </View>
          ) : (
            <View className='payment-record-list'>
              {records.map((record) => (
                <PaymentRecordCard
                  key={record.outTradeNo || record._id}
                  record={record}
                  onDetail={handleViewDetail}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
