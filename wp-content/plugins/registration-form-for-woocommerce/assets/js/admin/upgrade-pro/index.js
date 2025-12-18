import { __ } from '@wordpress/i18n';

(function( $ ){
	'use strict';

	$(function() {
		$(document).on('click dragstart', '.editor-block-list-item-tgwcfb-phone, .editor-block-list-item-tgwcfb-multi-select, .editor-block-list-item-tgwcfb-profile-picture, .editor-block-list-item-tgwcfb-date-picker, .editor-block-list-item-tgwcfb-user-roles, .editor-block-list-item-tgwcfb-time-picker, .editor-block-list-item-tgwcfb-range, .editor-block-list-item-tgwcfb-file-upload', function(event) {
			event.preventDefault();
            event.stopImmediatePropagation(); // Stop the event from propagating

        var blockClass = $(this).attr('class');

		var field = 'field';

        if (blockClass.includes('tgwcfb-phone')) {
            field = "Phone";
        } else if (blockClass.includes('tgwcfb-multi-select')) {
            field = "Multi-Select";
        } else if (blockClass.includes('tgwcfb-profile-picture')) {
            field = "Profile Picture";
        } else if (blockClass.includes('tgwcfb-date-picker')) {
            field = "Date Picker";
        } else if (blockClass.includes('tgwcfb-user-roles')) {
            field = "User Roles";
        } else if (blockClass.includes('tgwcfb-time-picker')) {
            field = "Time Picker";
        } else if (blockClass.includes('tgwcfb-range')) {
            field = "Range";
        }else if (blockClass.includes('tgwcfb-file-upload')) {
            field = "File Upload";
        }
        var message = __('This %s field is only available in the Pro version. Upgrade now to access it.'.replace('%s', field), 'registration-form-for-woocommerce');

        // Show SweetAlert with the dynamic message
		Swal.fire({
			title: "Upgrade to PRO",
			text: message,
			icon: "info",
			showCancelButton: true,
			confirmButtonColor: "#3085d6",
			cancelButtonColor: "#d33",
			confirmButtonText: "Upgrade to PRO"
		  }).then((result) => {
			if (result.isConfirmed) {
				window.open('https://woocommerce.com/products/registration-form-fields/', '_blank');			}
		  });
    });
	});

}(jQuery));
wp.domReady(function() {
    const disabledBlocks = [
        'tgwcfb/phone',
        'tgwcfb/multi-select',
        'tgwcfb/date-picker',
        'tgwcfb/profile-picture',
        'tgwcfb/range',
        'tgwcfb/time-picker',
        'tgwcfb/user-roles',
		'tgwcfb/file-upload',
    ];

    setTimeout(function() {
        wp.data.subscribe(() => {
            const { getBlocks } = wp.data.select('core/block-editor');
            const blockList = getBlocks();

            blockList.forEach(block => {
                if (block && block.name && disabledBlocks.includes(block.name)) {
                    if (block.clientId) {
                        wp.data.dispatch('core/block-editor').removeBlock(block.clientId);
                    }
					if (Array.isArray(block.innerBlocks)) {
						block.innerBlocks.forEach(innerBlock => {
							if (innerBlock && innerBlock.clientId && disabledBlocks.includes(innerBlock.name)) {
							   wp.data.dispatch('core/block-editor').removeBlock(innerBlock.clientId);
							}
						});
					}
                }

            });

        });
    }, 1000);
});
