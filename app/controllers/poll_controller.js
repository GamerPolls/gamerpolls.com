var locomotive = require('locomotive');
var Controller = locomotive.Controller;
var PollController = new Controller();
var Poll = require('../models/poll');
var login = require('connect-ensure-login');
var moment = require('moment');
var extend = require('jquery-extend');
var colors = require('colors');
var utils = require('../libs/utils');

PollController.new = function () {
	this.poll = this.request.session._poll;
	delete this.request.session._poll;

	if (!this.request.session.isBetaTester) {
		console.log('User is not a beta tester.'.red);
		this.request.flash('danger', 'Sorry, you need to be a beta tester to use this feature!');
		return this.redirect('/');
	}

	this.render();
};

PollController.create = function () {
	var self = this;

	if (!this.request.session.isBetaTester) {
		console.log('User is not a beta tester.'.red);
		this.request.flash('danger', 'Sorry, you need to be a beta tester to use this feature!');
		return this.redirect('/');
	}
	if (this.isEditing) {
		if (!this._poll) {
			return this.next();
		}
		if (!this._poll.isEditable) {
			console.log('Can\'t edit, redirecting to poll.'.yellow);
			return this.redirect(this.urlFor({
				action: 'showPoll',
				id: this._poll._id
			}));
		}
	}

	if (this.__app.locals.disablePolls) {
		console.log('Can\'t create poll, polls are disabled.');
		self.request.flash('danger', 'Polls are currently disabled. You can not create or edit polls at this time.');
		return this.redirect(this.urlFor({
			action: 'new'
		}));
	}

	var nowTime = moment.utc();
	var answers = this.param('answers[]');
	var question = this.param('question').trim();
	var allowSameIP = Boolean(this.param('allowSameIP'));
	var pollType = this.param('pollType');
	var closeTime = nowTime.add(parseInt(this.param('closeNum')), this.param('closeType'));
	var mustFollow = false;
	var mustSub = false;
	var isVersus = false;
	var minChoices = parseInt(this.param('minChoices'));
	var maxChoices = parseInt(this.param('maxChoices'));

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

	if (isVersus) {
		if (this.request.session.twitchtv.hasSubButton) {
			mustSub = true;
		}
		else {
			mustFollow = true;
		}
	}

	if (answers.length > 20) {
		answers = answers.slice(0, 20);
	}

	answers = answers.map(function (answer) {
		if (answer == undefined) {
			return false;
		}
		answer = answer.trim();
		answer = (answer.length > 200 ? answer.substr(0, 200).trim() + '...' : answer);
		if (answer.length > 0) {
			return {
				text: answer
			};
		}
	}).filter(function (answer) {
		return !!answer;
	});

	if (!minChoices || minChoices < 1) {
		minChoices = 1;
	}
	if (!maxChoices) {
		maxChoices = 1;
	}
	if (maxChoices > answers.length) {
		maxChoices = answers.length;
	}

	var beforeTime = closeTime.isBefore(moment.utc);
	var afterTime = closeTime.isAfter(moment.utc().add(3, 'M'));
	if (beforeTime || afterTime) {
		if (beforeTime) {
			this.request.flash('danger', 'Error: You have provided a duration that would end up in the past.');
		}
		if (afterTime) {
			this.request.flash('danger', 'Error: You have provided a duration that would be past 3 months in the future. 3 Months is the maximum duration of a Poll.');
		}
		if (this.isEditing) {
			console.log('Could not edit poll'.red);
			return this.redirect(this.urlFor({
				action: 'showEdit',
				id: this._poll._id
			}));
		}
		else {
			console.log('Could not create poll'.red);
			return this.redirect(this.urlFor({
				action: 'new'
			}));
		}
	}

	question = (question.length > 200 ? question.substr(0, 200).trim() + '...' : question);

	var pollData = this.request.session._poll = {
		answers: answers,
		allowSameIP: allowSameIP,
		mustFollow: mustFollow,
		mustSub: mustSub,
		isVersus: isVersus,
		question: question,
		closeTime: closeTime,
		minChoices: minChoices,
		maxChoices: maxChoices
	};

	if (maxChoices < minChoices) {
		this.request.flash('danger', 'Error: Maximum Choices can\'t be less than Minimum Choices');
		console.log('Could not create poll'.red);
		return this.redirect(this.urlFor({
			action: 'new'
		}));
	}


	if (answers.length < 2 || question === '') {

		this.request.flash('danger', 'Error: Question field is blank or only one answer entered!');

		console.log(this.request.session._poll);
		if (this.isEditing) {
			console.log('Could not edit poll'.red);
			return this.redirect(this.urlFor({
				action: 'showEdit',
				id: this._poll._id
			}));
		}
		else {
			console.log('Could not create poll'.red);
			return this.redirect(this.urlFor({
				action: 'new'
			}));
		}
	}

	if (this.request.isAuthenticated()) {
		pollData.creator = this.request.user._id;
	}

	if (this.isEditing) {
		extend(this._poll, pollData);
	}
	else {
		this._poll = new Poll(pollData);
	}

	this._poll.save(function (err, savedPoll) {
		if (err) {
			return self.next(err);
		}
		if (self.isEditing) {
			self.request.flash('success', 'Poll Edited!');
			console.log('Poll edited.'.green);
		}
		else {
			self.request.flash('success', 'Poll Created!');
			console.log('Poll created!'.green);
		}
		return self.redirect(self.urlFor({
			action: 'showPoll',
			id: savedPoll._id
		}));
	});
};

