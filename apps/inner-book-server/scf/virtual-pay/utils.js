// 生成唯一订单号（时间戳+随机6位，避免重复）
function createOutTradeNo() {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 900000 + 100000).toString()
  return `VP${timestamp}${random}` // VP=Virtual Payment 标识
}

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
// 生成32位随机串（签名用）
function createNonceStr() {
  return Math.random().toString(36).substr(2, 32)
}

// 生成Signature 用户态签名（微信虚拟支付签名规则：HMAC-SHA256）
function generateSignature(params, key) {
  // 2. 拼接AppKey，进行HMAC-SHA256加密，转十六进制
  if (!key) {
    throw Error('签名生成失败，缺少 key')
  }
  return crypto
    .createHmac('sha256', key)
    .update(params, 'utf8')
    .digest('hex')
    .toLowerCase() // 微信要求小写
}

// 生成paySig签名（微信虚拟支付签名规则：HMAC-SHA256）
function generatePaySig(sortedParams, appKey) {
  return generateSignature('requestVirtualPayment' + '&' + sortedParams, appKey)
}

// 生成Signature 用户态签名（微信虚拟支付签名规则：HMAC-SHA256）
function generateUserSignature(sortedParams, sessionKey) {
  return generateSignature(sortedParams, sessionKey)
}

module.exports = {
  createOutTradeNo,
  stableStringify,
  generatePaySig,
  generateUserSignature,
  createNonceStr,
};