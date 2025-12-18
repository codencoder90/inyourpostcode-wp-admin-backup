/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import { Dashicon } from '@wordpress/components';

// eslint-disable-next-line import/no-extraneous-dependencies
import CustomVariableRepeater from './custom-variable-repeater';

/**
 * External dependencies.
 */
import { Button } from '@barn2plugins/components';
import ButtonDropdown from '../button-dropdown';
import FormulaVariableButton from './formula-variable-button';
import { getLogicalFunctions, getCustomFunctions } from '../../../../common/util/user-defined-functions';
import {
	getDefaultParsedFormula,
	parsePriceFormula,
	productVariables,
	usedMathFunctions,
	availableOperators,
} from '../../../../common/util/common-formula-util';
import { sanitize } from '../../../../common/util/util';

const PriceFormula = ( { formMethods, index, onChange = () => {}, value } ) => {
	const valueFormula = value?.formula  || '';
	const [ formula, setFormula ] = useState( valueFormula );
	const [ isAutoFix, setIsAutoFix ] = useState( false );
	const [ parsedFormula, setParsedFormula ] = useState( getDefaultParsedFormula() );
	const [ variables, setVariables ] = useState( value?.variables || [] );
	const [ customFormulaVariables, setCustomFormulaVariables ] = useState( value?.customVariables || [] );
	const [ focusedFormula, setFocusedFormula ] = useState( document.querySelector( '.wpo-price-formula-textarea-wrap textarea' ) );
	const formulaRef = useRef( null );

	/**
	 * Track the cursor position.
	 */
	const [ cursor, setCursor ] = useState( null );

	/**
	 * Track the selection range.
	 */
	const [ selection, setSelection ] = useState( null );

	const watchOptionsField = formMethods.watch( 'options' );

	const hasDirtyFields = watchOptionsField?.some( ( option ) => {
		return option.id === 0;
	} );

	const updateCustomVariable = ( variable, start, end = null ) => {
		if ( end === null ) {
			end = start;
		}

		const variableListItem = focusedFormula?.closest( 'tr' );
		const variableList = variableListItem?.closest( 'table tbody' );
		const focusedIndex = Array.from( variableList.children ).indexOf( variableListItem );

		const modifiedVariable = customFormulaVariables[ focusedIndex ];

		modifiedVariable.formula = `${ modifiedVariable?.formula
			?.slice( 0, start )
			.trim() } ${ variable } ${ modifiedVariable?.formula?.slice( start ).trim() }`;

		modifiedVariable.formula = modifiedVariable.formula.trim();

		const newCustomVariables = [ ...customFormulaVariables ];
		newCustomVariables[ focusedIndex ] = modifiedVariable;
		setCustomFormulaVariables( newCustomVariables );

		setCursor( start + variable.length + 2 );
	};

	/**
	 * Insert a variable or operator into the formula.
	 *
	 * @param {string} variable
	 */
	const insertVariable = ( variable ) => {
		let isMainFormula = focusedFormula?.matches( '.wpo-price-formula-textarea-wrap textarea' );

		if ( ! focusedFormula ) {
			setFocusedFormula( document.querySelector( '.wpo-price-formula-textarea-wrap textarea' ) );
			isMainFormula = true;
		}

		let start, end;

		if ( cursor !== null ) {
			start = cursor;
			end = cursor;
		} else if ( selection !== null ) {
			start = selection.start;
			end = selection.end;
		} else if ( isMainFormula ) {
			setFormula( `${ formula.trim() } ${ variable }` );
			focusedFormula?.focus();
			return;
		} else {
			updateCustomVariable( variable, null );
			focusedFormula?.focus();
			return;
		}

		if ( isMainFormula ) {
			const newFormula = `${ formula.slice( 0, start ).trim() } ${ variable } ${ formula.slice( end ).trim() }`;
			setFormula( newFormula.trim() );
			setCursor( Math.min( newFormula.length, start + variable.length + 2 ) );
		} else if ( focusedFormula !== false ) {
			updateCustomVariable( variable, start, end );
		}

		focusedFormula?.focus();
	};

	const onFocusedFormula = ( event ) => {
		if ( event.target !== focusedFormula ) {
			setFocusedFormula( event.target );
		}
	};

	/**
	 * Validate the formula and save any variables used.
	 */
	const validateFormula = () => {
		try {
			if ( formula.length === 0 ) {
				setParsedFormula( getDefaultParsedFormula() );
				return;
			}

			let fixedFormula = autoFixFormula( formula );

			// // replace spaces with underscores in variable names
			// // this is necessary to convert formulas from 1.x to 2.0
			// fixedFormula = fixedFormula.replace( /\[([^\]]+)\]/g, ( match, variable ) => {
			// 	return `[${ variable.replace( /\s/g, '_' ) }]`;
			// } );

			if ( fixedFormula !== formula ) {
				setIsAutoFix( true );
				setFormula( fixedFormula );
			}

			const newParsedFormula = parsePriceFormula( fixedFormula, watchOptionsField, customFormulaVariables );
			setParsedFormula( newParsedFormula ?? { formula: fixedFormula } );
		} catch ( error ) {
			if ( [ 'No expression given!', 'Could not parse formula: Syntax error.' ].includes( error?.message ) ) {
				error.message = __(
					'The formula is not complete or contains a syntax error.',
					'woocommerce-product-options'
				);
			}

			setParsedFormula(
				getDefaultParsedFormula( {
					validationError: error?.message || __( 'Invalid formula', 'woocommerce-product-options' ),
				} )
			);
		}
	};

	const autoFixFormula = ( formula ) => {
		let newCustomVariables = customFormulaVariables;
		const newVariables = variables.map( ( variable ) => {
			const option = watchOptionsField.find( ( option ) => option.id === variable.id );
			if ( ! option ) {
				return variable;
			}
			const tokens = variable.name.split( '.' );

			if ( tokens[0] !== sanitize( option.name ) ) {
				const vRegExp = new RegExp(`\\[(${tokens[0]})(\\]|\\.)(.*)$`, 'gi')
				variable.name = variable.name.replace( vRegExp, `[${ sanitize( option.name ) }$2$3` );
				formula = formula.replace( vRegExp, `[${ sanitize( option.name ) }$2$3` );

				newCustomVariables = newCustomVariables.map( ( customVariable ) => {
					customVariable.formula = customVariable.formula.replace( vRegExp, `[${ sanitize( option.name ) }$2$3` );
					return customVariable;
				} );
			}

			if ( tokens.length > 2 ) {
				const cRegExp = new RegExp(`\\.(${tokens[2]})\\.(.*)$`, 'gi')
				const varTokens = variable.var.split( '.' );
				let choice = option.choices.find( ( choice ) => tokens[2] === sanitize( choice.label ) );

				if ( ! choice ) {
					choice = option.choices.find( ( choice, index ) => parseInt( varTokens[2].replace( 'choice', '' ) ) === index );
				}

				if ( sanitize( choice?.label ) !== tokens[2] ) {
					variable.name = variable.name.replace( cRegExp, `.${ sanitize( choice.label ) }.$2` );
					formula = formula.replace( cRegExp, `.${ sanitize( choice.label ) }.$2` );

					newCustomVariables = newCustomVariables.map( ( customVariable ) => {
						customVariable.formula = customVariable.formula.replace( cRegExp, `.${ sanitize( choice.label ) }.$2` );
						return customVariable;
					} );
				}

				const choiceIndex = option.choices.indexOf( choice );

				if ( choiceIndex > -1 ) {
					varTokens[2] = `choice${ choiceIndex }`;
					variable.var = varTokens.join( '.' );
				}
			}

			return variable;
		} );

		setVariables( newVariables );
		setCustomFormulaVariables( newCustomVariables );

		return formula;
	}

	/**
	 * Handles the formula input change.
	 *
	 * @param {Event} event
	 */
	const onTextareaChange = ( event ) => {
		setCursor( event.target?.selectionStart );
		if ( event?.target?.matches( '.wpo-price-formula-textarea-wrap textarea' ) ) {
			setFormula( event.target.value );
		}
	};

	/**
	 * Renders the available options as buttons.
	 *
	 * @return {JSX.Element} The buttons.
	 */
	const renderAvailableVariables = () => {
		const productDropdownItems = productVariables.map( ( variable ) => {
			return {
				key: variable.id,
				value: variable.id,
				onClick: () => insertVariable( `[${ variable.id }]` ),
				label: variable.name,
			};
		} );

		const productButton = (
			<ButtonDropdown
				id="product"
				key="product"
				label={ __( 'Product', 'woocommerce-product-options' ) }
				items={ productDropdownItems }
			></ButtonDropdown>
		);

		const allVariables = watchOptionsField.map( ( option ) => {
			if ( option.id === watchOptionsField[ index ]?.id ) {
				return null;
			}

			if ( option.type === 'product' && option?.settings?.product_display_style === 'product' ) {
				return null;
			}

			if ( option.type === 'price_formula' && option.menu_order > watchOptionsField[ index ]?.menu_order ) {
				return null;
			}

			return (
				<FormulaVariableButton key={ option.id } option={ option } insertVariable={ insertVariable } />
			);
		} ).filter( Boolean );

		const allCustomVariables = customFormulaVariables.map( ( customVariable ) => {
			return {
				key: customVariable.name,
				id: customVariable.name,
				label: customVariable.name,
				onClick: () => insertVariable( `[${ customVariable.name }]` ),
			};
		} );

		let customVariableButtons = [];

		if ( allCustomVariables.length > 0 ) {
			customVariableButtons = [
				<ButtonDropdown
					id="custom-variables"
					key="custom-variables"
					label={ __( 'Custom variables', 'woocommerce-product-options' ) }
					items={ allCustomVariables }
					forceDropdown={ true }
				></ButtonDropdown>,
			];
		}

		return [ productButton, ...customVariableButtons, ...allVariables ];
	};

	/**
	 * Renders the available operators as buttons.
	 *
	 * @return {JSX.Element} The operators.
	 */
	const renderAvailableOperators = () => {
		return (
			<div className="wpo-price-formula-control-buttons">
				<div className="wpo-price-formula-operators">
					{ availableOperators.map( ( operator ) => (
						<Button
							key={ operator.value }
							value={ operator.value }
							onClick={ () => insertVariable( `${ operator.value }` ) }
						>
							{ operator.label }
						</Button>
					) ) }
				</div>
				<div className="wpo-price-formula-functions">{ renderAvailableFunctions() }</div>
			</div>
		);
	};

	const renderAvailableFunctions = () => {
		const items = [
			{
				key: 'math',
				value: 'math',
				label: __( 'Math', 'woocommerce-product-options' ),
				subItems: Object.getOwnPropertyNames( Math )
					.filter( ( mathFunction ) => usedMathFunctions.includes( mathFunction ) )
					.map( ( mathFunction ) => {
						if ( typeof Math[ mathFunction ] === 'function' ) {
							return {
								key: `math-${ mathFunction }`,
								label: mathFunction.toUpperCase(),
								value: mathFunction,
								onClick: () => insertVariable( `${ mathFunction }(` ),
							};
						}

						return false;
					} )
					.filter( Boolean ),
			},
			{
				key: 'logical',
				value: 'logical',
				label: __( 'Logical', 'woocommerce-product-options' ),
				subItems: Object.entries( getLogicalFunctions() )
					.map( ( [ fx, fxCallback ] ) => {
						if ( typeof fxCallback === 'function' ) {
							return {
								key: `logical-${ fx }`,
								label: fx.toUpperCase(),
								value: fx,
								onClick: () => insertVariable( `${ fx }(` ),
							};
						}

						return false;
					} )
					.filter( Boolean ),
			},
			{
				key: 'other',
				value: 'other',
				label: __( 'Others', 'woocommerce-product-options' ),
				subItems: Object.entries( getCustomFunctions() )
					.map( ( [ fx, fxCallback ] ) => {
						if ( typeof fxCallback === 'function' ) {
							return {
								key: `other-${ fx }`,
								label: fx,
								value: fx,
								onClick: () => insertVariable( `${ fx }(` ),
							};
						}

						return false;
					} )
					.filter( Boolean ),
			},
		];

		return (
			<ButtonDropdown
				key="functions"
				id="functions"
				label={ __( 'Functions', 'woocommerce-product-options' ) }
				items={ items }
				maxItems={ 12 }
			></ButtonDropdown>
		);
	};

	/**
	 * Track the selection start and end.
	 *
	 * @param {Event} event
	 */
	const handleSelection = ( event ) => {
		const { selectionStart, selectionEnd } = event.target;
		setCursor( selectionStart === selectionEnd ? selectionStart : null );
		setSelection( selectionStart !== selectionEnd ? { start: selectionStart, end: selectionEnd } : null );
	};

	// useEffect( () => {
	// 	if ( formula.length > 0 && parsedFormula.validationError !== false ) {
	// 		validateFormula();
	// 	}
	// }, [] );

	/**
	 * Validate the formula when the formula changes.
	 */
	useEffect( () => {
		if ( ! isAutoFix ) {
			validateFormula();
			setIsAutoFix( false );
		}
	}, [ formula ] );

	/**
	 * Trigger the onChange callback when the formula properties change.
	 */
	useEffect( () => {
		onChange( {
			formula,
			variables,
			customVariables: customFormulaVariables,
			...parsedFormula,
		} );
	}, [ formula, parsedFormula, customFormulaVariables ] );

	useEffect( () => {
		if ( focusedFormula ) {
			setCursor( focusedFormula?.value.length );
			setSelection( null );
		}
	}, [ focusedFormula ] );

	return (
		<div className="wpo-price-formula">
			{ hasDirtyFields && (
				<p className="wpo-clogic-unsaved-options-warning">
					{ __(
						'You need to save new options before using them in a price formula. Click the "Save changes" button below and then continue.'
					) }
				</p>
			) }
			<div className="wpo-price-formula-textarea-wrap">
				<textarea
					name="wpo_price_formula"
					ref={ formulaRef }
					value={ formula }
					placeholder={ '([field1] * [field2]) - [product_price]' }
					onChange={ onTextareaChange }
					onSelect={ handleSelection }
					onKeyUp={ validateFormula }
					onBlur={ validateFormula }
					onFocus={ onFocusedFormula }
					rows="3"
				/>
				{ parsedFormula.validationError !== false && (
					<p className="wpo-price-formula-error">{ parsedFormula.validationError }</p>
				) }
			</div>
			<div className="wpo-price-formula-controls">
				<div className="wpo-price-formula-documentation">
					<a href="https://barn2.com/kb/price-formula-bot/" target="_blank" rel="noreferrer" className="button button-primary">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" version="1.1" fill="currentColor"><path d="m 0.422941,6.6877306 c -0.187134,0 -0.337962,0.1742223 -0.337962,0.3906737 v 5.0792767 c 0,0.216451 0.150828,0.390674 0.337962,0.390674 h 0.337447 c 0.187138,0 0.337966,-0.174223 0.337966,-0.390674 V 7.0784043 c 0,-0.2164514 -0.150828,-0.3906737 -0.337966,-0.3906737 z"/><path d="m 15.239608,6.6877306 c -0.187135,0 -0.337963,0.1742223 -0.337963,0.3906737 v 5.0792767 c 0,0.216451 0.150828,0.390674 0.337963,0.390674 h 0.337447 c 0.187137,0 0.337965,-0.174223 0.337965,-0.390674 V 7.0784043 c 0,-0.2164514 -0.150828,-0.3906737 -0.337965,-0.3906737 z"/><path d="M 8,1.3548742 A 1.0833709,0.96125717 0 0 0 6.916694,2.316072 1.0833709,0.96125717 0 0 0 7.526075,3.1792312 v 1.1498449 c 0,0.083023 0.05849,0.1499261 0.131268,0.1499261 h 0.685313 c 0.07278,0 0.131268,-0.066901 0.131268,-0.1499261 V 3.1798505 A 1.0833709,0.96125717 0 0 0 9.083305,2.316072 1.0833709,0.96125717 0 0 0 8,1.3548742 Z"/><path d="m 2.179166,4.5909593 c -0.439737,0 -0.79375,0.3540125 -0.79375,0.79375 v 8.4666667 c 0,0.439738 0.354013,0.79375 0.79375,0.79375 h 11.641667 c 0.439737,0 0.79375,-0.354012 0.79375,-0.79375 V 5.3847093 c 0,-0.4397375 -0.354013,-0.79375 -0.79375,-0.79375 z M 5.221875,7.6336676 A 1.9843751,1.9843751 0 0 1 7.20625,9.6180426 1.9843751,1.9843751 0 0 1 5.221875,11.602418 1.9843751,1.9843751 0 0 1 3.2375,9.6180426 1.9843751,1.9843751 0 0 1 5.221875,7.6336676 Z m 5.556249,0 a 1.9843751,1.9843751 0 0 1 1.984375,1.984375 1.9843751,1.9843751 0 0 1 -1.984375,1.9843754 1.9843751,1.9843751 0 0 1 -1.984375,-1.9843754 1.9843751,1.9843751 0 0 1 1.984375,-1.984375 z"/></svg>
						{ __( 'Use our Price Formula bot', 'woocommerce-product-options' ) }
					</a>
					<a href="https://barn2.com/kb/price-formula/" target="_blank" rel="noreferrer">
						<Dashicon icon="book" />
						{ __( 'Documentation', 'woocommerce-product-options' ) }
					</a>
				</div>
				<div className="wpo-price-formula-available-options">{ renderAvailableVariables() }</div>
				{ renderAvailableOperators() }
			</div>
			<CustomVariableRepeater
				variables={ customFormulaVariables }
				setVariables={ setCustomFormulaVariables }
				onKeyUp={ validateFormula }
				onFocusedFormula={ onFocusedFormula }
				onChange={ onTextareaChange }
				onSelect={ handleSelection }
			/>
		</div>
	);
};

export default PriceFormula;
