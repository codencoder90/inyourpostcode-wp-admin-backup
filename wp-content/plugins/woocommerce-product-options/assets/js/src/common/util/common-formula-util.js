import { __, sprintf } from '@wordpress/i18n';
// eslint-disable-next-line import/no-extraneous-dependencies
import Formula from 'fparser';
import { sanitize } from './util';

export const getDefaultParsedFormula = ( defaultFormula = {} ) => {
	return {
		validationError: false,
		variables: [],
		expression: '',
		...defaultFormula,
	};
};

export const expandFormulaVariables = ( variables ) => {
	return variables.map( ( variable, index ) => {
		for ( let i = index - 1; i >= 0; i-- ) {
			const regExp = new RegExp( `\\\[${ variables[ i ].name }\\\]`, 'gi' );
			variable = {
				...variable,
				formula: variable.formula.replace( regExp, `(${ variables[ i ].formula })` ),
			};
		}

		return variable;
	} );
};

export const compareVariableName = ( variable1, variable2 ) => {
	return sanitize( variable1.toLowerCase() ) === sanitize( variable2.toLowerCase() );
};

export const extractVariables = ( formula, customVariables ) => {
	// matches variables in user formula including [ and ]
	const regExp = /\[([^\]]+)\]/g;
	let matches = formula.match( regExp );
	matches = [
		...( matches || [] ),
		...( customVariables?.length > 0
			? customVariables.reduce(
			( customVars, customVar ) => [ ...customVars, ...( customVar.formula.match( regExp ) || [] ) ],
			[]
		)
		: [] ),
	];

	// remove duplicate variables
	const uniqueMatches = matches?.filter( ( match, index ) => matches.indexOf( match ) === index );

	return uniqueMatches ?? [];
};

export const parsePriceFormula = ( formula, options, customFormulaVariables ) => {
	const newParsedFormula = getDefaultParsedFormula();
	const formulaOption = options.find( ( option ) => option.type === 'price_formula' && option?.settings?.formula?.formula === formula );

	if ( ! formulaOption ) {
		return null;
	}

	const availableVariables = extractVariables( formula, customFormulaVariables ).map( ( variable ) => {
		variable = variable.replace( /[\[\]]/g, '' );
		const tokens = variable.split( '.' );
		const option = options.find( ( option ) => compareVariableName( option.name, tokens[0] ) );
		const customVariable = customFormulaVariables.findIndex( ( customVariable ) => customVariable.name === variable );
		let variableName = option ? `var${ option?.id }` : `cVar${ customVariable }`

		if ( variable.startsWith( 'product_' ) ) {
			return {
				variableName: variable,
			};
		}

		switch ( tokens.length ) {
			case 2:
				variableName += `.${tokens[ 1 ]}`;
				break;
			case 4:
				const index = option?.choices?.findIndex( ( choice ) => compareVariableName( choice.label, tokens[2] ) );
				variableName += `.choices.choice${index}.${tokens[ 3 ]}`;
				break;
		}

		if ( ! option && customVariable === -1 ) {
			return null;
		}

		return {
			name: variable,
			variableName,
		};
	} ).filter( Boolean );

	let expandedFormula = formula?.toLowerCase?.();
	expandFormulaVariables( customFormulaVariables || [] ).forEach( ( variable ) => {
		expandedFormula = expandedFormula.replaceAll( `[${ variable.name?.toLowerCase?.() }]`, `(${ variable.formula })` ).toLowerCase();
	} );

	availableVariables.forEach( ( variable ) => {
		expandedFormula = expandedFormula.replaceAll( `[${ variable.name?.toLowerCase?.() }]`, `[${ variable.variableName }]` );
	} );

	runCustomFormulaValidation( expandedFormula );

	const parser = new Formula( expandedFormula );
	const variables = parser.getVariables();

	if ( variables.length > 0 ) {
		const missingVariables = variables.filter( ( variable ) => {
			return ! availableVariables.find( ( availableVariable ) => availableVariable.variableName === variable );
		} );
		if ( missingVariables.length === 0 ) {
			// retrieve the value references for each variable
			const formattedVariables = variables.map( ( variable ) => {
				const productVariable = productVariables.find( ( productVar ) => productVar.id === variable );

				if ( productVariable ) {
					return {
						name: variable,
						id: productVariable.id,
						type: 'product',
					};
				}

				if ( Number.isInteger( parseInt( variable.split( '' )[ 0 ] ) ) ) {
					throw new Error(
						sprintf(
							// translators: %s is the variable name
							__(
								'Variable names cannot start with a digit: please change the name of option [%s].',
								'woocommerce-product-options'
							),
							variable
						)
					);
				}

				const variableName = variable?.split( '.' )[ 0 ];

				let optionVariable = options.find( ( option ) => {
					return variableName === `var${ option.id }`;
				} );

				if ( ! optionVariable ) {
					const customVariable = customFormulaVariables.find( ( customVariable, index ) => {
						return variableName === `cVar${ index }`;
					} );

					if ( customVariable ) {
						return {
							name: customVariable.name,
							type: 'custom_variable',
						};
					}
				}

				if ( ! optionVariable ) {
					throw new Error(
						sprintf(
							// translators: %1$s is the variable name, %2$s is the name of the formula option
							__(
								'Variable [%1$s] does not correspond to any option in this group. Please check the formula%2$s.',
								'woocommerce-product-options'
							),
							variable,
							` in '${formulaOption.name}'`
						)
					);
				}

				const variableType = optionVariable.type + '_option';
				let valueType = 'scalar';

				if (
					[ 'checkbox', 'images', 'text_labels', 'radio', 'dropdown', 'color_swatches' ].includes(
						optionVariable.type
					)
				) {
					valueType = 'array';
				}

				let optionVariableName = availableVariables.find( ( availableVariable ) => availableVariable.variableName === variable )?.name;
				
				return {
					id: optionVariable.id,
					name: optionVariableName,
					var: variable,
					type: variableType,
					valueType,
				};
			} );

			newParsedFormula.variables = formattedVariables;
			newParsedFormula.expression = parser.getExpressionString();
		} else {
			throw new Error(
				sprintf(
					// translators: %s is the missing variable name
					__(
						'The formula "%s" contains variables that do not correspond to any options or custom variables: %s.',
						'woocommerce-product-options'
					),
					formulaOption?.name,
					missingVariables.map( ( variable ) => variable.split('.')[0] ).join( ', ' )
				)
			);
		}
	} else {
		newParsedFormula.expression = parser.getExpressionString();
	}

	return newParsedFormula;
};

