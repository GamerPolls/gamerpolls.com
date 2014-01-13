var locomotive = require('locomotive');
var Controller = locomotive.Controller;
var PollController = new Controller();
var Poll = require('../models/poll');
var login = require('connect-ensure-login');
var moment = require('moment');
var extend = require('jquery-extend');

PollController.new = function () {
	this.poll = this.request.session._poll;
	delete this.request.session._poll;

	this.render();
};

PollController.create = function () {
	var answers = Array.isArray(this.param('answers')) ? this.param('answers') : [ this.param('answers') ];
	var question = this.param('question').trim();
	var multipleChoice = Boolean(this.param('multipleChoice'));
	var allowSameIP = Boolean(this.param('allowSameIP'));
	var pollType = this.param('pollType');

	var mustFollow = false;
	var mustSub = false;
	var isVersus = false;

	switch (pollType) {
		case 'mustFollow':
			mustFollow = true;
			break;
		case 'mustSub':
			mustSub = true;
			break;
		case 'isVersus':
			isVersus = true;
			break;
	}
	
	answers = answers.map(function (answer) {
		answer = answer.trim();
		if (answer.length > 0) {
			return { text: answer };
		}
	}).filter(function (answer) {
		return !!answer;
	});

	if (answers.length < 2 || question === '') {
		this.request.session._poll = {
			answers: answers,
			multipleChoice: multipleChoice,
			allowSameIP: allowSameIP,
			mustFollow: mustFollow,
			mustSub: mustSub,
			isVersus: isVersus,
			question: question
		};
		this.request.flash('danger', 'Error: Question field is blank or only one answer entered!');
		return this.redirect(this.urlFor({ action: 'new' }));
	}

	if (isVersus) {
		if (this.request.user.hasSubButton) {
			mustSub = true;
		}
		else {
			mustFollow = true;
		}
	}

	var self = this;
	var poll = new Poll({
		answers: answers,
		multipleChoice: multipleChoice,
		allowSameIP: allowSameIP,
		mustFollow: mustFollow,
		mustSub: mustSub,
		isVersus: isVersus,
		question: question
	});

	if (this.request.isAuthenticated()) {
		poll.creator = this.request.user._id;
	}

	poll.save(function (err, savedPoll) {
		if (err) {
			return self.next(err);
		}
		self.request.flash('success', 'Poll Created!');
		return self.redirect(self.urlFor({ action: 'showPoll', id: savedPoll._id }));
	});
};

PollController.showPoll = function () {
	if (!this._poll) {
		return this.next();
	}

	if (this._poll.isClosed || this._poll.hasVoted(this.request)) {
		if (this._poll.isVersus) {
			return this.redirect(this.urlFor({ action: 'showVersus', id: this._poll._id }));
		}

		return this.redirect(this.urlFor({ action: 'showResults', id: this._poll._id }));
	}

	this.poll = this._poll;

	this.poll.answers = this.poll.answers.map(function (answer) {
		if (/game:.+/.test(answer.text)) {
			answer.isGame = true;
			answer.text = answer.text.replace(/^game:/, '').trim();
			answer.textEncoded = encodeURIComponent(answer.text);
		}
		return answer;
	});

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
		extend(this.poll, this.request.session._poll);
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
	var question = this.param('question').trim();
	var multipleChoice = Boolean(this.param('multipleChoice'));
	var allowSameIP = Boolean(this.param('allowSameIP'));
	var pollType = this.param('pollType');

	var mustFollow = false;
	var mustSub = false;
	var isVersus = false;

	switch (pollType) {
		case 'mustFollow':
			mustFollow = true;
			break;
		case 'mustSub':
			mustSub = true;
			break;
		case 'isVersus':
			isVersus = true;
			break;
	}

	answers = answers.map(function (answer) {
		answer = answer.trim();
		if (answer.length > 0) {
			return { text: answer };
		}
	}).filter(function (answer) {
		return !!answer;
	});

	if (answers.length < 2 || question === '') {
		this.request.session._poll = {
			answers: answers,
			multipleChoice: multipleChoice,
			allowSameIP: allowSameIP,
			mustFollow: mustFollow,
			mustSub: mustSub,
			isVersus: isVersus,
			question: question
		};
		this.request.flash('danger', 'Error: Question field is blank or only one answer entered!');
		return this.redirect(this.urlFor({ action: 'showEdit', id: this._poll._id }));
	}

	if (isVersus) {
		if (this.request.user.hasSubButton) {
			mustSub = true;
		}
		else {
			mustFollow = true;
		}
	}

	var self = this;

	this._poll.answers = answers;
	this._poll.multipleChoice = multipleChoice;
	this._poll.allowSameIP = allowSameIP;
	this._poll.mustFollow = mustFollow;
	this._poll.mustSub = mustSub;
	this._poll.isVersus = isVersus;
	this._poll.question = question;

	this._poll.save(function (err, savedPoll) {
		if (err) {
			return self.next(err);
		}
		self.request.flash('success', 'Poll Edited!');
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
		if (this._poll.isVersus) {
			return this.redirect(this.urlFor({ action: 'showVersus', id: this._poll._id }));
		}

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
				if (self._poll.isVersus && !(self._poll.isSubscribed || self._poll.isFollowing)) {
					arr[idx].votes.versus++;
				}
				else {
					arr[idx].votes.normal++;
				}
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
			return self.next(err);
		}
		if (!self.request.session.pollsVotedIn) {
			self.request.session.pollsVotedIn = [];
		}
		self.request.session.pollsVotedIn.push(savedPoll._id);

		calculatePercentages(savedPoll);

		var data = {
			answers: savedPoll.answers.map(function (answer) {
				return {
					_id: answer._id,
					percentage: answer.percentage,
					percentageVs: answer.percentageVs,
					votes: answer.votes
				};
			}),
			totalVotes: savedPoll.totalVotes
		};

		self.app.io.sockets.in('poll-' + savedPoll._id).volatile.emit('vote', data);
		self.request.flash('info', 'Vote Successful!');
		if (savedPoll.isVersus) {
			return self.redirect(self.urlFor({ action: 'showVersus', id: savedPoll._id }));
		}

		return self.redirect(self.urlFor({ action: 'showResults', id: savedPoll._id }));
	});
};

