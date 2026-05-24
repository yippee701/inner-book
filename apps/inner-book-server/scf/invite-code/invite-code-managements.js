const { db } = require('./db');

async function verifyInviteCode(inviteCode) {
  const { data, error } = await db
    .collection("invite_code")
    .where({
      inviteCode: inviteCode
    })
    .field({
      isUsed: true
    })
    .get();

  if (error) {
    console.error('校验邀请码错误:', error);
    return {
      retcode: -7,
      message: `校验邀请码错误:${error}`
    };
  }

  console.log('校验邀请码结果:', data)
  if (data.length === 0) {
    return {
      retcode: -9,
      message: `邀请码不存在`
    };
  }

  if (data[0].isUsed === true) {
    return {
      retcode: -8,
      message: `邀请码已被使用`
    };
  }

  if (data[0].isUsed === false) {
    return {
      retcode: 0,
      message: 'success'
    };
  }

  return {
    retcode: 0,
    message: 'success'
  };
}

async function consumeInviteCode(inviteCode, reportId) {
  const verifyRes = await verifyInviteCode(inviteCode);
  if (verifyRes.retcode !== 0) return verifyRes;

  const { error } = await db
    .collection("invite_code")
    .where({
      inviteCode: inviteCode
    })
    .update({
      isUsed: true,
      reportId: reportId
    });

  console.log('更新结果:', error ? '失败' : '成功');

  if (error) return { retcode: -1, message: "邀请码错误" };

  // 成功则解锁报告
  // TODO: 判断报告是否存在，如果报告不存在还要回滚邀请码的使用情况
  const { data, errorReport } = await db
    .collection('report')
    .where({
      reportId: reportId
    })
    .update({ 
      lock: false, 
      inviteCode 
    });

  console.log('报告解锁结果:', errorReport ? errorReport : '成功');

  if (errorReport) return { retcode: -2, message: "解锁报告错误" };
  return { retcode: 0, message: "报告解锁成功" }
}

module.exports = {
  consumeInviteCode,
};
