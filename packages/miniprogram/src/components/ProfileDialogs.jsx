import { View, Text, Input } from '@tarojs/components';

/**
 * 昵称编辑弹窗（纯展示，状态与提交由 useProfilePage 提供）
 */
export function NicknameEditDialog({
  visible,
  value,
  onInput,
  onConfirm,
  onCancel,
  loading,
}) {
  if (!visible) return null;
  return (
    <View className='profile-dialog-mask' onClick={onCancel}>
      <View className='profile-dialog-content' onClick={(e) => e.stopPropagation()}>
        <Text className='profile-dialog-title'>修改昵称</Text>
        <Input
          type='nickname'
          className='profile-dialog-input'
          placeholder='请输入昵称'
          value={value}
          onInput={(e) => onInput(e.detail.value)}
        />
        <View className='profile-dialog-btns'>
          <View className='btn-secondary profile-dialog-btn' onClick={onCancel}>
            <Text>取消</Text>
          </View>
          <View
            className={`btn-primary profile-dialog-btn ${loading ? 'btn-disabled' : ''}`}
            onClick={onConfirm}
          >
            <Text>{loading ? '提交中...' : '确定'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
