/* eslint-disable no-undef */
import apiFetch from '@wordpress/api-fetch';

import { calculateOptionPrice, getChosenPrices, getProductVariables, wcFormatPrice, hasTaxConflicts } from './price-util';
import { hasSingleValue, isFieldType } from './util';

const priceCalculator = ( addToCartForm, isIntegration = false ) => {
	const form = addToCartForm;
	let productVariables;
	let totalsContainer;
	let fieldData = [];
	let formulaFields = [];
	let numberFields = [];
	let checkboxFields = [];
	let subTotals = [];

	const init = () => {
		if ( ! ( form instanceof HTMLFormElement ) ) {
			return false;
		}

		if ( ! ( form.querySelector( '.wpo-totals-container' ) instanceof HTMLElement ) ) {
			return false;
		}

		productVariables = getProductVariables( form );
		totalsContainer = form.querySelector( '.wpo-totals-container' );

		fieldData = Array.from( form.querySelectorAll( '.wpo-field' ) ).map( ( field ) => {
			return {
				element: field,
				type: field.dataset?.type,
				groupId: field.dataset?.groupId ? parseInt( field.dataset.groupId ) : null,
				optionId: field.dataset?.optionId ? parseInt( field.dataset.optionId ) : null,
				pricing: field.dataset?.pricing === 'true' ? true : false,
			};
		} );

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

		numberFields = Array.from( form.querySelectorAll( '.wpo-field' ) )
			.filter( ( element ) => element.dataset.type === 'number' )
			.map( ( field ) => {
				return {
					element: field,
					inputElement: field.querySelector( 'input' ),
					type: field.dataset?.type,
					groupId: field.dataset?.groupId ? parseInt( field.dataset.groupId ) : null,
					optionId: field.dataset?.optionId ? parseInt( field.dataset.optionId ) : null,
				};
			} );

		checkboxFields = Array.from( form.querySelectorAll( '.wpo-field' ) )
			.filter( ( element ) => element.dataset.type === 'checkbox' )
			.map( ( field ) => {
				return {
					element: field,
					inputElements: field.querySelectorAll( 'input' ),
					type: field.dataset?.type,
					groupId: field.dataset?.groupId ? parseInt( field.dataset.groupId ) : null,
					optionId: field.dataset?.optionId ? parseInt( field.dataset.optionId ) : null,
				};
			} );

		bindEvents();
		runAllCalculations();
	};

	const bindEvents = () => {
		// listener for quantity changes
		form.querySelector( 'input.qty' )?.addEventListener( 'change', ( e ) => {
			runAllCalculations();
		} );

		jQuery( 'input.qty' ).on( 'change', () => {
			runAllCalculations();
		} );

		jQuery( document ).on( 'wc_bulk_variations_table_recalculate', () => {
			runAllCalculations();
		} );

		// if this WRO then set the modal button price
		if ( isIntegration === 'wro' && window.wcRestaurantProductModal ) {
			const wroModal = window.wcRestaurantProductModal.getModalElement();
			wroModal.on( 'wro:modal:change_quantity', ( e ) => {
				runAllCalculations( wroModal.get(0).querySelector( 'form.cart' ) );
			} );
		}

		form.addEventListener( 'wpo_run_frontend_calculation', () => runAllCalculations() );
		form.addEventListener( 'wpo:recalculate', () => runAllCalculations() );

		// listener for field input changes
		fieldData.forEach( ( field ) => {
			if ( isFieldType( field, [ 'text', 'textarea', 'customer_price', 'number' ] ) ) {
				field?.element.addEventListener( 'input', () => runAllCalculations() );
			} else {
				field?.element.addEventListener( 'change', () => runAllCalculations() );
			}
		} );

		// listener for WC variation changes
		jQuery( document ).on( 'found_variation', form, ( event, variation ) => {
			if ( form !== event.target ) {
				return;
			}

			totalsContainer.dataset.productPrice = variation.display_price;
			totalsContainer.dataset.weight = variation.weight;
			totalsContainer.dataset.width = variation.dimensions.width;
			totalsContainer.dataset.length = variation.dimensions.length;
			totalsContainer.dataset.height = variation.dimensions.height;
			productVariables = getProductVariables( form );
			runAllCalculations();
		} );

		jQuery( document ).on( 'reset_data', form, ( event ) => {
			runAllCalculations();
		} );

	};

	/**
	 * Runs all the calculations.
	 */
	const runAllCalculations = ( cartForm ) => {
		cartForm = cartForm || form;

		// update the product variables
		productVariables = getProductVariables( form );

		// reset the subtotals
		subTotals = [];

		fieldData.forEach( ( field ) => {
			// run initial calc on all pricing fields
			const chosenPrices = getChosenPrices( field );

			chosenPrices.forEach( ( chosenPrice ) => {
				addOptionPrice( field, chosenPrice.priceAmount, chosenPrice.priceType );
			} );
		} );

		if ( formulaFields.length > 0 ) {
			runFormulaCalculations()
				.then( () => {
					calculatePricing();
				} );
		} else {
			calculatePricing();
		}
	};

	/**
	 * Runs calculations for any formula fields.
	 */
	const runFormulaCalculations = () => {
		return new Promise( ( resolve ) => {
			import(
				/* webpackChunkName: "price-formulas" */
				'./price-formulas.js'
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

	/**
	 * Add the price of an option to the subtotals array
	 *
	 * @param {Object} field
	 * @param {number} priceAmount
	 * @param {string} priceType
	 */
	const addOptionPrice = ( field, priceAmount, priceType ) => {
		const optionPrice = calculateOptionPrice( field, priceType, priceAmount );

		if ( hasSingleValue( field ) ) {
			// If only one choice at a time can be selected,
			// ensure only one price is added for each field.
			subTotals = subTotals.filter( ( subTotal ) => subTotal.field !== field.optionId );
		}

		subTotals.push( {
			field: field.optionId,
			price: optionPrice,
		} );

		field.element.dataset.optionPrice = optionPrice;
		field.element.value = optionPrice;
	};

	/**
	 * Adds up all the option prices and sets the total price.
	 */
	const calculatePricing = () => {
		const optionsPrice = subTotals.reduce( ( total, subTotal ) => {
			return total + subTotal.price;
		}, 0 );

		const totalPrice =
			productVariables.excludePrice
				? optionsPrice
				: productVariables.quantity * productVariables.price + optionsPrice;


		form.dispatchEvent( new CustomEvent( 'wpo:recalculated', { detail: { form, total: totalsContainer?.dataset?.totalPrice } } ) )
		setPricingInHtml( Math.max( 0, totalPrice ), optionsPrice );
	};

	/**
	 * Sets the pricing in the HTML.
	 *
	 * @param {number} totalPrice
	 * @param {number} optionsPrice
	 * @return {void}
	 */
	const setPricingInHtml = ( totalPrice, optionsPrice ) => {
		const formattedPrice = wcFormatPrice( totalPrice );

		// hide the WPO total if there is no priced options
		if ( optionsPrice === 0 && productVariables.quantity === 1 ) {
			totalsContainer.classList.add( 'wpo-totals-hidden' );
		} else {
			totalsContainer.classList.remove( 'wpo-totals-hidden' );
		}

		// update the WPO total, which takes into account the product quantity
		const totalsContainerPrice = totalsContainer.querySelector( '.wpo-price' );
		if ( totalsContainerPrice ) {
			totalsContainer.querySelector( '.wpo-price' ).innerHTML = formattedPrice;
		}

		// once the WPO total is updated, we can get the price for the single item
		const perItemPrice = totalPrice / productVariables.quantity;

		totalsContainer.dataset.totalPrice = parseFloat( totalPrice );
		totalsContainer.dataset.perItemPrice = parseFloat( perItemPrice );

		// if this is WRO then set the modal button price
		if ( isIntegration === 'wro' && window.wcRestaurantProductModal ) {
			// `totalPrice` already takes into account the product quantity
			// We need to divide by the quantity to get the price per item
			// so that the modal button price is correct.
			window.wcRestaurantProductModal.setPrice( perItemPrice );
		}

		form.dispatchEvent( new CustomEvent( 'wpo:priceUpdated', { detail: { form, total: totalsContainer.dataset.totalPrice } } ) )
	};

	return { init };
};

export default priceCalculator;
