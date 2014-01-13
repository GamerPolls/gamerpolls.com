var autoIncrement = require('mongoose-auto-increment');

module.exports = function(){
	this.mongoose = require('mongoose');
	this.mongoose.connect(this.nconf.get('MONGO_DB'));
	autoIncrement.initialize(this.mongoose.connection);
};
