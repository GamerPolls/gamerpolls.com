var nconf = require('nconf');
var autoIncrement = require('mongoose-auto-increment');

module.exports = function(){
	this.mongoose = require('mongoose');
	this.mongoose.connect(nconf.get('MONGO_DB'));
	autoIncrement.initialize(this.mongoose.connection);
};
