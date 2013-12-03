(function (window, undefined) {
	'use strict';

	var exports = {};
	var socket = null;

	exports.getSocket = function () {
		if (!socket) {
			socket = io.connect(window.location.origin.replace(/\d+$/, 3001));
		}
		return socket;
	}

	window.utils = exports;
})(window);
