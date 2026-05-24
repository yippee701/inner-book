var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  res.json({ retcode: 0, retmessage: "Hi, I'm Dora" });
});

module.exports = router;
