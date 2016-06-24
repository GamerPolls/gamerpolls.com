var express = require('express');
var locomotive = require('locomotive');
var app = new locomotive.Application();
var bootable = require('bootable');
var bootableEnvironment = require('bootable-environment');
var socketio = require('socket.io');
var http = require('http');
var colors = require('colors');
var nconf = require('nconf');
var hookshot = require('hookshot');

// Config.
nconf.file({
    file: 'default-env.json'
});
nconf.file({
    file: 'env.json'
});
nconf.argv();
nconf.env();

// Webhook Listener.
if (Boolean(nconf.get('listenForWebhook'))) {
    hookshot('refs/heads/master', nconf.get('githubUpdateCommand')).listen(Number(nconf.get('webhookPort')));
}
// Controllers.
app.phase(locomotive.boot.controllers(__dirname + '/app/controllers'));
// Views.
app.phase(locomotive.boot.views());
// Environments.
app.phase(bootableEnvironment(__dirname + '/config/environments'));
// Initializers.
app.phase(bootable.initializers(__dirname + '/config/initializers'));
// Routes.
app.phase(locomotive.boot.routes(__dirname + '/config/routes'));

// HTTP server.
app.phase(function (done) {
    var self = this;
    console.log('Starting HTTP server.');
    this.httpServer = http.createServer(this.express).listen(
        Number(nconf.get('httpServerPort')),
        function () {
            console.log('HTTP server listening on ' + self.httpServer.address().address + ':' + self.httpServer.address().port);
            console.log('Started HTTP server.'.green);
            done();
        }
    );
});

// socket.io
app.phase(function () {
    console.log('Starting socket.io.');

    this.io = socketio.listen(this.httpServer);
    this.io.set('log level', 1);

    console.log('Started socket.io.'.green);
});

// Boot the application.
app.boot(function (err) {
    if (err) {
        console.error(err.message);
        console.error(err.stack);
        return process.exit(-1);
    }
    console.log('App started!'.green);
    console.log('Current beta testers:'.cyan);
    console.log(nconf.get('betaTesters').split(',').sort());
});
