var locomotive = require('locomotive');
var Controller = locomotive.Controller;
var PagesController = new Controller();

PagesController.main = simpleRender;
PagesController.privacy = simpleRender;

function simpleRender() {
	this.render();
}

module.exports = PagesController;
