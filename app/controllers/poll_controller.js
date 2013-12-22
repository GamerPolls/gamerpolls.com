var locomotive = require('locomotive');
var Controller = locomotive.Controller;
var PollController = new Controller();
var Poll = require('../models/poll');
var login = require('connect-ensure-login');
var moment = require('moment');

PollController.new = function () {
	this.poll = this.request.session._poll;
	delete this.request.session._poll;

	this.render();
};

PollController.create = function () {
	var answers = Array.isArray(this.param('answers')) ? this.param('answers') : [ this.param('answers') ];
	var question = this.param('question');
	var multipleChoice = Boolean(this.param('multipleChoice'));
	var allowSameIP = Boolean(this.param('allowSameIP'));
	var mustFollow = Boolean(this.param('mustFollow'));
	var mustSub = Boolean(this.param('mustSub'));

	answers = answers.map(function (answer) {
		return { text: answer };
	});

	if (answers.length < 2) {
		this.request.session._poll = {
			answers: answers,
			multipleChoice: multipleChoice,
			allowSameIP: allowSameIP,
			mustFollow: mustFollow,
			mustSub: mustSub,
			question: question
		};
		return this.redirect(this.urlFor({ action: 'new' }));
	}

	var self = this;
	var poll = new Poll({
		answers: answers,
		multipleChoice: multipleChoice,
		allowSameIP: allowSameIP,
		mustFollow: mustFollow,
		mustSub: mustSub,
		question: question
	});

	if (this.request.isAuthenticated()) {
		poll.creator = this.request.user._id;
	}

	poll.save(function (err, savedPoll) {
		if (err) {
			return self.next();
		}
		return self.redirect(self.urlFor({ action: 'showPoll', id: savedPoll._id }));
	});
};

PollController.showPoll = function () {
	if (!this._poll) {
		return this.next();
	}

	if (this._poll.isClosed || this._poll.hasVoted(this.request)) {
		return this.redirect(this.urlFor({ action: 'showResults', id: this._poll._id }));
	}

	this.poll = this._poll;
	this.title = 'Poll: ' + (this.poll.question.length > 25 ? this.poll.question.substr(0, 25).trim() + '...' : this.poll.question);

	this.render();
};

PollController.showEdit = function () {
	if (!this._poll) {
		return this.next();
	}

	if (!this._poll.isEditable) {
		return this.redirect(this.urlFor({ action: 'showPoll', id: this._poll._id }));
	}
	this.poll = this._poll;

	if (this.request.session._poll) {
		this.poll = this.request.session._poll;
		delete this.request.session._poll;
	}

	this.isEditing = true;
	this.render('new');
};

PollController.edit = function () {
	if (!this._poll) {
		return this.next();
	}

	if (!this._poll.isEditable) {
		return this.redirect(this.urlFor({ action: 'showPoll', id: this._poll._id }));
	}

	var answers = Array.isArray(this.param('answers')) ? this.param('answers') : [ this.param('answers') ];
	var question = this.param('question');
	var multipleChoice = Boolean(this.param('multipleChoice'));
	var allowSameIP = Boolean(this.param('allowSameIP'));
	var mustFollow = Boolean(this.param('mustFollow'));
	var mustSub = Boolean(this.param('mustSub'));

	answers = answers.map(function (answer) {
		return { text: answer };
	});

	if (answers.length < 2) {
		this.request.session._poll = {
			answers: answers,
			multipleChoice: multipleChoice,
			allowSameIP: allowSameIP,
			mustFollow: mustFollow,
			mustSub: mustSub,
			question: question
		};
		return this.redirect(this.urlFor({ action: 'showEdit', id: this._poll._id }));
	}

	var self = this;

	this._poll.answers = answers;
	this._poll.multipleChoice = multipleChoice;
	this._poll.allowSameIP = allowSameIP;
	this._poll.mustFollow = mustFollow;
	this._poll.mustSub = mustSub;
	this._poll.question = question;

	this._poll.save(function (err, savedPoll) {
		if (err) {
			return self.next();
		}
		return self.redirect(self.urlFor({ action: 'showPoll', id: savedPoll._id }));
	});
};

