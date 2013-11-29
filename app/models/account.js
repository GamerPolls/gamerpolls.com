var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AccountSchema = new Schema({
	auths: {
		twitchtv: { id: Number }
	}
});

module.exports = mongoose.model('Account', AccountSchema);
