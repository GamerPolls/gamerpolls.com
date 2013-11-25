var nconf = require('nconf');
var passport = require('passport');
var strategies = {
	twitchtv: require('passport-twitchtv').Strategy
};
var Account = require('../../app/models/account');

module.exports = function () {
	passport.use('auth-twitchtv', new strategies.twitchtv(
		{
			clientID: nconf.get('authkeys:twitchtv:clientID'),
			clientSecret: nconf.get('authkeys:twitchtv:clientSecret'),
			callbackURL: nconf.get('authkeys:twitchtv:callbackURL'),
			scope: ['user_read', 'user_subscriptions'],
			passReqToCallback: true
		},
		function (request, accessToken, refreshToken, profile, done) {
			var authData = {
				'auths.twitchtv.id': profile.id
			};
			if (!request.session.userdata) {
				request.session.userdata = {};
			}
			request.session.userdata.twitchtv = {
				accessToken: accessToken,
				displayName: profile._json.display_name,
				email: profile._json.email,
				logo: profile._json.logo,
				refreshToken: refreshToken,
				username: profile.username
			};

			if (request.user) {
				return done(null, request.user);
			}
			Account.findOne(authData, function (err, account) {
				if (account) {
					return done(err, account);
				}
				account = new Account(authData);
				account.save(function () {
					return done(err, account);
				});
			});
		}
	));

	passport.serializeUser(function (account, done) {
		done(null, account._id);
	});

	passport.deserializeUser(function (id, done) {
		Account.findById(id, function (err, account) {
			done(err, account);
		});
	});
};
