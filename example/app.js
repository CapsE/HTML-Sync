var express = require('express');
var path = require('path');
var logger = require('morgan');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');

var routes = require('./routes/index')(express);
var app = express();
app.set('port', process.env.PORT || 3000);

var http = require('http').createServer(app);

http.listen(process.env.PORT || 3000, function(){
  console.log("listening on " + (process.env.PORT || 3000));
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log("Error 404");
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var io = require('socket.io')(http);
var HTMLSync = require('html-sync');
var hs = new HTMLSync(io, {debug:true});

io.on('connection', function(socket){
  console.log('a user connected');

  HTMLSync.setSocket(socket);
});

module.exports = app;
