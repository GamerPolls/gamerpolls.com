var locomotive = require('locomotive');
var Controller = locomotive.Controller;
var AccountController = new Controller();
var Account = require('../models/account');
var login = require('connect-ensure-login');
var passport = require('passport');

AccountController.before('showAccount', login.ensureLoggedIn());
AccountController.showAccount = function () {
	var userdata = this.request.session.userdata.twitchtv.profile._json;
	this.displayName = userdata.display_name;
	this.avatar = userdata.logo;
	this.render();
};

AccountController.loginForm = function () {
	this.render();
};

AccountController.login = function () {
	var authStrategy = 'auth-' + this.param('authStrategy');
	if (!passport._strategies.hasOwnProperty(authStrategy)) {
		console.log('Couldn\'t find strategy: ' + authStrategy);
		return this.redirect(this.loginFormPath());
	}
	passport.authenticate(
		authStrategy,
		{
			successRedirect: this.urlFor({action: 'showAccount'}),
			failureRedirect: this.urlFor({action: 'login'})
		}
	)(this.request, this.response, this.__next);
};

AccountController.logout = function () {
	this.request.logout();
	this.redirect('/');
};

module.exports = AccountController;