PollController.showPoll = function () {
	if (!this._poll) {
		return this.next();
	}

	if (this._poll.isClosed || this._poll.hasVoted(this.request)) {
		console.log('Poll is closed or user has voted, redirecting to results.'.yellow);
		console.log({
			closed: this._poll.isClosed,
			voted: this._poll.hasVoted(this.request)
		});
		if (!this._poll.isEmbedded) {
			return this.redirect(this.urlFor({
				action: 'showResults',
				id: this._poll._id
			}));
		}
		else {
			return this.redirect(this.urlFor({
				action: 'showResults',
				id: this._poll._id
			}) + '?embed');
		}
	}

	this.poll = this._poll;

	this.poll.answers = this.poll.answers.map(function (answer) {
		if (/game:.+/.test(answer.text)) {
			answer.isGame = true;
			answer.text = answer.text.replace(/^game:/, '').trim();
			answer.textEncoded = encodeURIComponent(answer.text);
		}
		answer.text = answer.text.replace(/!\[(.+?)]\((.+?)\)/, '<img src="$2" alt="$1" style="max-width: 50px; max-height: 50px;">');
		answer.text = answer.text.replace(/\[(.+?)]\((.+?)\)/, '<a href="$2" target="_blank">[Link] $1</a>');
		return answer;
	});

	console.log('Poll found'.green);

	this.title = 'Poll: ' + (this.poll.question.length > 25 ? this.poll.question.substr(0, 25).trim() + '...' : this.poll.question);
	this.socialTitle = this.poll.question;
	this.url = this.urlFor({
		action: 'showPoll',
		id: this.poll._id
	});
	this.render();
};

