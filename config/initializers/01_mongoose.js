var nconf = require('nconf');
module.exports = function(){
	this.mongoose = require('mongoose');
	this.mongoose.connect(nconf.get('MONGO_DB'));
};
