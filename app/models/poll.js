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

PollSchema.plugin(require('mongoose-auto-increment').plugin, 'Poll');

module.exports = mongoose.model('Poll', PollSchema);
