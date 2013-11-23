module.exports = function(){
	this.mongoose = require('mongoose');
	this.mongoose.connect(process.env.MONGO_DB || 'mongodb://localhost/test');
};
