/**
 * 小程序端云数据库适配层
 * 将 wx.cloud.database() 的 API 转为与 H5/CloudBase 一致的 (res, data) 回调风格，
 * 便于 ReportContext、core 等逻辑跨端复用。
 *
 * 微信云开发：get/add/update 使用 { success: (res) => {}, fail: (err) => {} }，数据在 res.data
 * H5 CloudBase：get((res, data) => {}) 其中 res===0 表示成功，data 为返回体（含 data 数组）
 */

function wrapQuery(query) {
  return {
    field(...args) {
      return wrapQuery(query.field(...args));
    },
    orderBy(...args) {
      return wrapQuery(query.orderBy(...args));
    },
    get(callback) {
      if (typeof callback !== 'function') return query.get();
      query.get({
        success(res) {
          callback(0, res);
        },
        fail(err) {
          callback(err.errCode ?? err.errMsg ?? -1, { message: err.errMsg || '查询失败' });
        },
      });
    },
    update(data, callback) {
      if (typeof callback !== 'function') return query.update({ data });
      query.update({
        data,
        success(res) {
          callback(0, res);
        },
        fail(err) {
          callback(err.errCode ?? -1, { message: err.errMsg || '更新失败' });
        },
      });
    },
  };
}

/**
 * 包装微信云 database，返回兼容 (res, data) 回调的 db 形态
 * @param {object} rawDb - Taro.cloud.database() 的返回值
 * @returns {object} 兼容的 db，collection().where().get(callback) / .add(data, callback) / .update(data, callback)
 */
export function wrapMpDb(rawDb) {
  if (!rawDb || !rawDb.collection) return rawDb;

  function wrapCollection(collection) {
    return {
      where(condition) {
        return wrapQuery(collection.where(condition));
      },
      add(data, callback) {
        if (typeof callback !== 'function') return collection.add({ data });
        collection.add({
          data,
          success(res) {
            callback(0, res);
          },
          fail(err) {
            callback(err.errCode ?? -1, { message: err.errMsg || '新增失败' });
          },
        });
      },
    };
  }

  return {
    collection(name) {
      return wrapCollection(rawDb.collection(name));
    },
  };
}
