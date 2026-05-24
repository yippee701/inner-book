const { db } = require('./db');

async function registUser(data) {
  console.log(data.userid)
  try {
    const collection = db.collection('mp_users');
    const queryRes = await collection.where({
      open_id: data.userid,
    }).limit(1).get();
    const user = (queryRes.data || [])[0];

    if (user) {
      return {
        retcode: 0,
        res: {
          created: false,
          user,
        },
      };
    }

    const res = await collection.add({
      nick_name: data.username || '微信用户',
      open_id: data.userid,
      uuid: data.userid,
    });

    if (res.code) {
      return {
        retcode: -1,
        message: JSON.stringify(res.message || res.msg || '注册失败'),
      };
    }

    return {
      retcode: 0,
      res: {
        ...res,
        created: true,
      },
    };
  } catch (error) {
    return {
      retcode: -1,
      message: JSON.stringify(error.message || '注册失败'),
    };
  }
}

async function updateUsername(data) {
  console.log(data.userid)
  try {
    const collection = db.collection('mp_users');
    const queryRes = await collection.where({
      open_id: data.userid,
    }).limit(1).get();
    const user = (queryRes.data || [])[0];

    let res;

    if (user && user._id) {
      res = await collection.doc(user._id).update({
        nick_name: data.username,
        open_id: data.userid,
        uuid: data.userid,
      });
    } else {
      res = await collection.add({
        nick_name: data.username,
        open_id: data.userid,
        uuid: data.userid,
      });
    }

    if (res.code) {
      return {
        retcode: -1,
        message: JSON.stringify(res.message || res.msg || '更新失败'),
      };
    }

    return {
      retcode: 0,
      res,
    };
  } catch (error) {
    return {
      retcode: -1,
      message: JSON.stringify(error.message || '更新失败'),
    };
  }
}

module.exports = {
  registUser,
  updateUsername,
};
