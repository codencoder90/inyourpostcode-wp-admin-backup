import { __, _n, sprintf } from '@wordpress/i18n';
import { getFieldInputType, getFieldType, isFieldType, isFieldRequired, isFieldHidden } from './util';

/**
 * Handles frontend field validation for product options in a add to cart form.
 *
 * @param {HTMLFormElement}   addToCartForm
 * @param {HTMLButtonElement} addtoCartButton
 */
const fieldValidation = ( addToCartForm, addtoCartButton = null ) => {
	const $ = window.jQuery;
	const form = addToCartForm;
	const submitButton = addtoCartButton ?? form.querySelector( 'button.single_add_to_cart_button' );
	const allFields = [];
	const isVariationForm = form.classList.contains( 'variations_form' );
	const defaultVariation = parseInt( form.querySelector( 'input[name="variation_id"][type="hidden"]' )?.value ?? 0 );
	const isDefaultVariationAvailable = defaultVariation > 0 && ! form.querySelector( 'button.single_add_to_cart_button' )?.classList.contains( 'wc-variation-is-unavailable' );
	let foundVariation = ! isVariationForm || isDefaultVariationAvailable;

	/**
	 * Initialize the field validation.
	 */
	function init() {
		if ( ! ( form instanceof HTMLFormElement ) || ! ( submitButton instanceof HTMLButtonElement ) ) {
			return false;
		}

		allFields.push(
			...Array.from( form.querySelectorAll( '.wpo-field' ) ).map( ( element ) => {
				const inputElements = element.querySelectorAll( getFieldInputType( element.dataset.type ) );
				const firstInput = inputElements.item( 0 );
				const inputMin = firstInput?.min ? parseInt( firstInput?.min ) : null;
				const inputMax = firstInput?.max ? parseInt( firstInput?.max ) : null;
				return {
					element,
					inputElements,
					optionId: parseInt( element?.dataset?.optionId ?? 0 ),
					minQty: element.dataset?.minQty ? parseInt( element.dataset.minQty ) : inputMin,
					maxQty: element.dataset?.maxQty ? parseInt( element.dataset.maxQty ) : inputMax,
					step: firstInput?.step ?? null,
					minChar: firstInput?.minLength ?? null,
					maxChar: firstInput?.maxLength ?? null,
				};
			} ).filter( Boolean )
		);

		form.checkFormValidity = checkFormValidity;

		bindEvents();
	}

	const getValidityCallback = ( field ) => {
		const typeValidityCallbacks = {
			checkbox: handleCheckboxLimitsValidation,
			image_buttons: handleCheckboxLimitsValidation,
			text_labels: handleCheckboxLimitsValidation,
			radio: handleRadioRequiredValidation,
			color_swatches: handleRadioRequiredValidation,
			dropdown: handleSelectRequiredValidation,
			text: checkFieldValidity,
			number: checkFieldValidity,
			customer_price: checkFieldValidity,
			textarea: checkFieldValidity,
			file_upload: handleFileUploadRequiredValidation,
			datepicker: handleDatePickerRequiredValidation,
			product: handleProductRequiredValidation,
		};

		return typeValidityCallbacks[ getFieldType( field ) ] ?? checkFieldValidity;
	};

	const formValidation = ( event ) => {
		if ( ! checkFormValidity() ) {
			event?.preventDefault?.();
		}
	};

	const emitFieldEvent = ( eventName, field ) => {
		const fieldChangeEvent = new CustomEvent( `wpo:field:${eventName}`, {
			bubbles: true,
			detail: {
				field,
			},
		} );
		form.dispatchEvent( fieldChangeEvent );
	};

	/**
	 * Bind the events.
	 */
	function bindEvents() {
		allFields.forEach( ( field ) => {
			[ 'input', 'change' ].forEach( ( event ) => {
				field.element.addEventListener( event, () => {
					emitFieldEvent( event, field );
					reportFieldValidityInHTML( field );
					submitButton.classList.toggle( 'disabled', ! checkFormValidity( false ) );
				} );
			} );

			field.inputElements.forEach( ( inputElement ) => {
				// disable html validation tooltips.
				inputElement.addEventListener( 'invalid', ( event ) => event.preventDefault() );
			} );
		} );

		// product options do not enjoy the correct behavior for radio buttons
		// because the name of each radio button in the group is different
		// so we need to manually deselect the other radio buttons when selecting a new one
		allFields
			.filter( ( field ) => field?.element?.dataset?.parentType === 'product' && field?.element?.dataset?.type === 'radio' )
			.forEach( ( field ) => {
				field.inputElements.forEach( ( inputElement ) => {
					inputElement.addEventListener( 'change', () => {
						// unchecked all other radio inputs
						field.inputElements.forEach( ( input ) => {
							input.checked = input.value === inputElement.value;
						} );
					} );
				} );
		} );

		submitButton.addEventListener( 'click', ( event ) => {
			formValidation( event );
		} );

		form.addEventListener( 'submit', ( event ) => {
			formValidation( event );
		} );

		$( form ).on( 'wc_variation_form', ( event, field ) => {
			$( form ).on( 'show_variation', ( event, variation, purchasable ) => {
				foundVariation = purchasable;
				submitButton.classList.toggle( 'disabled', ! checkFormValidity( false ) );
			} );
	
			$( form ).on( 'reset_data', () => {
				foundVariation = false;
			} );

		} );

		$( form ).on( 'found_variation', ( event, variation ) => {
			foundVariation = variation?.is_purchasable ?? false;
		} );

		const isFormInvalid = ! checkFormValidity( false );

		if ( isFormInvalid ) {
			// dispatch a `wpo:invalidForm` event
			const invalidFormEvent = new CustomEvent( 'wpo:invalidForm', {
				bubbles: true,
				detail: {
					form,
				},
			} );
			form.dispatchEvent( invalidFormEvent );
		}

		submitButton.classList.toggle( 'disabled', isFormInvalid );
	}

	/**
	 * Adds or removes inline HTML error messages to fields.
	 *
	 * @param {Object}   field
	 * @param {Function} callback
	 */
	function reportFieldValidityInHTML( field, notify = true ) {
		const callback = getValidityCallback( field );
		const firstInput = field.inputElements.item( 0 );

		if ( ! firstInput ) {
			// The field has no input elements. The validation always passes.
			return true;
		}

		if ( notify ) {
			// remove existing errors
			field.element.querySelector( '.wpo-error-message' )?.remove();
		}

		if ( ! callback( field ) ) {
			if ( notify ) {
				// create new error message element
				const errorMessage = document.createElement( 'span' );
				errorMessage.classList.add( 'wpo-error-message' );

				/**
				 * Datepicker and File Upload are hidden inputs and the validation message is not stored in the validationMessage property.
				 */
				if ( isFieldType( field, [ 'datepicker', 'file_upload' ] ) ) {
					errorMessage.textContent = firstInput?.dataset?.validationMessage ?? '';
				} else {
					errorMessage.textContent = firstInput.validationMessage;
				}
				// add to the field
				field.element.appendChild( errorMessage );
			}

			return false;
		} else {
			firstInput.required = false;

			return true;
		}
	}

	/**
	 * Checks if a WPO option is valid.
     *
	 * @param {Object} field
	 * @return {boolean} True if the field is valid.
	 */
	function checkFieldValidity( field ) {
		const firstInput = field.inputElements.item( 0 );
        // inputElements has at least one element
        // because we checked it in reportFieldValidityInHTML
        // before calling the validity check callback
        firstInput.required = isFieldRequired( field );

        return firstInput?.checkValidity();
	}

	/**
	 * Checks if all WPO options in the form are valid.
	 *
	 * @return {boolean} True if all fields are valid.
	 */
	function checkFormValidity( notify = true ) {
		// We need to check all the fields so that all error messages are shown.
		// For this reason we cannot use `every` here, as that would stop at the first invalid field.
		const isFormValid = allFields.reduce( ( allValid, field ) => {
			let isValid = false;
			if ( isFieldHidden( field ) ) {
				const firstInput = field.inputElements.item( 0 );
				if ( firstInput ) {
					firstInput.required = false;
					firstInput.setCustomValidity( '' );
				}
				isValid = true;
			} else {
				isValid = reportFieldValidityInHTML( field, notify );
			}
			return allValid && isValid
		}, true ) && foundVariation;

		if ( ! isFormValid && notify ) {
			scrollToFirstError();
		}

		// dispatch a `wpo:formValidityCheck` event
		// so that other scripts can react to the form validity check
		const formValidityEvent = new CustomEvent( 'wpo:formValidityCheck', {
			bubbles: true,
			detail: {
				isValid: isFormValid,
			},
		} );
		form.dispatchEvent( formValidityEvent );

		return isFormValid;
	}

	const scrollToFirstError = () => {
		const firstErrorElement = addToCartForm.querySelector( '.wpo-error-message' );
		const fieldContainer = firstErrorElement?.closest( '.wpo-field' );

		if ( fieldContainer ) {
			const offset = 45;
			const bodyRect = document.body.getBoundingClientRect().top;
			const elementRect = fieldContainer.getBoundingClientRect().top;
			const elementPosition = elementRect - bodyRect;
			const offsetPosition = elementPosition - offset;

			window.scrollTo( {
				top: offsetPosition,
				behavior: 'smooth',
			} );
		}
	};

	/**
	 * Handles minimum and maximum quantity for checkbox fields.
	 *
	 * @param {Object} field
	 * @param {Object} inputElement
	 */
	function handleCheckboxLimitsValidation( field, inputElement ) {
		const checkedInputs = Array.from( field.inputElements ).filter( ( input ) => input.checked );
		const firstInput = field.inputElements.item( 0 );
		const requiredQty = isFieldRequired( field ) ? 1 : 0;
		const minQty = field.minQty ? field.minQty : requiredQty;
		const maxQty = field.maxQty ? field.maxQty : 0;

		if ( ( isFieldRequired( field ) || checkedInputs.length > 0 ) && minQty && checkedInputs.length < minQty ) {
			const minValidationMessage = sprintf(
				/* translators: %d: minimum number of required options */
				_n(
					'Please select at least %d option.',
					'Please select at least %d options.',
					minQty,
					'woocommerce-product-options'
				),
				minQty
			);

			firstInput?.setCustomValidity( minValidationMessage );
			return false;
		} else if (
			( isFieldRequired( field ) || checkedInputs.length > 0 ) &&
			maxQty &&
			checkedInputs.length > maxQty
		) {
			const maxValidationMessage = sprintf(
				/* translators: %d: maximum number of required options */
				_n(
					'Please select no more than %d option.',
					'Please select no more than %d options.',
					field.maxQty,
					'woocommerce-product-options'
				),
				field.maxQty
			);

			firstInput?.setCustomValidity( maxValidationMessage );
			return false;
		} else if ( maxQty === 1 && checkedInputs.length > maxQty ) {
			// this makes the checkboxes work like a radio group
			if ( inputElement ) {
				field.inputElements.forEach( ( input ) => {
					input.checked = input.value === inputElement.value;
					input
						.closest( '.wpo-image-button' )
						?.querySelector( '.wpo-image-active' )
						?.classList.toggle( 'wpo-image-selected', input.checked );
				} );
			}

			return false;
		}

		firstInput?.setCustomValidity( '' );
		return true;
	}

	/**
	 * Custom required validation for radio groups.
	 *
	 * @param {Object} field
	 */
	function handleRadioRequiredValidation( field ) {
		const selectedInputs = Array.from( field.inputElements ).filter( ( input ) => input.checked );
		const firstInput = field.inputElements.item( 0 );

		if ( selectedInputs.length === 0 && isFieldRequired( field ) ) {
			firstInput?.setCustomValidity( __( 'Please select an option.', 'woocommerce-product-options' ) );
			firstInput.required = true;
			return false;
		}

		firstInput?.setCustomValidity( '' );
		firstInput.required = false;

		return true;
	}

	/**
	 * Custom required validation for selects.
	 *
	 * @param {Object} field
	 */
	function handleSelectRequiredValidation( field ) {
		const firstInput = field.inputElements.item( 0 );

		if ( firstInput.value.length === 0 && isFieldRequired( field ) ) {
			firstInput?.setCustomValidity( __( 'Please select an option.', 'woocommerce-product-options' ) );
			firstInput.required = true;
			return false;
		}

		firstInput?.setCustomValidity( '' );
		firstInput.required = false;

		return true;
	}

	/**
	 * Custom required validation for file upload.
	 *
	 * @param {Object} field
	 */
	function handleFileUploadRequiredValidation( field ) {
		const firstInput = field.inputElements.item( 0 );
		const fileList = JSON.parse( firstInput.value );

		if ( fileList.length < 1 && isFieldRequired( field ) ) {
			// datepickers use a hidden input to store the date value
			// so we cannot use the setCustomValidity method
			// and we need to store the validation message in the dataset
			firstInput.dataset.validationMessage = __( 'Please select a file.', 'woocommerce-product-options' );
			firstInput.required = true;
			return false;
		}

		delete firstInput.dataset.validationMessage;
		firstInput.valid = true;
		firstInput.required = false;

		return true;
	}

	/**
	 * Custom required validation for date picker.
	 *
	 * @param {Object} field
	 */
	function handleDatePickerRequiredValidation( field ) {
		const firstInput = field.inputElements.item( 0 );

		if ( firstInput.value.length === 0 && isFieldRequired( field ) ) {
			// datepickers use a hidden input to store the date value
			// so we cannot use the setCustomValidity method
			// and we need to store the validation message in the dataset
			firstInput.dataset.validationMessage = __( 'Please select a date.', 'woocommerce-product-options' );
			return false;
		}

		delete firstInput.dataset.validationMessage;
		firstInput.required = false;

		return true;
	}

	/**
	 * Custom required validation for product groups.
	 *
	 * @param {Object} field
	 * @param {Object} inputElement
	 */
	function handleProductRequiredValidation( field, inputElement ) {
		switch ( true ) {
			case isFieldType( field, 'radio' ):
				field.inputElements.forEach( ( input ) => {
					input.checked = input.value === inputElement.value;
				} );
				return handleRadioRequiredValidation( field );
			case isFieldType( field, 'dropdown' ):
				return handleSelectRequiredValidation( field );
			case isFieldType( field, 'checkbox' ):
			case isFieldType( field, 'image_buttons' ):
			default:
				return handleCheckboxLimitsValidation( field, inputElement );
		}
	}

	return { init };
};

export default fieldValidation;
