var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var chatRouter = require('./routes/chat');
var healthRouter = require('./routes/health');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));

// 跨域支持（请求走 inner-book.top 时同源，不设置跨域头）
app.use(function(req, res, next) {
  const host = (req.headers.host || '').split(':')[0];
  const isInnerBookTop = host === 'inner-book.top';

  if (!isInnerBookTop) { // 兼容旧版本，非 inner-book.top 请求时设置跨域头，理论上后续可以去掉
    const allowedOrigins = [
      'http://localhost:5176',
      'https://yippee701.github.io',
      'https://inner-book.top'
    ];
    const origin = req.headers.origin;
    const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (origin && (allowedOrigins.includes(origin) || isLocalDevOrigin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/chat/health', healthRouter);
app.use('/chat', chatRouter);
app.use('/v1/cloudrun/inner-book-server/chat', chatRouter); // 兼容旧版本

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// add default index.html
app.use(express.static(__dirname + "/public", { index: "index.html" }));

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
