var utils = {};

utils.getIp = function (request) {
	return request.headers['x-forwarded-for'] || request.connection.remoteAddress;
};

module.exports = utils;
