var nconf = require('nconf');
module.exports = function () {
	nconf.file({ file: 'default-env.json' });
	nconf.file({ file: 'env.json' });
	nconf.argv();
	nconf.env();
}
