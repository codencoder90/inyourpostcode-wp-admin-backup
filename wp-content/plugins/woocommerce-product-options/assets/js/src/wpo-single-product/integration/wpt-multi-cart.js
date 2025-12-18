import { getFieldInputType, isFieldCheckboxLike, isFieldRadioLike } from '../util';

const wptMultiCart = ( addToCartForm ) => {
	const form = addToCartForm;
	const multiCartSelectedCheckbox = form.nextElementSibling.querySelector( 'input[name="product_ids[]"]' );
	let allFields = [];
	let modified = false;
	const $ = jQuery;

	const init = () => {
		if ( ! ( form instanceof HTMLFormElement ) ) {
			return false;
		}

		allFields = Array.from( form.querySelectorAll( '.wpo-field' ) ).map( ( element ) => {
			return {
				element,
				type: element.dataset?.type ?? null,
				optionId: element.dataset?.optionId ? parseInt( element.dataset.optionId ) : null,
				inputElements: element.querySelectorAll( getFieldInputType( element.dataset.type ) ),
			};
		} );

		bindEvents();
	};

	const bindEvents = () => {
		allFields.forEach( ( field ) => {
			field.inputElements.forEach( ( inputElement ) => {
				updateMultiHiddenField( inputElement.value, field );
				inputElement.addEventListener( 'change', onFieldChange );
			} );
		} );

		multiCartSelectedCheckbox.addEventListener( 'input', onMultiCartClick );
		$( form ).on( 'found_variation', onFoundVariation );
		form.addEventListener( 'wpo:formValidityCheck', onFormValidityCheck );
	};

	const onFieldChange = ( event ) => {
		const field = allFields.find( ( f ) => Array.from( f.inputElements ).includes( event.target ) );
		maybeCheckMultiCartRow();
		updateMultiHiddenField( event.target.value, field );
		form.checkValidity();
		multiCartSelectedCheckbox.checked = true;
	};

	const onMultiCartClick = ( event ) => {
		// when the multi cart checkbox is clicked, check if the form is valid
		form.checkFormValidity();
	};

	const onFoundVariation = ( event ) => {
		// when a variation is found, check if the form is valid
		form.checkFormValidity();
	}

	const onFormValidityCheck = ( event ) => {
		// when the form validity changes, update the multi cart checkbox
		if ( event?.detail?.isValid !== undefined ) {
			multiCartSelectedCheckbox.checked = multiCartSelectedCheckbox.checked && event.detail.isValid;
		}

		maybeResetModified( { target: multiCartSelectedCheckbox } );
	}

	/**
	 * Checks the multicheck row checkbox if a product option is selected.
	 */
	function maybeCheckMultiCartRow() {
		if ( ! multiCartSelectedCheckbox ) {
			return;
		}

		if ( multiCartSelectedCheckbox && ! modified ) {
			multiCartSelectedCheckbox.checked = true;
			modified = true;
		}
	}

	function maybeResetModified( event ) {
		if ( ! event.target.checked ) {
			modified = false;
		}
	}

	function updateMultiHiddenField( value, field ) {
		if ( ! field ) {
			return;
		}

		// check if we have multi cart check
		const multiCheck = form.nextElementSibling;

		if ( ! multiCheck ) {
			return;
		}

		// Find the multi-cart input which corresponds to the changed cart input
		let multiCartSelector = isFieldCheckboxLike( field )
			? `input[data-input-name="wpo-option[option-${ field.optionId }][]"]`
			: `input[data-input-name="wpo-option[option-${ field.optionId }]"]`;

		if ( field.element.dataset?.parentType === 'product' ) {
			multiCartSelector = `input[data-input-name*="wpo-option[option-${ field.optionId }]"]`;
		}

		const multiCartInput = multiCheck.querySelector( multiCartSelector );

		if ( ! multiCartInput ) {
			return;
		}

		if ( isFieldCheckboxLike( field ) || field.element.dataset?.parentType === 'product' ) {
			const checkedValues = Array.from( field.inputElements )
				.filter( ( input ) => input.checked )
				.map( ( input ) => input.value );

			multiCartInput.value = checkedValues;
		} else if ( isFieldRadioLike( field ) ) {
			const checkedValue = Array.from( field.inputElements ).find( ( input ) => input.checked );

			multiCartInput.value = checkedValue?.value;
		} else {
			multiCartInput.value = value;
		}
	}
	return { init };
};

export default wptMultiCart;
