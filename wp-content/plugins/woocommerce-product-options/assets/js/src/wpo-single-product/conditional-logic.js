import { getFieldInputType, isFieldType, isFieldCheckboxLike, isFieldRadioLike, isFieldTextLike } from './util';
import { getProductVariables } from './price-util';
import { isAfter, isBefore, isSameDay } from 'date-fns';

const conditionalLogic = function ( addToCartForm ) {
	const form = addToCartForm;
	const productId = form?.dataset?.product_id;
	const variationFormClassnames = [ 'variations_form', 'wpt_variations_form' ];
	let fieldData;
	const $ = window.jQuery;
	let productVariables = getProductVariables( form );

	function init() {
		if ( ! ( form instanceof HTMLFormElement ) ) {
			return false;
		}

		fieldData = Array.from( form.querySelectorAll( '.wpo-field' ) ).map( ( field ) => {
			return {
				element: field,
				inputElements: field.querySelectorAll( getFieldInputType( field.dataset.type ) ),
				type: field.dataset?.type,
				groupId: field.dataset?.groupId ? parseInt( field.dataset.groupId ) : null,
				optionId: field.dataset?.optionId ? parseInt( field.dataset.optionId ) : null,
				clogic: field.dataset.clogic === 'true' ? true : false,
				clogicRelation: field.dataset?.clogicRelation ?? false,
				clogicVisibility: field.dataset?.clogicVisibility ?? false,
				clogicConditions: field.dataset?.clogicConditions
					? JSON.parse( field.dataset.clogicConditions )
					: false,
			};
		} );

		bindEvents();
		checkLogic();
	}

	function bindEvents() {
		// bind the listener for input changes
		fieldData.forEach( ( field ) => field?.element.addEventListener( 'change', checkLogic ) );

		if ( variationFormClassnames.some( (className) => form.classList.contains( className ) ) ) {
			$( form ).on( 'woocommerce_variation_select_change', checkLogic );
			$( form ).on( 'reset_variations', checkLogic );
			$( form ).on( 'found_variation', updateProductVariables );
		}
	}

	/**
	 * Checks the conditional logic for the current form values.
	 */
	function updateProductVariables( event, foundVariation ) {
		const variationForm = event?.target;
		const totalsContainer = form.querySelector( '.wpo-totals-container' );

		if ( totalsContainer ) {
			totalsContainer.dataset.productPrice = parseFloat( foundVariation.display_price || 0 );
			totalsContainer.dataset.weight = parseFloat( foundVariation.weight || 0 );
			totalsContainer.dataset.width = parseFloat( foundVariation.width || 0 );
			totalsContainer.dataset.length = parseFloat( foundVariation.length || 0 );
			totalsContainer.dataset.height = parseFloat( foundVariation.height || 0 );
			productVariables = getProductVariables( variationForm );
		}

		checkLogic();
	}

	function checkLogic() {
		fieldData
            .filter( ( field ) => field.clogic && field.clogicConditions )
            .forEach( ( field ) => {
                checkForConditions( field );
	    	} );
	}

	function checkForConditions( field ) {
		const currentValues = getFormValues();
		currentValues.push( ...getAttributeValues() );
		currentValues.push( ...getShippingPropertyValues() );

        // we check for 'some' or 'every' item in the array
        // depending on the relation set in the conditional logic
        const clogicMethod = field.clogicRelation === 'or' ? 'some' : 'every';

        if ( field.clogicConditions[ clogicMethod ]( ( condition ) => checkCondition( currentValues, condition ) ) ) {
            toggleVisibility( field, true );
        } else {
            toggleVisibility( field, false );
        }
	}

	/**
	 * Check a condition against the current form values.
	 *
	 * @param {Array}  formValues
	 * @param {Object} condition
	 * @return {boolean} Whether the condition is satisfied.
	 */
	function checkCondition( formValues, condition ) {
		const field = formValues.find( ( formValue ) => String(formValue.optionId) === String(condition.optionID) );

		if ( ! field ) {
			return false;
		}

		if ( field.values.length === 1 ) {
			switch ( condition.operator ) {
				case 'contains':
					return condition.value === 'any' ? true : field.values[ 0 ] === condition.value;
				case 'not_contains':
					return condition.value === 'any' ? false : field.values[ 0 ] !== condition.value;
				case 'equals':
					return condition.value === 'any' ? true : field.values[ 0 ] === condition.value;
				case 'not_equals':
					return condition.value === 'any' ? false : field.values[ 0 ] !== condition.value;
				case 'greater':
					return parseFloat( field.values[ 0 ] ) > parseFloat( condition.value );
				case 'less':
					return parseFloat( field.values[ 0 ] ) < parseFloat( condition.value );
				case 'not_empty':
					return field.values[ 0 ].length > 0;
				case 'empty':
					return field.values[ 0 ].length === 0;
				case 'date_greater':
					return isAfter( new Date( field.values[ 0 ] ), new Date( condition.value ) );
				case 'date_less':
					return isBefore( new Date( field.values[ 0 ] ), new Date( condition.value ) );
				case 'date_equals':
					return isSameDay( new Date( field.values[ 0 ] ), new Date( condition.value ) );
				case 'date_not_equals':
					return ! isSameDay( new Date( field.values[ 0 ] ), new Date( condition.value ) );
			}
		} else {
			switch ( condition.operator ) {
				case 'contains':
					return condition.value === 'any' && field.values.length > 0 ? true : field.values.includes( condition.value );
				case 'not_contains':
					return condition.value === 'any' ? field.values.length === 0 : ! field.values.includes( condition.value );
				case 'equals':
					return condition.value === 'any' && field.values.length > 0 ? true : field.values.includes( condition.value );
				case 'not_equals':
					return condition.value === 'any' ? field.values.length === 0 : ! field.values.includes( condition.value );
				case 'empty':
					return field.values.length === 0;
				case 'not_empty':
					return field.values.length > 0;
			}
		}

		return false;
	}

	/**
	 * Toggles field visibility based on the provided boolean.
	 *
	 * @param {Object}  field
	 * @param {boolean} passing
	 */
	function toggleVisibility( field, passing ) {
		if ( passing ) {
			if ( field.clogicVisibility === 'show' ) {
				field.element.classList.remove( 'wpo-field-hide' );
			}

			if ( field.clogicVisibility === 'hide' ) {
				field.element.classList.add( 'wpo-field-hide' );
			}
		} else {
			if ( field.clogicVisibility === 'show' ) {
				field.element.classList.add( 'wpo-field-hide' );
			}

			if ( field.clogicVisibility === 'hide' ) {
				field.element.classList.remove( 'wpo-field-hide' );
			}
		}

		form.dispatchEvent( new Event( 'wpo_run_frontend_calculation' ) );
	}

	/**
	 * Get the current input values for all fields.
	 *
	 * @return {Array} An array of objects containing the field option ID and values.
	 */
	function getFormValues() {
		const formValues = [];
		const visibleFields = fieldData.filter( ( field ) => ! field.element.classList.contains( 'wpo-field-hide' ) );

		visibleFields.forEach( ( field ) => {
			const { optionId } = field;
			const values = getInputValues( field );

			formValues.push( { optionId, values: [ ...values ] } );
		} );

		return formValues;
	}

	function getAttributeValues() {
		let variationSelects = Array.from( form.querySelectorAll( '.variations select' ) );

		variationSelects = variationSelects.map( ( select ) => {
			const re = new RegExp( `_${productId}$`, 'g' );
			return {
				optionId: select.id.replace( re, '' ),
				values: [ select.value ],
			};
		} ).filter( ( attribute ) => attribute.values[ 0 ] !== '' );

		const dataProductAttributes = form.querySelector( '.wpo-options-container' )?.dataset?.productAttributes;
		let productAttributes = Object.entries( JSON.parse( dataProductAttributes ?? '{}' ) );

		productAttributes = productAttributes.map( ( attribute ) => {
			return {
				optionId: attribute[ 0 ],
				values: attribute[ 1 ],
			};
		} );

		return [
			...variationSelects,
			...productAttributes,
		];
	}

	function getShippingPropertyValues() {
		return Object.keys( productVariables ).map( ( key ) => {
			return { optionId: `product_${key}`, values: [ productVariables[ key ] ] };
		} );
	}

	/**
	 * Get the current input values for a field.
	 *
	 * @param {Object} field
	 * @return {Array} An array of values.
	 */
	function getInputValues( field ) {
		let inputElements = false;

		if ( isFieldCheckboxLike( field ) ) {
			inputElements = field.element.querySelectorAll( 'input[type="checkbox"]' );
		}

		if ( isFieldRadioLike( field ) ) {
			inputElements = field.element.querySelectorAll( 'input[type="radio"]' );
		}

		if ( isFieldType( field, 'dropdown' ) ) {
			inputElements = field.element.querySelector( 'select' );
		}

		if ( isFieldType( field, [ 'text', 'datepicker', 'file_upload', 'customer_price', 'number' ] ) ) {
			inputElements = field.element.querySelector( 'input' );
		}

		if ( isFieldType( field, 'textarea' ) ) {
			inputElements = field.element.querySelector( 'textarea' );
		}

		let values = [];

		if ( 'file_upload' === field.type ) {
			values = JSON.parse( inputElements.value );
		} else {
			if ( inputElements instanceof NodeList ) {
				inputElements = Array.from( inputElements );
			} else {
				inputElements = [ inputElements ];
			}

			values = inputElements.map( ( inputElement ) => {
				if ( isFieldCheckboxLike( field ) || isFieldRadioLike( field ) ) {
					return inputElement.checked ? inputElement.value : '';
				}

				return inputElement.value;
			} );
		}

		return values.filter( Boolean );
	}

	return { init };
};

export default conditionalLogic;
