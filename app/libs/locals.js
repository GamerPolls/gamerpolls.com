var utils = require('./utils');
var pkg = utils.getPackage();
/**
 * Expose global data to views.
 */
module.exports = function (request, response, next) {
	// Data available to all clients, e.g. application settings.
	this.locals.pkg = {
		version: pkg.version
	};

	// Client-specific data, e.g. user info

	// Expose only certain values.
	request.session.isBetaTester = false;
	if (request.user) {
		response.locals.user = {};
		[
			'avatar',
			'displayName',
			'email',
			'username'
		].forEach(function (key) {
			response.locals.user[key] = request.user[key];
		});

		response.locals.user.hasSubButton = request.session.twitchtv.hasSubButton;
		response.locals.user.isBetaTester = this.nconf.get('betaTesters').split(',').indexOf(request.user.username) >= 0;
		request.session.isBetaTester = response.locals.user.isBetaTester;
	}

	var types = request.flash();
	var messages = [];
	for (var type in types) {
		if (types.hasOwnProperty(type)) {
			types[type].forEach(pushMessages);
		}
	}
	function pushMessages(message) {
		messages.push({
			text: message,
			type: type
		});
	}
	response.locals.flash = messages;

	response.locals.loggedIn = request.isAuthenticated();

	// Pass to next middleware.
	next();
};
