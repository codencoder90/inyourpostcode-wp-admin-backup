import $ from "jquery";

(() => {

	if ( typeof _TGWCFB_FRONTEND_COUNTRY_ === 'undefined' ) {
		return false;
	}
	const shippingFields = $('.form-row[id^="shipping_"][id$="_field"]');

	shippingFields.hide();

	$("#separate_shipping_field")
		.find('input[name="separate_shipping"]')
		.on("change", (e) => {
			if ($(e.currentTarget).is(":checked")) {
				shippingFields.show();
				// $( '#shipping_country' ).trigger( 'country_to_state_changed' );
			} else {
				shippingFields.hide();
			}
		});

	$(document.body).on(
		"change refresh",
		'.billing_country_select, .shipping_country_select',
		function () {
			if ($(this).hasClass("shipping_country_select")) {
				var $statebox = $('#shipping_state');
			} else if ($(this).hasClass("billing_country_select")) {
				var $statebox = $('#billing_state');;
			} else {
				return;
			}

			var country = $(this).val(),
				$parent = $statebox.closest(".form-row"),
				input_name = $statebox.attr("name"),
				input_id = $statebox.attr("id"),
				input_classes = $statebox.attr("data-input-classes"),
				value = $statebox.val(),
				placeholder =
					$statebox.attr("placeholder") ||
					$statebox.attr("data-placeholder") ||
					"",
				$newstate,
				states_json       = _TGWCFB_FRONTEND_COUNTRY_.countries.replace( /&quot;/g, '"' ),
				states            = JSON.parse( states_json );

			if (
				placeholder === _TGWCFB_FRONTEND_COUNTRY_.i18n_select_state_text
			) {
				placeholder = "";
			}

			if (states[country]) {
				if ($.isEmptyObject(states[country])) {
					$newstate = $('<input type="hidden" />')
						.prop("id", input_id)
						.prop("name", input_name)
						.attr("data-input-classes", input_classes)
						.addClass("hidden " + input_classes);
					$parent.hide().find(".select2-container").remove();
					$statebox.replaceWith($newstate);
				} else {
					var state = states[country],
						$defaultOption = $('<option value=""></option>').text(
							_TGWCFB_FRONTEND_COUNTRY_.i18n_select_state_text
						);

					if (!placeholder) {
						placeholder =
							_TGWCFB_FRONTEND_COUNTRY_.i18n_select_state_text;
					}

					$parent.show();

					if ($statebox.is("input")) {
						$newstate = $("<select></select>")
							.prop("id", input_id)
							.prop("name", input_name)
							.data("placeholder", placeholder)
							.attr("data-input-classes", input_classes)
							.addClass("state_select " + input_classes);
						$statebox.replaceWith($newstate);
						$statebox = $wrapper.find(
							"#billing_state, #shipping_state, #calc_shipping_state"
						);
					}

					$statebox.empty().append($defaultOption);

					$.each(state, function (index) {
						var $option = $("<option></option>")
							.prop("value", index)
							.text(state[index]);
						$statebox.append($option);
					});

					$statebox.val(value).trigger("change");

				}
			} else {
				if ($statebox.is('select, input[type="hidden"]')) {
					$newstate = $('<input type="text" />')
						.prop("id", input_id)
						.prop("name", input_name)
						.prop("placeholder", placeholder)
						.attr("data-input-classes", input_classes)
						.addClass("input-text  " + input_classes);
					$parent.show().find(".select2-container").remove();
					$statebox.replaceWith($newstate);
				}
			}
		}
	);
})();
