var colors = require('colors');
var ErrorHandler = {};

ErrorHandler.logErrors = function (err, req, res, next) {
	console.error('[500 Error]'.red);
	console.error(err.stack.red);
	next(err);
};

ErrorHandler.handleAll = function (err, req, res, next) {
	res.status(500);
	res.render('_errors/500');
};

ErrorHandler.notFound = function (req, res){
	console.error('[404 Not Found]: '.yellow + req.url);
	res.status(404);
	res.render('_errors/404', { url: req.url });
};

module.exports = ErrorHandler;
