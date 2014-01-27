(function (window, undefined) {
	'use strict';

	var exports = {};
	var socket = null;
	var localStorage = window.localStorage;
	var lightOff = null;

	exports.getSocket = function () {
		if (!socket) {
			socket = io.connect(window.location.protocol + '//' + window.location.host);
		}
		return socket;
	}

	exports.localStorage = {};
	exports.localStorage.get = function (aKey, aDefault) {
		var val = JSON.parse(localStorage.getItem(aKey));
		if (val === null && typeof aDefault !== 'undefined') {
			return aDefault;
		}
		return val;
	};
	exports.localStorage.set = function (aKey, aVal) {
		return localStorage.setItem(aKey, JSON.stringify(aVal));
	};
	exports.localStorage.delete = function (aKey) {
		return localStorage.removeItem(aKey);
	};

	lightOff = exports.localStorage.get('lightOff', true);
	exports.toggleLight = function (initial) {
		if (!initial) {
			lightOff = !lightOff;
			utils.localStorage.set('lightOff', lightOff);
		}
		$('body').toggleClass('theme-dark', lightOff);
	};

	window.utils = exports;
})(window);
