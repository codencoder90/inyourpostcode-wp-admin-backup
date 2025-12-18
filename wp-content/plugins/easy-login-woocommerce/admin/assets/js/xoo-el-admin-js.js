jQuery(document).ready(function($){
	'use strict';
	
	$('select[name="xoo-el-sy-options[sy-popup-height-type]"]').on( 'change', function(){

		var $setting = $( '.xoo-as-setting:has(input[name="xoo-el-sy-options[sy-popup-height]"])' );

		if( $(this).val() === 'auto' ){
			$setting.hide();
		}
		else{
			$setting.show();
		}
		
	} ).trigger('change');

	var changedOnLoad = false;

	$('input[name="xoo-el-gl-options[m-form-pattern]"]').on( 'change', function(){

		if( !$(this).is(':checked') ) return;

		var $setting 		= $('select[name="xoo-el-gl-options[m-nav-pattern]"]'),
			$shortcodeInfo 	= $('select[data-fname="xoo-elscg-poptype"] + span.xoo-el-scgdesc');

		if( $(this).val() === 'single' ){
			if( changedOnLoad ){
				$setting.find('option[value="links"]').prop( 'selected', true );
				$setting.trigger('change');
			}
			$shortcodeInfo.show();
		}

		if( $(this).val() === 'separate' ){
			if( changedOnLoad ){
				$setting.find('option[value="tabs"]').prop( 'selected', true );
				$setting.trigger('change');
			}
			$shortcodeInfo.hide();
		}

		changedOnLoad = true;

	}).trigger('change');


	$('input[name="xoo-el-sy-options[sy-popup-style]"]').on( 'change', function(){

		if( !$(this).is(':checked') ) return;

		var $setting = $( '.xoo-as-setting:has(select[name="xoo-el-sy-options[sy-popup-height-type]"]), .xoo-as-setting:has(input[name="xoo-el-sy-options[sy-popup-height]"])' );

		if( $(this).val() === 'slider' ){
			$setting.hide();
		}
		else{
			$setting.show();
		}
		
	} ).trigger('change');


	$('input[name="xoo-el-gl-options[m-en-myaccount]"]').on( 'change', function(){

		var $setting = $('textarea[name="xoo-el-gl-options[m-myacc-sc]"]').closest('.xoo-as-setting');


		if( $(this).is(':checked') ){
			$setting.show();
		}
		else{
			$setting.hide();
		}
	})


	$('input[name="xoo-el-gl-options[m-en-chkout]"]').on( 'change', function(){

		var $setting = $('textarea[name="xoo-el-gl-options[m-chkout-sc]"]').closest('.xoo-as-setting');


		if( $(this).is(':checked') ){
			$setting.show();
		}
		else{
			$setting.hide();
		}
	})
	

	function escapeHtml(str) {
	    return str.replace(/&/g, "&amp;")  // Escape &
	              .replace(/</g, "&lt;")   // Escape <
	              .replace(/>/g, "&gt;")   // Escape >
	              .replace(/"/g, "&quot;") // Escape "
	              .replace(/'/g, "&#039;");// Escape '
	}


	var updatedTimeout = false;

	function generate_shortcode(){

		var shortcode = {};

		$('[data-fname]:visible, .xoo-elscg-fields:visible .wp-editor-area[data-fname]').each(function(index, el){

			var $cont 	= $(this).closest('.xoo-el-scgroup'),
				attr 	= $cont.data('attr'),
				val 	= $(this).val();

			if( ( $(this).attr('type') === 'checkbox' || $(this).attr('type') === 'radio' ) && !$(this).prop('checked') ) return;

			if( shortcode[attr] && $cont.data('multiple') === 'yes' ){
				if( Array.isArray( shortcode[attr] ) ){
					shortcode[attr].push( val );
				}
				else{
					shortcode[attr] = [ shortcode[attr], val ];
				}
			}
			else{
				shortcode[attr] = val;
			}

		})


		var shortcodeType = shortcode.sctype;

		if( !shortcodeType ) return;

		if( shortcode.login_redirect === 'global' ){
			delete shortcode.login_redirect;
		}

		if( shortcode.register_redirect === 'global' ){
			delete shortcode.register_redirect;
		}


		if( shortcode.redirect_to === 'global' ){
			delete shortcode.redirect_to;
		}

		delete shortcode.sctype;


		var shortcodeString = shortcodeType === 'inline' ? '[xoo_el_inline_form' : '[xoo_el_pop';

		$.each( shortcode, function(attr,val ){
			if( Array.isArray(val) ){
				val = val.join(',');
			}
			shortcodeString += ' '+attr+'="'+escapeHtml(val)+'"';
		})


		var $shortcodeCont = $('.xoo-elscg-shortcode');

		$shortcodeCont.find('.xoo-elscg-sctext').val(shortcodeString+']');
		$shortcodeCont.addClass('xoo-elscg-active').show();


		clearTimeout(updatedTimeout);

		updatedTimeout = setTimeout(function(){
			$shortcodeCont.removeClass('xoo-elscg-active');
		},2000)
	};


	//Add fname to wp editor
	$('.xoo-el-scgroup textarea.wp-editor-area').each(function(){
		$(this).attr('data-fname', $(this).attr('name'));
		var editor = tinymce.get($(this).attr('name'));
		if( !editor ) return;
		editor.on('keyup change', function() {
			editor.save();
	        generate_shortcode();
	    });
	    $(this).attr('name', '');
	})


	$('[data-showval]').each(function(index, el){

		var $parentOption 	= $(this).siblings('[data-fname="'+$(this).data('fname')+'"]'),
			$dependant 		= $(this);

		$parentOption.on('change', function(){
			if( $(this).val() === $dependant.data('showval') ){
				$dependant.show();
			}
			else{
				$dependant.hide();
			}
		});
	})

	$('input[type="radio"][data-fname]').on('change',function(){
		$('input[type="radio"][data-fname="'+$(this).attr('data-fname')+'"').not(this).prop('checked',false);
	});


	$('[data-fname="xoo-elscg-sctype"]').on('change', function(){
		$('.xoo-elscg-fields').hide();
		$('.xoo-elscg-fields[data-type="'+$(this).val()+'"]').show();
	})

	$('[data-fname]').on('change', function(){
		generate_shortcode();
	})

	generate_shortcode();

	 $('.xoo-elscg-copy').click(function () {
		// Create a temporary textarea to hold the text
		var tempInput = $('<textarea>');
		$('body').append(tempInput);

		// Get the text to copy
		tempInput.val($('.xoo-elscg-sctext').val()).select();

		// Copy the text to the clipboard
		document.execCommand('copy');

		// Remove the temporary textarea
		tempInput.remove();

		// Provide feedback (optional)
		alert('Shortcode copied!');
	});


	$('.xoo-el-adpop img.xoo-as-patimg').on('click', function(){

		var $cont 		= $(this).closest('.xoo-as-setting'),
			fieldID 	= $cont.data('field_id'),
			key			= $(this).data('key'),
			$formField 	= $('.xoo-as-setting[data-field_id="'+fieldID+'"]').not($cont);


		if( $formField.length ){
			$formField.find( 'img.xoo-as-patimg[data-key="'+key+'"]' ).trigger('click');
		}

	})

	$('.xoo-el-adpop input[name="xoo-el-gl-options[ao-enable]"]').on('change', function(){
		$('input[name="xoo-el-gl-options[ao-enable]"]').not(this).prop('checked', $(this).is(':checked') );
	});

	 $('button.xoo-el-adpopup-go').on('click', function(){

		$('body').removeClass('xoo-el-adpopup-active');

		$('.xoo-as-form-save').trigger('click');

		var $menuSelect = $('select[name="xoo-el-add-to-menu"]');

		if( !$menuSelect.length || $menuSelect.val() === 'none' ){
			$('.xoo-el-initnomenu').show();
		}

		$('.xoo-el-admin-popup').remove();

		if( !xoo_el_admin_localize.hasWoocommerce ){
			$('ul.xoo-sc-tabs li[data-tab="shortcodes"]').trigger('click');
		}

		$('html, body').animate({ scrollTop: 0 }, 0);
	});
	
	$('.xoo-el-init-done span').on('click', function(){
		$('.xoo-el-init-done').remove();
	})


});
