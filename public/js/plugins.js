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

// Facebook Sharing
(function (d, s, id) {
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) return;
	js = d.createElement(s);
	js.id = id;
	js.src = "//connect.facebook.net/en_US/all.js#xfbml=1";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// Twitter Sharing
! function (d, s, id) {
	var js, fjs = d.getElementsByTagName(s)[0],
		p = /^http:/.test(d.location) ? 'http' : 'https';
	if (!d.getElementById(id)) {
		js = d.createElement(s);
		js.id = id;
		js.src = p + '://platform.twitter.com/widgets.js';
		fjs.parentNode.insertBefore(js, fjs);
	}
}(document, 'script', 'twitter-wjs');

// Google+ Sharing
(function () {
	var po = document.createElement('script');
	po.type = 'text/javascript';
	po.async = true;
	po.src = 'https://apis.google.com/js/platform.js';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(po, s);
})();
