module.exports = {
	1: function () {
		this.answers.forEach(function (val, idx, arr) {
			arr[idx] = {
				text: String(val),
				votes: this.votes[idx]
			};
		}, this);
	},
	2: function() {
		this.minChoices = 1;
		if(this.multipleChoice){
			this.maxChoices = this.answers.length;
		} else {
			this.maxChoices = 1;
		}
		delete this.multipleChoice;
	}
}
