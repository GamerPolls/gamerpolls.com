var twitch = require('node-twitch-api');

module.exports = function () {
	twitch.defaults.clientID = this.nconf.get('authkeys:twitchtv:clientID');
	this.twitch = twitch;
};
