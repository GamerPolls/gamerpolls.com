var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PollSchema = new Schema({
	answers: [{
		id: Schema.Types.ObjectId,
		text: String,
		votes: {
			type: Number,
			default: 0
		}
	}],
	created: {
		type: Date,
		default: Date.now
	},
	multipleChoice: Boolean,
	question: String
});

PollSchema.plugin(require('./_migrations/migration-plugin'), {
	path: 'poll',
	version: 1
});

PollSchema.plugin(require('mongoose-auto-increment').plugin, {
	model: 'Poll',
	startAt: 1
});

module.exports = mongoose.model('Poll', PollSchema);
