export const getFieldType = ( field ) => {
	let type = field;

	if ( typeof type === 'string' ) {
		return type;
	}

	type = field?.type;

	if ( typeof type === 'string' ) {
		return type;
	}

	type = field?.dataset?.type;

	if ( typeof type === 'string' ) {
		return type;
	}

	type = field?.element?.dataset?.type;

	if ( typeof type === 'string' ) {
		return type;
	}

	return null;
};

/**
 *
 * @param {Object | string} field
 * @param {Array | string}  types
 *
 * @return {boolean} The result of the check
 */
export const isFieldType = ( field, types ) => {
	const type = getFieldType( field );

	if ( Array.isArray( types ) ) {
		return types.includes( type );
	}

	if ( typeof types === 'string' ) {
		return type === types;
	}

	return false;
};

export const isFieldCheckboxLike = ( field ) => {
	return isFieldType( field, [ 'checkbox', 'image_buttons', 'text_labels' ] );
};

export const isFieldRadioLike = ( field ) => {
	return isFieldType( field, [ 'radio', 'color_swatches' ] );
};

export const isFieldMultiChoice = ( field ) => {
	return isFieldCheckboxLike( field ) || isFieldRadioLike( field );
};

export const isFieldTextLike = ( field ) => {
	return isFieldType( field, [ 'text', 'textarea', 'customer_price' ] );
};

export const isFieldHidden = ( field ) => {
	return field?.element?.classList?.contains( 'wpo-field-hide' );
};

export const isFieldRequired = ( field ) => {
	return field.element.classList.contains( 'wpo-field-required' ) && ! isFieldHidden( field );
};

export const hasSingleValue = ( field ) => {
	return isFieldRadioLike( field ) || field?.element?.dataset?.maxQty === '1';
};

/**
 * Retrieves the input type for a field.
 *
 * @param {string} field
 * @return {string} The input type
 */
export const getFieldInputType = ( field ) => {
	switch ( true ) {
		case isFieldType( field, 'textarea' ):
			return 'textarea';
		case isFieldType( field, 'dropdown' ):
			return 'select';
		default:
			return 'input';
	}
};

export const getAllFields = ( form, selector = '.wpo-field' ) => {
	return Array.from( form.querySelectorAll( selector ) )
		.map( ( element ) => {
			const inputElements = element.querySelectorAll( getFieldInputType( element.dataset.type ) );
			const firstInput = inputElements.item( 0 );
			return {
				element,
				inputElements,
				optionId: parseInt( element?.dataset?.optionId ?? 0 ),
				minQty: element.dataset?.minQty ? parseInt( element.dataset.minQty ) : null,
				maxQty: element.dataset?.maxQty ? parseInt( element.dataset.maxQty ) : null,
				minChar: firstInput?.minLength ?? null,
				maxChar: firstInput?.maxLength ?? null,
			};
		} )
		.filter( Boolean );
};