PollController.showEdit = function () {
	if (!this._poll) {
		return this.next();
	}

	if (!this._poll.isEditable) {
		console.log('Can\'t edit, redirecting to poll.'.yellow);
		return this.redirect(this.urlFor({
			action: 'showPoll',
			id: this._poll._id
		}));
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
	this.isEditing = true;
	return PollController.create.call(this);
};

PollController.vote = function () {
	var self = this;

	if (!this._poll) {
		return this.next();
	}

	if (!this._poll.isVotable) {
		console.log('Can\'t vote, redirecting to poll');
		return this.redirect(this.urlFor({
			action: 'showPoll',
			id: this._poll._id
		}));
	}

	if (this._poll.isClosed || this._poll.hasVoted(this.request)) {
		console.log('Poll is closed or user has voted, redirecting to results.'.yellow);
		console.log({
			closed: this._poll.isClosed,
			voted: this._poll.hasVoted(this.request)
		});

		return this.redirect(this.urlFor({
			action: 'showResults',
			id: this._poll._id
		}));
	}

	if (this.__app.locals.disableVoting) {
		console.log('Can\'t vote, it\'s disabled, redirecting to poll');
		self.request.flash('danger', 'Voting is currently disabled. You can not vote on this poll.');
		return this.redirect(this.urlFor({
			action: 'showPoll',
			id: this._poll._id
		}));
	}

	var answers = Array.isArray(this.param('answers')) ? this.param('answers') : [this.param('answers')];
	var voted = false;
	var updateData = {
		$inc: {},
		$addToSet: {}
	};

	// Filter out duplicates.
	answers = answers.filter(function (val, idx, arr) {
		return arr.indexOf(val) === idx;
	});

	// Add the votes.
	var x = 0;
	answers.some(function (id) {
		x++;
		self._poll.answers.some(function (val, idx, arr) {
			if (String(val._id) === id) {
				if (self._poll.isVersus && !(self._poll.isSubscribed || self._poll.isFollowing)) {
					updateData.$inc['answers.' + idx + '.votes.versus'] = 1;
				}
				else {
					updateData.$inc['answers.' + idx + '.votes.normal'] = 1;
				}
				voted = true;
				return true;
			}
		});
		if ((x >= self._poll.maxChoices) && voted && (x != self._poll.minChoices)) {
			self.request.flash('warning', 'You tried to vote for more than the maximum options. Your selections have been omitted and only your first ' + self._poll.maxChoices + ' choices counted.');
			return true;
		}
	});

	if (!voted) {
		console.log('Invalid options sent, redirecting back to poll.'.red);
		console.log(answers);
		return self.redirect(self.urlFor({
			action: 'showPoll',
			id: this._poll._id
		}));
	}

	updateData.$addToSet.voterIPs = utils.getIp(this.request);

	if (this.request.isAuthenticated()) {
		updateData.$addToSet.voterIDs = this.request.user._id;
	}

	// Update poll data.
	Poll.update({
		_id: this._poll._id
	}, updateData, function (err) {
		if (err) {
			return self.next(err);
		}
		Poll.findOne({
			_id: self._poll._id
		}, function (err, poll) {
			if (err) {
				return self.next(err);
			}
			if (!self.request.session.pollsVotedIn) {
				self.request.session.pollsVotedIn = [];
			}
			self.request.session.pollsVotedIn.push(poll._id);

			calculatePercentages(poll);

			var data = {
				answers: poll.answers.map(function (answer) {
					return {
						_id: answer._id,
						percentage: answer.percentage,
						votes: answer.votes
					};
				}),
				totalVotes: poll.totalVotes
			};

			self.app.io.sockets.in('poll-' + poll._id).volatile.emit('vote', data);
			self.request.flash('info', 'Vote Successful!');

			return self.redirect(self.urlFor({
				action: 'showResults',
				id: poll._id
			}));
		});
	});
};

PollController.showResults = function () {
	if (!this._poll) {
		return this.next();
	}
	var self = this;

	this.poll = this._poll;

	this.poll.hasVoted = this._poll.hasVoted(this.request);

	calculatePercentages(this.poll);
	this.poll.answers = this.poll.answers.map(function (answer) {
		if (/game:.+/.test(answer.text)) {
			answer.isGame = true;
			answer.text = answer.text.replace(/^game:/, '').trim();
			answer.textEncoded = encodeURIComponent(answer.text);
		}
		answer.text = answer.text.replace(/!\[(.+?)]\((.+?)\)/, '<img src="$2" alt="$1" style="max-width: 50px; max-height: 50px;">');
		answer.text = answer.text.replace(/\[(.+?)]\((.+?)\)/, '<a href="$2" target="_blank">[Link] $1</a>');
		return answer;
	});

	console.log('Poll found'.green);

	this.title = 'Results: ' + (this.poll.question.length > 25 ? this.poll.question.substr(0, 25).trim() + '...' : this.poll.question);
	this.socialTitle = this.poll.question;
	this.url = this.urlFor({
		action: 'showPoll',
		id: this.poll._id
	});
	if (this.poll.isVersus) {
		return this.render('showVersus');
	}
	this.render();
};

PollController.close = function () {
	if (!this._poll) {
		return this.next();
	}

	if (!this._poll.isClosable) {
		console.log('Poll not closable, redirecting to poll.');
		return this.redirect(this.urlFor({
			action: 'showPoll',
			id: this._poll._id
		}));
	}

	this._poll.closeTime = moment.utc();

	var self = this;

	this._poll.save(function (err, savedPoll) {
		if (err) {
			return self.next(err);
		}

		self.app.io.sockets.in('poll-' + savedPoll._id).emit('close', self._poll.closeTime);
		self.request.flash('success', 'Poll Closed.');

		return self.redirect(self.urlFor({
			action: 'showResults',
			id: savedPoll._id
		}));
	});
};

PollController.copy = function () {
	if (!this._poll) {
		return this.next();
	}

	if (!this._poll.isCreator(this.request.user)) {
		console.log('User is not creator, redirecting to poll.');
		return this.redirect(this.urlFor({
			action: 'showPoll',
			id: this._poll._id
		}));
	}
	this.request.session._poll = this._poll;

	return this.redirect(this.urlFor({
		action: 'new'
	}));
};

PollController.before('*', function (next) {
	var self = this;
	var id = this.param('id');
	var apiCalls = 0;

	Poll.findOne({
			_id: id
		})
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

			poll.userIsCreator = poll.isCreator(self.request.user);
			poll.isClosable = !poll.isClosed && poll.userIsCreator;
			poll.isEditable = !poll.isClosed && poll.totalVotes._grand < 1 && poll.userIsCreator;

			poll.isEmbedded = false;
			if (self.request.query.hasOwnProperty('embed')) {
				poll.isEmbedded = true;
			}

			if (poll.userIsCreator) {
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
					'/users/:user/subscriptions/:channel', {
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
					'/users/:user/follows/channels/:target', {
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
		answer.percentage = {};
		for (var type in answer.votes) {
			if (answer.votes.hasOwnProperty(type) && scales.hasOwnProperty(type)) {
				answer.percentage[type] = Math.round((answer.votes[type] * scales[type]) * 100) / 100;
			}
		}
		arr[idx] = answer;
	});
}

module.exports = PollController;
