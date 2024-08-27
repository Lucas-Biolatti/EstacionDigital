var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
var conexion = require('./db/db');
var methodOverride = require('method-override')
//var upload = require('express-fileupload');
const multer = require('multer');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var SeguridadRouter = require('./routes/Seguridad');
var MantenimientoRouter = require('./routes/Mantenimiento');
var AdminRouter = require('./routes/Admin');
var QsbRouter = require('./routes/Qsb');
const flash = require('connect-flash');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true,
  cookie: {
    maxAge: 3600000 // 1 hora en milisegundos
}
 
}));
app.use(flash());
app.use(methodOverride('_method'));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public/accidentes')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/Seguridad',SeguridadRouter);
app.use('/Mantenimiento',MantenimientoRouter);
app.use('/Admin',AdminRouter);
app.use('/Qsb',QsbRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
