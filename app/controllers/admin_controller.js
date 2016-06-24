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

    this.render();
};

AdminController.process = function(){
    var self = this;
    if (!this.request.session.isAdmin) {
        console.log('User is not an administrator.'.red);
        this.request.flash('danger', 'Sorry, you need to be an administrator to use this feature!');
        return this.redirect('/');
    }

    var maintenanceMode = Boolean(this.param('maintenanceMode'));
    var disablePolls = Boolean(this.param('disablePolls'));
    var disableVoting = Boolean(this.param('disableVoting'));
    var disableLogin = Boolean(this.param('disableLogin'));
    module.exports = function () {
        var self = this;
        self.locals.maintenanceMode = maintenanceMode;
        self.locals.disablePolls = disablePolls;
        self.locals.disableVoting = disableVoting;
        self.locals.disableLogin = disableLogin;
    };

    console.log('Admin variables saved.'.green);
    self.request.flash('success', 'Admin variables saved.');
    return this.redirect(this.urlFor({ action: 'show' }));
};

module.exports = AdminController;