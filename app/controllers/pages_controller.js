var locomotive = require('locomotive');
var Controller = locomotive.Controller;
var PagesController = new Controller();

PagesController.main = function() {
	this.title = 'TwitchPolls';
	this.render();
};

module.exports = PagesController;
