var locomotive = require('locomotive');
var Controller = locomotive.Controller;
var PollController = new Controller();
var Poll = require('../models/poll');
var login = require('connect-ensure-login');

PollController.new = function () {
	this.poll = this.request.session._poll;
	delete this.request.session._poll;

	this.render();
};

PollController.create = function () {
	var answers = Array.isArray(this.param('answers')) ? this.param('answers') : [ this.param('answers') ];
	var question = this.param('question');
	var multipleChoice = Boolean(this.param('multipleChoice'));

	answers = answers.map(function (answer) {
		return { text: answer };
	});

	if (answers.length < 2) {
		this.request.session._poll = {
			answers: answers,
			multipleChoice: multipleChoice,
			question: question
		};
		return this.redirect(this.urlFor({ action: 'new' }));
	}

	var self = this;
	var poll = new Poll({
		answers: answers,
		multipleChoice: multipleChoice,
		question: question
	});

	poll.save(function (err, savedPoll) {
		if (err) {
			return self.next();
		}
		self.redirect(self.urlFor({ action: 'showPoll', id: savedPoll._id }));
	});
};

PollController.showPoll = function () {
	if (!this._poll) {
		return this.next();
	}
	this.poll = this._poll;
	this.title = 'Poll: ' + (this.poll.question.length > 25 ? this.poll.question.substr(0, 25).trim() + '...' : this.poll.question);

	this.render();
};

PollController.vote = function () {
	if (!this._poll) {
		return this.next();
	}
	var self = this;
	var answers = Array.isArray(this.param('answers')) ? this.param('answers') : [ this.param('answers') ];
	var voted = false;

	// Filter out duplicates.
	answers = answers.filter(function (val, idx, arr) {
		return arr.indexOf(val) === idx;
	});

	// Add the votes.
	answers.some(function (id) {
		self._poll.answers.some(function (val, idx, arr) {
			if (String(val._id) === id) {
				arr[idx].votes++;
				voted = true;
				return true;
			}
		});

		if (!self._poll.multipleChoice && voted) {
			return true;
		}
	});

	if (!voted) {
		return self.redirect(self.urlFor({ action: 'showPoll', id: this._poll._id }));
	}
	
	this._poll.save(function (err, savedPoll) {
		if (err) {
			return self.next();
		}
		self.redirect(self.urlFor({ action: 'showResults', id: savedPoll._id }));
	});
};

PollController.showResults = function () {
	if (!this._poll) {
		return this.next();
	}
	this.poll = this._poll;
	this.title = 'Results: ' + (this.poll.question.length > 25 ? this.poll.question.substr(0, 25).trim() + '...' : this.poll.question);
	this.render();
};

PollController.before('*', function (next) {
	var self = this;
	var id = Number(this.param('id'));

	if (isNaN(id)) {
		return next();
	}

	Poll.findOne({ _id: id }, function (err, poll) {
		if (err) {
			return next(err);
		}
		if (!poll) {
			return next();
		}
		self._poll = poll;
		next();
	});
});

module.exports = PollController;
