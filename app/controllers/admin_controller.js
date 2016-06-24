var locomotive = require('locomotive');
var Controller = locomotive.Controller;
var AdminController = new Controller();
var login = require('connect-ensure-login');
var moment = require('moment');
var extend = require('jquery-extend');
var colors = require('colors');
var utils = require('../libs/utils');

AdminController.show = function(){
    if (!this.request.session.isAdmin) {
        console.log('User is not an administrator.'.red);
        this.request.flash('danger', 'Sorry, you need to be an administrator to use this feature!');
        return this.redirect('/');
    }
    console.log(this);

    this.render();
};

AdminController.process = function(){
    var self = this;
    if (!this.request.session.isAdmin) {
        console.log('User is not an administrator.'.red);
        this.request.flash('danger', 'Sorry, you need to be an administrator to use this feature!');
        return this.redirect('/');
    }

    this.__app.locals.maintenanceMode = Boolean(this.param('maintenanceMode'));
    this.__app.locals.disablePolls = Boolean(this.param('disablePolls'));
    this.__app.locals.disableVoting = Boolean(this.param('disableVoting'));
    this.__app.locals.disableLogin = Boolean(this.param('disableLogin'));

    console.log('Admin variables saved.'.green);
    self.request.flash('success', 'Admin variables saved.');
    return this.redirect(this.urlFor({ action: 'show' }));
};

module.exports = AdminController;