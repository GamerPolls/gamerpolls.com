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
			request.session.twitchtv = {
				accessToken: accessToken,
				refreshToken: refreshToken
			};

			Account.findOne({ 'auths.twitchtv.id': profile.id }, function (err, account) {
				if (!account) {
					account = new Account();
				}

				account.auths.twitchtv.id = profile.id;
				account.displayName = profile._json.display_name;
				account.email = profile._json.email;
				account.avatar = profile._json.logo;
				account.username = profile.username;

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
