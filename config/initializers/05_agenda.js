var nconf = require('nconf');
var Agenda = require('agenda');
var agenda = new Agenda({
	db: {
		address: nconf.get('MONGO_DB')
	}
});
var Poll = require('../../app/models/poll');
var moment = require('moment');

// Remove polls that have been closed for 2+ weeks.
agenda.define('remove closed polls', function (job, done) {
	console.log('Start task: ' + job.attrs.name);

	Poll.find(
		{
			closeTime: {
				$lte: moment.utc().subtract('weeks', 2)
			}
		},
		function (err, docs) {
			if (err) {
				return done(err);
			}
			docs.forEach(function (doc) {
				doc.remove(function (err, doc) {
					if (err) {
						return done(err);
					}

					console.log('Poll removed: ' + JSON.stringify({
						_id: doc._id,
						closeTime: doc.closeTime,
						creator: doc.creator
					}));
				});
			});
			
			done();
		}
	);
	
	console.log('End task: ' + job.attrs.name);
});

module.exports = function () {
	agenda.every('1 day', 'remove closed polls');

	agenda.start();
};
