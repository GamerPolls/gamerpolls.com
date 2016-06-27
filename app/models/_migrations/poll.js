module.exports = {
	1: function () {
		this.answers.forEach(function (val, idx, arr) {
			arr[idx] = {
				text: String(val),
				votes: this.votes[idx]
			};
		}, this);
	},
	2: function () {
		var self = this;
		self = JSON.parse(JSON.stringify(self));

		if (self.multipleChoice) {
			this.maxChoices = this.answers.length;
		}
		else {
			this.maxChoices = 1;
		}
		this.minChoices = 1;
		delete this.multipleChoice;
	}
};
