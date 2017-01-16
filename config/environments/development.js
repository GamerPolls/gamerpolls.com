var errorHandler = require('errorhandler');

module.exports = function () {
	this.use(errorHandler());
}
