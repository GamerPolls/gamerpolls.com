module.exports = {
	1: function () {
		this.answers.forEach(function (val, idx, arr) {
			arr[idx] = {
				text: String(val),
				votes: this.votes[idx]
			};
		}, this);
	},
}
