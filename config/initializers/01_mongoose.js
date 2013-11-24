var nconf = require('nconf');
module.exports = function(){
	console.log(nconf.get());
	this.mongoose = require('mongoose');
	this.mongoose.connect(nconf.get('MONGO_DB'));
};
