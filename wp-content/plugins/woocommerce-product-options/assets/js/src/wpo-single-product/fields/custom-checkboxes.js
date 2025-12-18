const customCheckboxes = () => {
	let checkBoxFields;

	function init() {
		checkBoxFields = Array.from(
			document.querySelectorAll( '.wpo-field-images, .wpo-field-checkbox, .wpo-field-text_labels, .wpo-field-product[data-type="checkbox"], .wpo-field-product[data-type="image_buttons"]' )
		).map( ( element ) => {
			return {
				element,
				inputElements: element.querySelectorAll( 'input[type="checkbox"]' ),
				minQty: element.dataset?.maxQty ? parseInt( element.dataset.minQty ) : null,
				maxQty: element.dataset?.maxQty ? parseInt( element.dataset.maxQty ) : null,
			};
		} );

		bindEvents();
	}

	function bindEvents() {
		checkBoxFields
			.filter( ( field ) => field.maxQty )
			.forEach( ( field ) => {
				field.inputElements.forEach( ( inputElement ) => {
					inputElement.addEventListener( 'change', ( e ) => {
						handleCheckboxSelectionLimits( e, field );
					} );
				} );
			} );
	}

	function handleCheckboxSelectionLimits( e, field ) {
		const checkedInputs = Array.from( field.inputElements ).filter( ( input ) => input.checked );

		if ( field.maxQty === 1 && checkedInputs.length > field.maxQty ) {
			checkedInputs
				.filter( ( input ) => input !== e.srcElement )
				.forEach( ( input ) => {
					input.checked = false;
					input.dispatchEvent( new Event( 'change' ) );
				} );
		}
	}

	return { init };
};

export default customCheckboxes();
