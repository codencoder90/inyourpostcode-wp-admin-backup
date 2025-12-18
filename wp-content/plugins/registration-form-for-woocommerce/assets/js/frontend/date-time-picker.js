import $ from 'jquery';

(() => {
	$('.form-row[id^="date_picker_"]').find('input').flatpickr();

	$('.form-row[id^="time_picker_"]').find('input').flatpickr({
		noCalendar: true,
		enableTime: true,
		dateFormat: 'h:i K',
	});
})();
