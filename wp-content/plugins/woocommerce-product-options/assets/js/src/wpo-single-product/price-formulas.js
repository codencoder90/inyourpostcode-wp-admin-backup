import { getProductVariables, hasTaxConflicts } from './price-util';
import { getFieldInputType } from './util';
import { differenceInCalendarDays } from 'date-fns';
import { expandFormulaVariables } from '../common/util/common-formula-util';
import { getLogicalFunctions, getCustomFunctions, lCaseFunctionNames } from '../common/util/user-defined-functions';

/**
 * External dependencies
 */

import Formula from 'fparser';

/**
 * Process the variable found in a formula
 *
 * The variable object contains the following properties:
 * - id: The option ID
 * - name: The option name
 * - var: The variable name
 * - type: The option type
 *
 * If the variable doesn't have a var property, the name property is used instead
 * 
 * @param {Object} variable The variable object
 * @param {Element} form The form element
 * @returns {Object} The processed variable
 */
export const processFormulaVariable = ( variable, form ) => {
	// Use the name property if the var property is not set
	variable.var = variable.var || variable.name;

	const variableName = variable.var.split( '.' )[ 0 ].toLowerCase();
	const inputField = form.querySelector( `.wpo-field[data-option-id="${ variable.id }"]` );
	const isFieldHidden = inputField?.classList.contains( 'wpo-field-hide' );
	const productVariables = getProductVariables( form );

	const evaluateFieldValue = ( value ) => {
		if ( isFieldHidden ) {
			return 0;
		}

		return value ?? 0;
	};

	const optionType = variable.type.replace( '_option', '' );
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	let inputType = getFieldInputType( optionType );
	if ( inputType === 'select' ) {
		inputType = 'option';
	}

	switch ( variable.type ) {
		case 'number_option':
		case 'customer_price_option':
			const numberInput = inputField?.querySelector( 'input' );

			return { [ variableName ]: parseFloat( numberInput?.value ?? 0 ) };

		case 'file_upload_option':
			const fileInput = inputField?.querySelector( 'input' );
			const files = JSON.parse( fileInput.value );

			return {
				[ variableName ]: {
					count: evaluateFieldValue( files?.length ?? 0 ),
				},
			};

		case 'checkbox_option':
		case 'radio_option':
		case 'dropdown_option':
		case 'images_option':
		case 'color_swatches_option':
		case 'text_labels_option':
			const selectedInputType = `${ inputType }:checked`;
			const choiceElements = inputField?.querySelectorAll( inputType );
			const selectedChoices = Array.from( inputField?.querySelectorAll( selectedInputType ) )?.filter( ( element ) => element.value );
			const selectedChoiceCount = selectedChoices?.length ?? 0;
			const selectedFormulaValues = Array.from( selectedChoices )?.filter( ( element ) => element?.dataset?.formulaValue );
			const selectedChoiceMax = Array.from( selectedFormulaValues )
				.reduce(
					( max, element ) => Math.max( max, parseFloat( element.dataset.formulaValue ) ),
					selectedFormulaValues.length > 0 ? -Infinity : 0
				);
			const selectedChoiceMin = Array.from( selectedFormulaValues )
				.reduce(
					( min, element ) => Math.min( min, parseFloat( element.dataset.formulaValue ) ),
					selectedFormulaValues.length > 0 ? Infinity : 0
				);
			const selectedChoiceSum = Array.from( selectedFormulaValues )
				.reduce(
					( sum, element ) => sum + parseFloat( element.dataset.formulaValue ),
					0
				);
			const choiceNone = selectedChoiceCount === 0;
			const choiceAny = selectedChoiceCount > 0;
			const choiceAll = selectedChoiceCount === choiceElements.length;
			const choiceVariable = {};
			choiceVariable.choices = {};
			choiceElements.forEach( ( element, index ) => {
				if ( ! element.value ) {
					return;
				}

				index = element.dataset?.index || index;

				const isChecked = inputType === 'option' ? element.selected : element.checked;
				choiceVariable.choices[ `choice${index}` ] = {
					checked: isChecked ? evaluateFieldValue( 1 ) : 0,
					value: isChecked ? evaluateFieldValue( parseFloat( element.dataset?.formulaValue || 0 ) ) : 0,
				};
			} );

			return {
				[ variableName ]: {
					...choiceVariable,
					// the following properties are available only when multiple choices are allowed
					none: choiceNone ? evaluateFieldValue( 1 ) : 0,
					any: choiceAny ? evaluateFieldValue( 1 ) : 0,
					all: choiceAll ? evaluateFieldValue( 1 ) : 0,
					count: evaluateFieldValue( selectedChoiceCount ),
					min: evaluateFieldValue( selectedChoiceMin ),
					max: evaluateFieldValue( selectedChoiceMax ),
					sum: evaluateFieldValue( selectedChoiceSum ),

					// the following properties are available only when a single choice is allowed
					selected: choiceAny ? evaluateFieldValue( 1 ) : 0,
					value: evaluateFieldValue(
						parseFloat( inputField.querySelector( selectedInputType )?.dataset?.formulaValue || 0 )
					),
				},
			};

		case 'text_option':
		case 'textarea_option':
			const textInput = inputField?.querySelector?.( optionType === 'text' ? 'input' : 'textarea' );
			const textValue = textInput?.value?.trim?.() ?? '';
			const basicProps = {
				characters: evaluateFieldValue( textValue.replace( /[\n\r ]/gi, ' ' ).replace( / +/gi, ' ' ).trim().length ),
				words: evaluateFieldValue( textValue.replace( /[\n\r ]/gi, ' ' ).replace( / +/gi, ' ' ).trim().split( ' ' ).filter( Boolean ).length ),
			}

			if ( optionType === 'textarea' ) {
				basicProps.lines = evaluateFieldValue( textValue.split( '\n' ).filter( Boolean ).length );
			}

			return { [ variableName ]: basicProps };

		case 'price_formula_option':
			return { [ variableName ]: evaluateFieldValue( parseFloat( inputField.dataset.optionPrice ) ) };

		case 'datepicker_option':
			const dateInput = inputField?.querySelector( 'input' );
			const dateProps = {
				daycount: evaluateFieldValue(
					differenceInCalendarDays( new Date( dateInput?.value ), new Date() )
				),
				weekday: evaluateFieldValue( ( 7 + new Date( dateInput?.value ).getDay() - wpoSettings.start_of_week ) % 7 + 1 ),
				day: evaluateFieldValue( new Date( dateInput?.value ).getDate() ),
				month: evaluateFieldValue( new Date( dateInput?.value ).getMonth() + 1 ),
				year: evaluateFieldValue( new Date( dateInput?.value ).getFullYear() ),
			};

			return { [ variableName ]: dateProps };

		case 'product_option':
			inputType = getFieldInputType( inputField?.dataset?.type );

			if ( inputType === 'select' ) {
				inputType = 'option';
			}

			const selectedProductType = `${ inputType }:checked`;
			const productElements = Array.from( inputField?.querySelectorAll( inputType ) )?.filter( ( element ) => element.value );
			const selectedProducts = Array.from( inputField?.querySelectorAll( selectedProductType ) )?.filter( ( element ) => element.value );
			const selectedProductCount = selectedProducts?.length ?? 0;

			const productVariable = {
				// the following properties are available only when multiple choices are allowed
				none: selectedProductCount === 0 ? evaluateFieldValue( 1 ) : 0,
				any: selectedProductCount > 0 ? evaluateFieldValue( 1 ) : 0,
				all: selectedProductCount === productElements.length ? evaluateFieldValue( 1 ) : 0,
				count: evaluateFieldValue( selectedProductCount ),
				min: evaluateFieldValue( Array.from( selectedProducts ).reduce(
					( min, element ) => Math.min( min, parseFloat( element.dataset.priceAmount ) ),
					selectedProductCount > 0 ? Infinity : 0
				) ),
				max: evaluateFieldValue( Array.from( selectedProducts ).reduce(
					( max, element ) => Math.max( max, parseFloat( element.dataset.priceAmount ) ),
					0
				) ),
				total: evaluateFieldValue( Array.from( selectedProducts ).reduce(
					( sum, element ) => sum + parseFloat( element.dataset.priceAmount ),
					0
				) ),

				// the following properties are available only when a single choice is allowed
				selected: selectedProductCount > 0 ? evaluateFieldValue( 1 ) : 0,
				price: evaluateFieldValue( Array.from( selectedProducts ).reduce(
					( sum, element ) => sum + parseFloat( element.dataset.priceAmount ),
					0
				) ),
			};

			return { [ variableName ]: productVariable };

		case 'product':
			switch ( variableName ) {
				case 'product_price':
					return { product_price: parseFloat( productVariables.price || 0 ) };
				case 'product_quantity':
					return { product_quantity: parseInt( productVariables.quantity || 0 ) };
				case 'product_weight':
					return { product_weight: parseFloat( productVariables.weight || 0 ) };
				case 'product_width':
					return { product_width: parseFloat( productVariables.width || 0 ) };
				case 'product_length':
					return { product_length: parseFloat( productVariables.length || 0 ) };
				case 'product_height':
					return { product_height: parseFloat( productVariables.height || 0 ) };
				default:
					return {};
			}

		default:
			return {};
	}
};

