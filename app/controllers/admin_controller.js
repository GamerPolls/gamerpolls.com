var locomotive = require('locomotive');
var Controller = locomotive.Controller;
var AdminController = new Controller();
var login = require('connect-ensure-login');
var moment = require('moment');
var extend = require('jquery-extend');
var colors = require('colors');
var utils = require('../libs/utils');

AdminController.show = function () {
    this.render();
};

AdminController.process = function () {

    this.__app.locals.maintenanceMode = Boolean(this.param('maintenanceMode'));
    this.__app.locals.disablePolls = Boolean(this.param('disablePolls'));
    this.__app.locals.disableVoting = Boolean(this.param('disableVoting'));
    this.__app.locals.disableLogin = Boolean(this.param('disableLogin'));

    this.request.flash('success', 'Admin variables saved.');
    return this.redirect(this.urlFor({
        action: 'show'
    }));
};

AdminController.before('*', function (next) {
    var self = this;
    if (!this.request.session.isAdmin) {
        this.request.flash('danger', 'Sorry, you need to be an administrator to use this feature!');
        return this.redirect('/');
    }

    return next();
});

module.exports = AdminController;
