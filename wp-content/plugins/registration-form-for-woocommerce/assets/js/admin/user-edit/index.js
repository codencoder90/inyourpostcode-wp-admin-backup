import $ from 'jquery';

import './index.scss';

(() => {
	$('.tgwcfb-range').each((_, r) => {
		const slider = $(r).find('input[type="range"]');
		const input = $(r).find('input[type="number"]');

		slider.on('change', (e) => {
			const val = $(e.currentTarget).val();
			input.val(val);
		});

		input.on('change', (e) => {
			const val = $(e.currentTarget).val();
			slider.val(val);
		});
	});

	$('.tgwcfb-select').selectWoo({
		minimumResultsForSearch: -1,
	});

	$('.tgwcfb-date').flatpickr();

	$('.tgwcfb-time').flatpickr({
		noCalendar: true,
		enableTime: true,
		dateFormat: 'h:i K',
	});
})();
