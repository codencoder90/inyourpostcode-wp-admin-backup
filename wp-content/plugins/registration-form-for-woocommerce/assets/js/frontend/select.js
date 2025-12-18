import $ from 'jquery';

(() => {
	// Apply selectWoo to all instances of '.tgwcfb-enhanced-select'
	$('.tgwcfb-enhanced-select').each(function() {
	  $(this).selectWoo({
		minimumResultsForSearch: -1,
	  });
	});

  })();
