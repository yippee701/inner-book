exports.main = async (event, context) => {
  const { consumeInviteCode } = require('./invite-code-management');

  const { action, inviteCode, reportId } = event;

  switch (action) {
    case 'consume':
      return await consumeInviteCode(inviteCode, reportId);
    default:
      throw new Error('未知的操作类型');
  }
};
