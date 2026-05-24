exports.main = async (event, context) => {
  const userRepository = require('./user-repository');

  const { action } = event;

  switch (action) {
    case 'registUser':
      return await userRepository.registUser(event);

    case 'updateUsername':
      return await userRepository.updateUsername(event);

    default:
      return {
        retcode: -1,
        message: '未知的操作类型',
      };
  }
};
