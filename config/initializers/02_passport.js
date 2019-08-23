var nconf = require('nconf');
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var request = require('request');
var Account = require('../../app/models/account');

module.exports = function () {
	var self = this;
	OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
	  var options = {
	    url: 'https://api.twitch.tv/helix/users',
	    method: 'GET',
	    headers: {
	      'Client-ID': nconf.get('authkeys:twitchtv:clientID'),
	      'Accept': 'application/vnd.twitchtv.v5+json',
	      'Authorization': 'Bearer ' + accessToken
	    }
	  };

	  request(options, function (error, response, body) {
	    if (response && response.statusCode == 200) {
	      done(null, JSON.parse(body));
	    } else {
	      done(JSON.parse(body));
	    }
	  });
	}
	passport.use('auth-twitchtv', new OAuth2Strategy({
			clientID: nconf.get('authkeys:twitchtv:clientID'),
			clientSecret: nconf.get('authkeys:twitchtv:clientSecret'),
			callbackURL: nconf.get('authkeys:twitchtv:callbackURL'),
			scope: ['user:read:email', 'user_subscriptions'],
			authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
			tokenURL: 'https://id.twitch.tv/oauth2/token',
			passReqToCallback: true
		},
		function (request, accessToken, refreshToken, user, done) {
			request.session.twitchtv = {
				accessToken: accessToken,
				refreshToken: refreshToken
			};

			var profile = user.data[0];

			Account.findOne({
				'auths.twitchtv.id': profile.id
			}, function (err, account) {
				if (err) {
					return done(err);
				}
				if (!account) {
					account = new Account();
				}

				account.auths.twitchtv.id = profile.id;
				account.displayName = profile.display_name;
				account.email = profile.email;
				account.avatar = profile.profile_image_url;
				account.username = profile.login;

				if (profile.broadcaster_type !== '') {
					request.session.twitchtv.hasSubButton = true;
				}

				account.save(function () {
					request.flash('info', 'Welcome ' + account.displayName + '!');
					return done(null, account);
				});
			})
		}
	));

	passport.serializeUser(function (account, done) {
		done(null, account._id);
	});

	passport.deserializeUser(function (id, done) {
		Account.findById(id, function (err, account) {
			if (err) {
				return done(err);
			}
			return done(null, account);
		});
	});
};
