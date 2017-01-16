var moment = require('moment');

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
	},
	3: function () {
		var self = this;
		self = JSON.parse(JSON.stringify(self));

		var closeTime = moment(self.closeTime);
		var created = moment(self.created);

		var diff = closeTime.diff(created, 'days');

		// If Difference is over 7 days
		if (diff > 7) {
			// If Difference is over 4 weeks
			if ((diff / 7) > 4) {
				// If Difference is over 3 months
				if (((diff / 7) / 30) > 3) {
					this.closeNum = 3;
					this.closeType = "months";
				}
				else {
					// Difference is not over 3 months
					this.closeNum = Math.ceil(((diff / 7) / 30));
					this.closeType = "months";
				}
			}
			else {
				// Difference is not over 4 weeks
				this.closeNum = Math.ceil(diff / 7);
				this.closeType = "weeks";
			}
		}
		else {
			// If Difference < 1 days
			if (diff < 1) {
				this.closeNum = Math.ceil(diff * 24);
				this.closeType = "hours";
			}
			else {
				// Difference is not over 7 days
				this.closeNum = Math.ceil(diff);
				this.closeType = "days";
			}
		}
		if (moment().isAfter(closeTime)) {
			// Poll is supposed to be closed
			this.isClosed = true;
		}
		else {
			// Poll is still open
			this.isClosed = false;
		}
		delete this.closeTime;
	}
};
