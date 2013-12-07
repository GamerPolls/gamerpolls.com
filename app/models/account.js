var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AccountSchema = new Schema({
	auths: {
		twitchtv: { id: Number }
	},
	email: {
		type: String,
		default: ''
	},
	avatar: {
		type: String,
		default: ''
	},
	username: {
		type: String,
		default: ''
	},
	displayName: {
		type: String,
		default: ''
	}
});

module.exports = mongoose.model('Account', AccountSchema);
