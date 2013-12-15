var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var PollSchema = new Schema({
	answers: [{
		id: Schema.Types.ObjectId,
		text: String,
		votes: {
			type: Number,
			default: 0
		}
	}],
	creator: {
		type: Schema.Types.ObjectId,
		ref: 'Account'
	},
	closeTime: {
		type: Date,
		default: function () {
			return moment.utc().add('month', 1);
		},
		get: function (time) {
			return moment.utc(time);
		}
	},
	created: {
		type: Date,
		default: moment.utc,
		get: function (time) {
			return moment.utc(time);
		}
	},
	multipleChoice: Boolean,
	question: String
});

PollSchema.virtual('isClosed').get(function () {
	return moment.utc().isAfter(this.closeTime);
});

PollSchema.methods.isCreator = function (user) {
	if (!this.creator || !user) {
		return false;
	}
	return this.creator.equals(user._id);
};

PollSchema.plugin(require('./_migrations/migration-plugin'), {
	path: 'poll',
	version: 1
});

PollSchema.plugin(require('mongoose-auto-increment').plugin, {
	model: 'Poll',
	startAt: 1
});

module.exports = mongoose.model('Poll', PollSchema);
