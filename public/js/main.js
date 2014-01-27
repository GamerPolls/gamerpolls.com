utils.toggleLight(true);
$(function () {
	$('span[data-time]').updateMoments();
	$('[data-toggle="tooltip"]').tooltip();

	$('#flipthelights').click(function (evt) {
		evt.preventDefault();
		utils.toggleLight();
	});
});
