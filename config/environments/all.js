var express = require('express');
var poweredBy = require('connect-powered-by');
var utils = require('../../app/libs/utils');
var passport = require('passport');
var fs = require('fs');
var path = require('path');
var MongoStore = require('connect-mongo')(express);
var nconf = require('nconf');
var flash = require('connect-flash');
var errorHandler = require('../../app/libs/error-handler');
var nowww = require('connect-no-www');

module.exports = function() {
	this.datastore(require('locomotive-mongoose'));

	// Template stuff.
	this.set('views', __dirname + '/../../app/views');
	this.set('view engine', 'html');
	this.engine('html', require('hogan-express'));
	this.format('html', { extension: '.html' });

	var partials = {};
	var layout = fs.readdirSync(__dirname + '/../../app/views/_layout');

	layout.forEach(function (filename) {
		filename = path.basename(filename, '.html');
		partials['layout/' + filename] = '_layout/' + filename;
	});

	this.set('layout', 'layout');
	this.set('partials', partials);

	// Middleware.
	this.use(nowww());
	this.use(poweredBy(null));
	this.use(express.favicon());
	this.use('/js', express.static(__dirname + '/../../node_modules/moment/min'));
	this.use(express.static(__dirname + '/../../public'));
	express.logger.token('remote-addr', function (request, response) {
		return utils.getIp(request);
	});
	this.use(express.logger());
	this.use(express.urlencoded());
	this.use(express.json());
	this.use(express.cookieParser());
	this.use(express.methodOverride());
	this.use(express.session({
		secret: 'secret',
		store: new MongoStore({
			url: nconf.get('MONGO_DB')
		})
	}));
	this.use(passport.initialize());
	this.use(passport.session());
	this.use(flash());
	this.use(require(__dirname + '/../../app/libs/locals').bind(this));
	this.use(this.router);
	this.use(errorHandler.notFound);
	this.use(errorHandler.logErrors);
	this.use(errorHandler.handleAll);
};
