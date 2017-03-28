var twitch = require('node-twitch-api');
var nconf = require('nconf');

module.exports = function () {
	twitch.defaults.clientID = nconf.get('authkeys:twitchtv:clientID');
	twitch.defaults.apiVersion = nconf.get('authkeys:twitchtv:apiVersion');
	this.twitch = twitch;
};
