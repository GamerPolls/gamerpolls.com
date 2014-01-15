var utils = {};

utils.getIp = function (request) {
	return request.headers['x-forwarded-for'] || request.connection.remoteAddress;
};

utils.getPackage = function () {
	return require('../../package.json');
};

module.exports = utils;
