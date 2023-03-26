var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const bcrypt = require("bcrypt");
//const {hash} = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const passport = require('passport');





var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
var predavacRouter = require('./routes/predavac');
var publikaRouter = require('./routes/publika');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');




app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/predavac', predavacRouter);
app.use('/publika', publikaRouter);



var pg = require('pg');
//const initializePredavac = require('./passportConfig');
//initializePredavac(passport);

var config = require('./dbConfig');

var pool = new pg.Pool(config);




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