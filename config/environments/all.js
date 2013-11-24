var express = require('express');
var poweredBy = require('connect-powered-by');
var util = require('util');
var passport = require('passport');

module.exports = function() {
  this.datastore(require('locomotive-mongoose'));

  // Template stuff.
  this.set('views', __dirname + '/../../app/views');
  this.set('view engine', 'mustache');
  this.engine('mustache', require('mustache-express')());

  // Middleware.
  this.use(poweredBy(null));
  this.use(express.logger());
  this.use(express.favicon());
  this.use(express.static(__dirname + '/../../public'));
  this.use(express.urlencoded());
  this.use(express.json());
  this.use(express.cookieParser());
  this.use(express.methodOverride());
  this.use(express.session({ secret: 'keyboard cat' }));
  this.use(passport.initialize());
  this.use(passport.session());
  this.use(this.router);
};