PollController.showResults = function () {
	if (!this._poll) {
		return this.next();
	}
	var self = this;

	this.poll = this._poll;

	if (this.poll.isVersus) {
		return self.redirect(self.urlFor({ action: 'showVersus', id: this.poll._id }));
	}

	calculatePercentages(this.poll);
	this.poll.answers = this.poll.answers.map(function (answer) {
		if (/game:.+/.test(answer.text)) {
			answer.isGame = true;
			answer.text = answer.text.replace(/^game:/, '').trim();
			answer.textEncoded = encodeURIComponent(answer.text);
		}
		return answer;
	});

	this.title = 'Results: ' + (this.poll.question.length > 25 ? this.poll.question.substr(0, 25).trim() + '...' : this.poll.question);
	this.render();
};

PollController.showVersus = function () {
	if (!this._poll) {
		return this.next();
	}
	var self = this;

	this.poll = this._poll;

	if (!this.poll.isVersus) {
		return self.redirect(self.urlFor({ action: 'showResults', id: this.poll._id }));
	}

	calculatePercentages(this.poll);
	this.poll.answers = this.poll.answers.map(function (answer) {
		if (/game:.+/.test(answer.text)) {
			answer.isGame = true;
			answer.text = answer.text.replace(/^game:/, '').trim();
			answer.textEncoded = encodeURIComponent(answer.text);
		}
		return answer;
	});

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
			return self.next(err);
		}

		self.app.io.sockets.in('poll-' + savedPoll._id).emit('close', self._poll.closeTime);
		self.request.flash('success', 'Poll Closed.');
		if (savedPoll.isVersus) {
			return self.redirect(self.urlFor({ action: 'showVersus', id: savedPoll._id }));
		}
		
		return self.redirect(self.urlFor({ action: 'showResults', id: savedPoll._id }));
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

			self.app.io.sockets.on('connection', function (socket) {
				socket.join('poll-' + poll._id);
			});

			poll.isClosable = !poll.isClosed && poll.isCreator(self.request.user);
			poll.isEditable = !poll.isClosed && poll.totalVotes._grand < 1 && poll.isCreator(self.request.user);
			
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
						accessKey: self.request.session.twitchtv.accessToken
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
						accessKey: self.request.session.twitchtv.accessToken
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
			return done(null, poll);
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
			if ((!poll.mustSub && !poll.mustFollow) || (poll.isVersus && self.request.isAuthenticated())) {
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
 * Adds a `percentage` property to a poll's answer objects.
 * @param  {object} poll The poll.
 */
function calculatePercentages(poll) {
	var totals = poll.totalVotes;
	var scales = {};
	// Get multiplier scales for each type.
	for (var type in totals) {
		if (totals.hasOwnProperty(type)) {
			scales[type] = 100 / totals[type];
		}
	}
	
	// Add `percentage` property.
	poll.answers.forEach(function (answer, idx, arr) {
		answer = typeof answer.toObject === 'undefined' ? answer : answer.toObject();
		answer.percentage = {};
		for (var type in answer.votes) {
			if (answer.votes.hasOwnProperty(type) && scales.hasOwnProperty(type)) {
				answer.percentage[type] = Math.round(answer.votes[type] * scales[type]);
			}
		}
		arr[idx] = answer;
	});
}

module.exports = PollController;
