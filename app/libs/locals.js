/**
 * Expose global data to views.
 */
module.exports = function (request, response, next) {
	// Data available to all clients, e.g. application settings.
	// this.locals.foo = 'bar';

	// Client-specific data, e.g. user info
	response.locals.user = request.user;
	response.locals.loggedIn = request.isAuthenticated();

	// Pass to next middleware.
	next();
}
