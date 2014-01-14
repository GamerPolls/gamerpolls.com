(function (window, undefined) {
	'use strict';

	var exports = {};
	var socket = null;

	exports.getSocket = function () {
		if (!socket) {
			socket = io.connect(window.location.protocol + '//' + window.location.host);
		}
		return socket;
	}

	window.utils = exports;
})(window);
