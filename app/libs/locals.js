/**
 * Expose global data to views.
 */
module.exports = function (request, response, next) {
	// Data available to all clients, e.g. application settings.
	// this.locals.foo = 'bar';

	// Client-specific data, e.g. user info

	// Expose only certain values.
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
	}
	
	response.locals.loggedIn = request.isAuthenticated();

	// Pass to next middleware.
	next();
}