/**
 * Custom validation for formula
 *
 * We check for special cases and throw an error
 * if we stumble upon anything that is not allowed.
 *
 * @param {string} formula The formula to validate.
 */
export const runCustomFormulaValidation = ( formula ) => {
	// The `pow()` requires two arguments.
	if ( formula.match( /pow\([^,\)]+,*\)/ ) ) {
		throw new Error(
			__(
				'The `pow()` function requires two arguments: the base and the exponent.',
				'woocommerce-product-options'
			)
		);
	}
}

export const adjustPriceFormulas = ( group ) => {
	const newGroup = { ...group };

	if ( newGroup.options ) {
		newGroup.options = newGroup.options.map( ( option ) => {
			if ( option.type === 'price_formula' ) {
				option.settings.formula = {
					...( option?.settings?.formula ?? {} ),
					...parsePriceFormula(
						option.settings.formula.formula,
						newGroup.options,
						option.settings.formula.customVariables
					),
				};
			}

			return option;
		} );
	}

	return newGroup;
};

export const productVariables = [
	{
		name: __( 'Price', 'woocommerce-product-options' ),
		id: 'product_price',
		type: 'product',
	},
	{
		name: __( 'Quantity in cart', 'woocommerce-product-options' ),
		id: 'product_quantity',
		type: 'product',
	},
	{
		name: __( 'Weight', 'woocommerce-product-options' ),
		id: 'product_weight',
		type: 'product',
	},
	{
		name: __( 'Width', 'woocommerce-product-options' ),
		id: 'product_width',
		type: 'product',
	},
	{
		name: __( 'Length', 'woocommerce-product-options' ),
		id: 'product_length',
		type: 'product',
	},
	{
		name: __( 'Height', 'woocommerce-product-options' ),
		id: 'product_height',
		type: 'product',
	},
];

export const availableOperators = [
	{
		label: __( '+', 'woocommerce-product-options' ),
		value: '+',
	},
	{
		label: __( '-', 'woocommerce-product-options' ),
		value: '-',
	},
	{
		label: __( '*', 'woocommerce-product-options' ),
		value: '*',
	},
	{
		label: __( '/', 'woocommerce-product-options' ),
		value: '/',
	},
	{
		label: __( '(', 'woocommerce-product-options' ),
		value: '(',
	},
	{
		label: __( ')', 'woocommerce-product-options' ),
		value: ')',
	},
	{
		label: __( '<', 'woocommerce-product-options' ),
		value: '<',
	},
	{
		label: __( '>', 'woocommerce-product-options' ),
		value: '>',
	},
	{
		label: __( '<=', 'woocommerce-product-options' ),
		value: '<=',
	},
	{
		label: __( '>=', 'woocommerce-product-options' ),
		value: '>=',
	},
	{
		label: __( '=', 'woocommerce-product-options' ),
		value: '=',
	},
	{
		label: __( '!=', 'woocommerce-product-options' ),
		value: '!=',
	},
];

export const usedMathFunctions = [ 'abs', 'min', 'max', 'ceil', 'floor', 'round', 'sqrt', 'trunc', 'sign', 'pow' ];