/**
 * 
 * @param {Object} field The field object
 * @returns {null|number|Object} The result of the formula calculation
 */
export const evaluateFormula = ( field ) => {
	// If the field is hidden, don't run the calculation
	if ( field.element.classList.contains( 'wpo-field-hide' ) ) {
		return;
	}

	const form = field.element.closest( 'form' );

	// Update the formula by expanding every custom variable

	field.formula = field.formula?.toLowerCase();
	const customVariables = expandFormulaVariables( field.customFormulaVariables || [] );
	customVariables.forEach( ( variable ) => {
		field.formula = field.formula.replaceAll( `[${ variable.name?.toLowerCase() }]`, `(${ variable.formula.toLowerCase() })` );
	} );

	field.formulaVariables.forEach( ( variable ) => {
		variable.var = variable.var || variable.name;
		field.formula = field.formula.replaceAll( `[${ variable.name?.toLowerCase() }]`, `[${ variable.var }]` );
	} );

	// create the parser with the expanded formula
	let parser;

	try {
		parser = new Formula( field.formula.toLowerCase() );
	} catch ( e ) {
		return;
	}

	const variables = parser.getVariables();

	// validate the variables in the formula against the available options and custom variables
	const validVariables = variables.filter( ( variable ) => {
		return (
			field.formulaVariables.findIndex( ( structuredVar ) => {
				structuredVar.var = structuredVar.var || structuredVar.name;
				return structuredVar.var.split( '.' )[ 0 ].toLowerCase() === variable.split( '.' )[ 0 ].toLowerCase();
			} ) > -1 ||
			field.customFormulaVariables.findIndex( ( customVar ) => {
				return customVar.name.toLowerCase() === variable.toLowerCase();
			} ) > -1
		);
	} );

	// If any of the variables used in the formula are not available, we cannot run the calculation
	const missingVariables = variables.filter( ( variable ) => {
		return ! validVariables.find(
			( availableVariable ) =>
				availableVariable.split( '.' )[ 0 ].toLowerCase() === variable.split( '.' )[ 0 ].toLowerCase()
		);
	} );

	if ( missingVariables.length > 0 ) {
		return;
	}

	// Populate the variable object for the parser with the values from all the options
	// The formulaVariables object contains all the options use by the formula,
	// including the ones used in the custom variables
	const fparseVariableObject = field.formulaVariables.reduce( ( pVariables, pVariable ) => {
		return { ...pVariables, ...processFormulaVariable( pVariable, form ) };
	}, {} );

	if ( hasTaxConflicts() ) {
		// if the tax settings are conflicting, we can't run the formula
		// so we return an object with the optionId and the variables
		// and we'll use to calculate the formula on the server side
		return {
			option_id: field.optionId,
			variables: fparseVariableObject,
		};
	}

	const formulaParams = {
		...fparseVariableObject,
		...lCaseFunctionNames( getLogicalFunctions( form ) ),
		...lCaseFunctionNames( getCustomFunctions( form ) ),
	};

	const result = parser.evaluate( formulaParams );

	if ( ! isNaN( result ) ) {
		return {
			field,
			price: result,
		};
	}
}
