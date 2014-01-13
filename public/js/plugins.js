(function ($) {
	$.fn.updateMoments = function (options) {
		options = $.extend({}, {
			format: 'llll',
			update: true,
			updateInterval: 60000
		}, options);

		var elements = $(this).filter('[data-time]');
		elements.each(updateTime);

		if (options.update) {
			setTimeout(function () {
				elements.updateMoments(options);
			}, options.updateInterval);
		}

		return $(this);

		function updateTime() {
			var el = $(this);
			var time = moment(el.attr('data-time')).local();
			el.attr('title', time.format(options.format));
			el.text(time.fromNow());
		}
	};
})(jQuery);
