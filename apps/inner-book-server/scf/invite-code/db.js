const cloudbase = require('@cloudbase/node-sdk');

const app = cloudbase.init({
  env: "inner-book-0gdweqyu8ab70e46"
});

const db = app.database();
const rdb = app.rdb();

module.exports = {
  db,
  rdb,
  _: db.command,
  $: db.command.aggregate,
};
