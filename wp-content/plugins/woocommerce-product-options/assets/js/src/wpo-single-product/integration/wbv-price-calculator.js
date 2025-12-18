import { isFieldType } from '../util';
import { calculateOptionPrice, getChosenPrices, getProductVariables, hasTaxConflicts, wcFormatPrice } from '../price-util';
// import { evaluateFormula } from '../price-formulas';

const wbvPriceCalculator = ( addToCartForm ) => {
	const form = addToCartForm;
	let productVariables = getProductVariables( form );
	let wbvVariations = [];
	let fieldData = [];
	let formulaFields = [];
	let totalPrice = 0;

	const init = () => {
		if ( ! ( form instanceof HTMLFormElement ) ) {
			return false;
		}

		if ( ! ( form.querySelector( '.wpo-totals-container' ) instanceof HTMLElement ) ) {
			return false;
		}

		wbvVariations = JSON.parse( form.dataset?.product_variations );

		fieldData = Array.from( form.querySelectorAll( '.wpo-field' ) )
			.map( ( field ) => {
				return {
					element: field,
					type: field.dataset?.type,
					groupId: field.dataset?.groupId ? parseInt( field.dataset.groupId ) : null,
					optionId: field.dataset?.optionId ? parseInt( field.dataset.optionId ) : null,
					pricing: field.dataset?.pricing === 'true' ? true : false,
				};
			} )
			.filter( ( field ) => field.pricing );

		formulaFields = Array.from( form.querySelectorAll( '.wpo-field' ) )
			.filter( ( element ) => element.dataset.type === 'price_formula' )
			.map( ( field ) => {
				const inputElement = field.querySelector( 'input' );

				return {
					element: field,
					inputElement: field.querySelector( 'input' ),
					type: field.dataset?.type,
					groupId: field.dataset?.groupId ? parseInt( field.dataset.groupId ) : null,
					optionId: field.dataset?.optionId ? parseInt( field.dataset.optionId ) : null,
					formula: inputElement.dataset?.priceFormula ? inputElement.dataset.priceFormula : null,
					formulaVariables: inputElement.dataset?.priceFormulaVariables
						? JSON.parse( inputElement.dataset.priceFormulaVariables )
						: null,
					customFormulaVariables: inputElement.dataset?.customFormulaVariables
						? JSON.parse( inputElement.dataset.customFormulaVariables )
						: null,
				};
			} );

		bindEvents();
		runAllCalculations();
	};

	const bindEvents = () => {
		// listener for quantity changes
		document.querySelectorAll( 'input.wcbvp-quantity' ).forEach( ( quantityField ) => {
			quantityField.addEventListener( 'change', ( e ) => {
				const variationId = parseInt( e.target.dataset.product_id );
				const variation = wbvVariations[
					wbvVariations.findIndex( ( variation ) => variation.variation_id === variationId )
				];

				if ( variation ) {
					variation.quantity = parseInt( e.target.value );
				}

				runAllCalculations();
			} );
		} );

		// listener for field input changes
		fieldData.forEach( ( field ) => {
			if ( isFieldType( field, [ 'text', 'textarea', 'customer_price' ] ) ) {
				field?.element.addEventListener( 'input', () => runAllCalculations() );
			} else {
				field?.element.addEventListener( 'change', () => runAllCalculations() );
			}
		} );

		// trigger after WBV recalculates it's internal price
		jQuery( document ).on( 'wc_bulk_variations_table_recalculate', () => runAllCalculations() );
	};

	const runAllCalculations = () => {
		// reset the subtotals
		wbvVariations.forEach( ( variation ) => {
			variation.subTotals = [];
		} );

		fieldData.forEach( ( field ) => {
			// run initial calc on all pricing fields
			const chosenPrices = getChosenPrices( field );

			chosenPrices.forEach( ( chosenPrice ) => {
				addOptionPrice( field, chosenPrice.priceAmount, chosenPrice.priceType );
			} );
		} );

		runFormulaCalculations()
			.then( () => {
				calculatePricing();
			} );
	};

	/**
	 * Runs calculations for any formula fields.
	 */
	const runFormulaCalculations = () => {
		return new Promise( ( resolve ) => {
			import(
				/* webpackChunkName: "price-formulas" */
				'../price-formulas.js'
			).then( ( module ) => {
				// Run calculations for each formula field
				const formulas = formulaFields.map( ( field ) => {
					const formulaResult = module.evaluateFormula( field );
					// we immediately update the result in the field dataset
					// so that other formulas can use this value
					if ( formulaResult?.field && formulaResult?.price ) {
						addOptionPrice( formulaResult.field, formulaResult.price, 'price_formula' );
					}
					return formulaResult;
				} );

				if ( hasTaxConflicts() ) {
					// if the tax settings are conflicting, we can't run the formula
					// so we return an object with the optionId and the variables
					// and we'll use to calculate the formula on the server side
					if ( productVariables?.id > 0 ) {
						getFormulaResults( { product_id: productVariables.id, formulas } )
							.then( () => resolve() )
							.catch( ( error ) => reject( error ) );
					}
				} else {
					resolve();
				}
			} );
		} );
	};

	const getFormulaResults = ( data ) => {
		return new Promise( ( resolve ) => {
			totalsContainer.querySelector( '.wpo-price' ).innerHTML = '';
			apiFetch( { 
				path: '/wc-product-options/v1/formula/calculate',
				method: 'POST',
				data,
			} ).then( ( results ) => {
				results.forEach( ( result ) => {
					const field = formulaFields.find( ( f ) => f.optionId === result.option_id );
					if ( ! isNaN( result.price ) ) {
						addOptionPrice( field, result.price, 'price_formula' );
					}
				} );
				totalsContainer.classList.remove( 'wpo-totals-hidden' );
				resolve();
			} ).catch( ( error ) => {
				reject( error );
			} );
		} );
	};	

	const addOptionPrice = ( field, priceAmount, priceType ) => {
		for ( const [ index, variation ] of wbvVariations.entries() ) {
			// if no qty is set, skip this variation
			if ( ! variation?.quantity || variation.quantity === 0 ) {
				continue;
			}

			const optionPrice = calculateOptionPrice(
				field,
				priceType,
				priceAmount,
				{
					price: variation.display_price,
					quantity: variation.quantity
				}
			);

			variation.subTotals = variation.subTotals.filter( ( subTotal ) => subTotal.field !== field.optionId );
			variation.subTotals.push( {
				field: field.optionId,
				price: optionPrice,
			} );

			wbvVariations[ index ].subTotals = subTotals;
		}
	};

	const calculatePricing = () => {
		totalPrice = wbvVariations.reduce( ( total, variation ) => {
			if ( ! variation?.subTotals || ! Array.isArray( variation.subTotals ) ) {
				return total;
			}

			if ( ! variation?.quantity || variation.quantity === 0 ) {
				return total;
			}

			const optionsPrice = variation.subTotals.reduce( ( subTotal, subTotalItem ) => {
				return subTotal + subTotalItem.price;
			}, 0 );

			const variationPrice = productVariables.excludePrice
				? optionsPrice
				: variation.quantity * variation.display_price + optionsPrice;

			return total + variationPrice;
		}, 0 );

		setPricingInHtml( wcFormatPrice( totalPrice ) );
	};

	const setPricingInHtml = ( formattedPrice ) => {
		form.querySelector( '.wcbvp_total_price bdi' ).innerHTML = formattedPrice;
	};

	return { init };
};

export default wbvPriceCalculator;