PollController.vote = function () {
	if (!this._poll) {
		return this.next();
	}

	if (!this._poll.isVotable) {
		return this.redirect(this.urlFor({ action: 'showPoll', id: this._poll._id }));
	}

	if (this._poll.isClosed || this._poll.hasVoted(this.request)) {
		return this.redirect(this.urlFor({ action: 'showResults', id: this._poll._id }));
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

	this._poll.voterIPs.push(this.request.ip);

	if (this.request.isAuthenticated()) {
		this._poll.voterIDs.push(this.request.user._id);
	}

	this._poll.save(function (err, savedPoll) {
		if (err) {
			return self.next();
		}
		if (!self.request.session.pollsVotedIn) {
			self.request.session.pollsVotedIn = [];
		}
		self.request.session.pollsVotedIn.push(savedPoll._id);
		self.app.io.sockets.in('poll-' + savedPoll._id).emit('vote', calculatePercentages(savedPoll.answers));
		return self.redirect(self.urlFor({ action: 'showResults', id: savedPoll._id }));
	});
};

PollController.showResults = function () {
	if (!this._poll) {
		return this.next();
	}
	var self = this;
	this.app.io.sockets.on('connection', function (socket) {
		socket.join('poll-' + self._poll._id);
	});
	this.poll = this._poll;
	this.poll.answers = calculatePercentages(this.poll.answers);
	this.title = 'Results: ' + (this.poll.question.length > 25 ? this.poll.question.substr(0, 25).trim() + '...' : this.poll.question);
	this.render();
};

PollController.close = function () {
	if (!this._poll) {
		return this.next();
	}

	if (!this._poll.isClosable) {
		return this.redirect(this.urlFor({ action: 'showPoll', id: this._poll._id }));
	}

	this._poll.closeTime = moment.utc();

	var self = this;

	this._poll.save(function (err, savedPoll) {
		if (err) {
			return self.next();
		}
		return self.redirect(self.urlFor({ action: 'showPoll', id: savedPoll._id }));
	});
};

PollController.before('*', function (next) {
	var self = this;
	var id = Number(this.param('id'));
	var apiCalls = 0;

	if (isNaN(id)) {
		return done();
	}

	Poll.findOne({ _id: id })
		.populate('creator')
		.exec(function (err, poll) {
			if (err) {
				return done(err);
			}

			if (!poll) {
				return done();
			}

			poll.isClosable = !poll.isClosed && poll.isCreator(self.request.user);
			poll.isEditable = poll.totalVotes < 1 && poll.isCreator(self.request.user);
			
			if (poll.isCreator(self.request.user)) {
				poll.isSubscribed = true;
				poll.isFollowing = true;
				return done(null, poll);
			}

			if (!self.request.isAuthenticated()) {
				return done(null, poll);
			}

			if (poll.mustSub) {
				apiCalls++;
				self.app.twitch.api(
					'/users/:user/subscriptions/:channel',
					{
						replacements: {
							user: self.request.user.username,
							channel: poll.creator.username
						},
						accessKey: request.session.twitchtv.accessToken
					},
					function (err, statusCode, response) {
						apiCalls--;
						if (err) {
							return done(err);
						}

						if (statusCode !== 422 && statusCode !== 404) {
							poll.isSubscribed = true;
						}

						return done(null, poll);
					}
				);
			}

			if (poll.mustFollow) {
				apiCalls++;
				self.app.twitch.api(
					'/users/:user/follows/channels/:target',
					{
						replacements: {
							user: self.request.user.username,
							target: poll.creator.username
						},
						accessKey: request.session.twitchtv.accessToken
					},
					function (err, statusCode, response) {
						apiCalls--;
						if (err) {
							return done(err);
						}

						if (statusCode !== 404) {
							poll.isFollowing = true;
						}

						return done(null, poll);
					}
				);
			}
		});

	function done(err, poll) {
		if (err) {
			return next(err);
		}
		// Still API calls out there.
		if (apiCalls) {
			return;
		}
		if (poll) {
			if (!poll.mustSub && !poll.mustFollow) {
				poll.isVotable = true;
			}
			else if ((poll.mustSub && poll.isSubscribed) || (poll.mustFollow && poll.isFollowing)) {
				poll.isVotable = true;
			}
			self._poll = poll;
		}
		return next();
	}
});

/**
 * Adds a `percentage` property to an answer object.
 * @param  {array} answers An array of answer objects. Must have a `votes` property. Can be a normal object or a mongoose object.
 * @return {array}         The answers array with a `percentage` property on each answer object.
 */
function calculatePercentages(answers) {
	// Get multiplier scale.
	var scale = answers.reduce(function (prevVotes, answer) {
		return prevVotes + answer.votes;
	}, 0);
	scale = 100 / scale;
	
	// Add `percentage` property.
	answers.forEach(function (answer, idx, arr) {
		answer = typeof answer.toObject === 'undefined' ? answer : answer.toObject();
		answer.percentage = Math.round(answer.votes * scale);
		arr[idx] = answer;
	});
	return answers;
}

module.exports = PollController;
