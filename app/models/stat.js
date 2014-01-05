var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var StatSchema = new Schema({
	accounts: {
		type: Number,
		default: 0
	},
	poll: {
		anonymous: {
			type: Number,
			default: 0
		},
		loggedIn: {
			type: Number,
			default: 0
		},
		multipleChoice: {
			type: Number,
			default: 0
		},
		allowSameIP: {
			type: Number,
			default: 0
		},
		mustFollow: {
			type: Number,
			default: 0
		},
		mustSub: {
			type: Number,
			default: 0
		},
		isVersus: {
			type: Number,
			default: 0
		},
	},
	totalVotes: {	
		type: Number,
		default: 0
	},
	date: {
		type: Date,
		unique: true,
		default: function () {
			return moment.utc().startOf('day');
		},
		get: function (time) {
			return moment.utc(time).startOf('day');
		}
	}
});

StatSchema.virtual('totalPolls').get(function () {
	return this.anonymous + this.loggedIn;
});

module.exports = mongoose.model('Stat', StatSchema);
