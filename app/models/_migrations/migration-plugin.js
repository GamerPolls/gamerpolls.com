/**
 * Schema migrations to migrate data.
 * @param {object} schema         The mongoose schema, this is automatically passed by the `plugin` method on schemas.
 * @param {object} options        The options, detailed below as `option`.
 * @param {string} option.path    The name of the require, relative to this file. Gets required as `./path`.
 * @param {number} option.version The current schema version.
 *
 * Example usage when this file is located in `models/_migrations`:
 *
 * file: models/poll.js
 *
 * var PollSchema = new Schema({ ... });
 * PollSchema.plugin(require('./_migrations/migration-plugin'), {
 *   path: 'poll',
 *   version: 1
 * });
 *
 *
 * file: models/_migrations/poll.js
 *
 * module.exports = {
 *   1: function () {
 *     this.answers.forEach(function (val, idx, arr) {
 *       arr[idx] = {
 *         text: String(val),
 *         votes: this.votes[idx]
 *       };
 *     }, this);
 *   },
 * }
 *
 * When a schema change happens, bump up the `option.version` and create another function with the same number as the
 * version. Migrations happen from document version up to current version. Basically the document will say "my versios
 * is old, I will execute `nextversion()` to get there". That check and upgrade will happen for each version until the
 * document is on the newest version.
 */
module.exports = exports = function schemaMigrations(schema, options) {
	if (!options) {
		console.log('You must pass options to the migration plugin.');
		return;
	}

	schema.add({
		__schemaVersion: Number
	});

	schema.post('init', function (doc) {
		if (!doc.__schemaVersion) {
			doc.__schemaVersion = 0;
		}
		if (doc.__schemaVersion < options.version) {
			console.log('Document schema version is out of date. Current version: `' + doc.__schemaVersion + '`, latest version: `' + options.version + '`');
			var migrations = require('./' + options.path.toLowerCase());
			for (var i = doc.__schemaVersion; i < options.version; i++) {
				console.log('Migrating from `' + i + '` to `' + (i + 1) + '`...');
				if (!migrations[i + 1]) {
					console.log('Migration failed: migration path does not exist for version `' + (i + 1) + '`');
					return;
				}
				migrations[i + 1].call(doc);
				doc.__schemaVersion = i + 1;
			}
			console.log('Migration complete!');
			doc.save();
		}
	});

	schema.post('save', function (doc) {
		if (typeof doc.__schemaVersion === 'undefined') {
			doc.__schemaVersion = options.version;
			doc.save();
		}
	});
}
