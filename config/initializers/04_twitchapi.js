var twitch = require('node-twitch-api');
var nconf = require('nconf');

module.exports = function () {
	twitch.defaults.clientID = nconf.get('authkeys:twitchtv:clientID');
	this.twitch = twitch;
};
