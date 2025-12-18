import $ from 'jquery';

(() => {
	const range = $('.form-row[id^="range_"]');

	range.each((_, r) => {
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
})();
