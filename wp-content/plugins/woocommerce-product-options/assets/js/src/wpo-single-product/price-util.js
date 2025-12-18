/**
 * Internal dependencies
 */

import { isFieldType, isFieldCheckboxLike, isFieldRadioLike } from './util';
import { getCustomPriceTypes } from '../common/util/user-defined-functions';

/**
 * External dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import { sprintf } from '@wordpress/i18n';
import { numberFormat } from '@woocommerce/number';

export const getProductVariables = ( form ) => {
	const data = form.querySelector( '.wpo-totals-container' )?.dataset;
	const submitButton = form.querySelector( 'button[name="add-to-cart"][type="submit"]' );
	const variationId = form.querySelector( 'input[name="variation_id"][type="hidden"]' )?.value ?? 0;
	const productId = submitButton?.value ? submitButton.value : variationId;
	const hasBulkQuantities = form.querySelector( 'span.wcbvp_total_items' ) !== null;
	const bulkQuantity = parseInt( form.querySelector( 'span.wcbvp_total_items' )?.textContent ?? 0 );
	const quantity = parseInt( form.querySelector( 'input.qty' )?.value ?? 1 );

	return {
		id: parseInt( productId ),
		price: parseFloat( data?.productPrice ?? 0 ),
		quantity: parseFloat( hasBulkQuantities ? bulkQuantity : quantity ),
		excludePrice: JSON.parse( data?.excludeProductPrice ?? 'false' ),
		weight: data?.weight ?? '',
		width: data?.width ?? '',
		length: data?.length ?? '',
		height: data?.height ?? '',
	}
};

/* eslint-disable no-undef */
export const calculateOptionPrice = ( field, priceType, optionPrice, variation = {} ) => {
	const customPriceTypes = getCustomPriceTypes();
	let calculatedPrice = 0;
	const form = field.element.closest( 'form' );
	const productVariables = getProductVariables( form );

	const quantity = ( variation?.quantity ?? productVariables.quantity );
	const price = ( variation?.price ?? productVariables.price );

	switch ( priceType ) {
		case 'flat_fee':
			calculatedPrice = optionPrice;
			break;
		case 'quantity_based':
			calculatedPrice = optionPrice * quantity;
			break;
		case 'percentage_inc':
			calculatedPrice = price * ( optionPrice / 100 ) * quantity;
			break;
		case 'percentage_dec':
			calculatedPrice = -( price * ( optionPrice / 100 ) ) * quantity;
			break;
		case 'char_count':
			calculatedPrice = optionPrice * getCharCount( field ) * quantity;
			break;
		case 'file_count':
			calculatedPrice = optionPrice * getFileCount( field ) * quantity;
			break;
		case 'price_formula':
			calculatedPrice = optionPrice * quantity;
			break;
		default:
			const callback = customPriceTypes[ priceType ]?.callback;
			if ( typeof callback === 'function' ) {
				calculatedPrice = callback( field, priceType, price, optionPrice, variation );
			}
			break;
	}

	return calculatedPrice;
};

const getCharCount = ( field ) => {
	let charCountElement;

	switch ( field.type ) {
		case 'text':
			charCountElement = field.element.querySelector( 'input' );
			break;
		case 'textarea':
			charCountElement = field.element.querySelector( 'textarea' );
			break;
	}

	if ( ! charCountElement ) {
		return 0;
	}

	let value = charCountElement.value?.trim?.();

	if ( wpoSettings?.charCountRegExp?.length > 0 ) {
		const regExp = new RegExp( `[^${ wpoSettings.charCountRegExp }]`, 'g' );
		value = value.replace( regExp, '' );
	}

	return value?.length;
};

const getFileCount = ( field ) => {
	const fileCountElement = field.element.querySelector( 'input[type="hidden"]' );

	try {
		return JSON.parse( fileCountElement?.value )?.length;
	} catch ( error ) {
		return 0;
	}
};

export const getChosenPrices = ( field ) => {
	const chosenPrices = [];

	if ( field.element.classList.contains( 'wpo-field-hide' ) ) {
		return chosenPrices;
	}

	if ( isFieldCheckboxLike( field ) ) {
		Array.from( field.element.querySelectorAll( 'input[type="checkbox"]' ) ).forEach( ( checkbox ) => {
			if ( checkbox.checked ) {
				chosenPrices.push( {
					priceType: checkbox.dataset.priceType,
					priceAmount: parseFloat( checkbox.dataset.priceAmount ),
				} );
			}
		} );
	}

	if ( isFieldRadioLike( field ) ) {
		Array.from( field.element.querySelectorAll( 'input[type="radio"]' ) ).forEach( ( radio ) => {
			if ( radio.checked ) {
				chosenPrices.push( {
					priceType: radio.dataset.priceType,
					priceAmount: parseFloat( radio.dataset.priceAmount ),
				} );
			}
		} );
	}

	if ( isFieldType( field, 'dropdown' ) ) {
		const selectElement = field.element.querySelector( 'select' );
		chosenPrices.push( {
			priceType: selectElement.options[ selectElement.selectedIndex ].dataset.priceType,
			priceAmount: parseFloat( selectElement.options[ selectElement.selectedIndex ].dataset.priceAmount ),
		} );
	}

	if ( isFieldType( field, 'number' ) ) {
		const inputElement = field.element.querySelector( 'input' );

		if ( inputElement.value?.trim?.()?.length > 0 ) {
			chosenPrices.push( {
				priceType: inputElement.dataset.priceType,
				priceAmount: parseFloat( inputElement.dataset.priceAmount ),
			} );
		}
	}

	if ( isFieldType( field, [ 'text', 'datepicker' ] ) ) {
		const inputElement = field.element.querySelector( 'input' );

		if (
			inputElement.dataset.priceType === 'char_count' ||
			( inputElement.dataset.priceType !== 'char_count' && inputElement.value?.trim?.()?.length > 0 )
		) {
			chosenPrices.push( {
				priceType: inputElement.dataset.priceType,
				priceAmount: parseFloat( inputElement.dataset.priceAmount ),
			} );
		}
	}

	if ( isFieldType( field, 'textarea' ) ) {
		const inputElement = field.element.querySelector( 'textarea' );

		if (
			inputElement.dataset.priceType === 'char_count' ||
			( inputElement.dataset.priceType !== 'char_count' && inputElement.value?.trim?.()?.length > 0 )
		) {
			chosenPrices.push( {
				priceType: inputElement.dataset.priceType,
				priceAmount: parseFloat( inputElement.dataset.priceAmount ),
			} );
		}
	}

	if ( isFieldType( field, 'file_upload' ) ) {
		const inputElement = field.element.querySelector( `input[name="wpo-option[option-${ field.optionId }]"]` );
		const uploadedFiles = JSON.parse( inputElement.value );

		if ( uploadedFiles.length > 0 ) {
			chosenPrices.push( {
				priceType: inputElement.dataset.priceType,
				priceAmount: parseFloat( inputElement.dataset.priceAmount ),
			} );
		}
	}

	if ( isFieldType( field, 'customer_price' ) ) {
		const inputElement = field.element.querySelector( 'input' );
		const inputAmount = isNaN( parseFloat( inputElement.value ) ) ? 0 : parseFloat( inputElement.value );

		chosenPrices.push( {
			priceType: 'flat_fee',
			priceAmount: inputAmount,
		} );
	}

	return chosenPrices;
};

export const wcFormatPrice = ( price ) => {
	const storeCurrency = CurrencyFactory( wpoSettings.currency );

	return storeCurrency.formatAmount( price );
};

export const wcUnformatPrice = ( formattedPrice ) => {
	const curSettings = wpoSettings.currency;
	const { symbol, decimalSeparator } = curSettings;
	const symbolRegExp = new RegExp( `${ symbol }`, 'g' );
	const valueRegExp = new RegExp( `[^0-9-${ decimalSeparator }]`, 'g' );

	const tmp = document.createElement( 'DIV' );
	tmp.innerHTML = formattedPrice;
	formattedPrice = tmp.textContent || tmp.innerText || '';

	return parseFloat(
		formattedPrice
			// remove the currency symbol first so that it doesn't interfere with the value/decimal separators
			.replace( symbolRegExp, '' )
			// then remove any non-numeric characters except the decimal separator and the minus sign
			.replace( valueRegExp, '' )
			// finally replace the decimal separator (there should be only one at this point) with a dot
			.replace( decimalSeparator, '.' )
	);
};

/**
 * Whether the WooCommerce configuration has tax conflicts or not.
 *
 * The recommended tax settings is to have prices both input and displayed
 * as either inclusive or exclusive of tax.
 * If this is not the case, we need to handle the tax calculation manually
 * in price formulas.
 * 
 * @returns {boolean}
 */
export const hasTaxConflicts = () => {
	return ! ! window.wpoSettings?.tax_conflicts;
}

/**
 * This is reduced version of the WooCommerce CurrencyFactory function.
 * 
 * The main difference is that it doesn't include any dependency on `@wordpress/element`
 * which requires `react` and `react-dom` as peer dependencies.
 *
 * @param {Object} currencySetting
 * @return {Object} currency object
 */
export const CurrencyFactory = ( currencySetting ) => {
	let currency;

	const stripTags = ( str ) => {
		const strippedStr = str
			.replace( /<!--[\s\S]*?(-->|$)/g, '' )
			.replace( /<(script|style)[^>]*>[\s\S]*?(<\/\1>|$)/gi, '' )
			.replace( /<\/?[a-z][\s\S]*?(>|$)/gi, '' );

		if ( strippedStr !== str ) {
			return stripTags( strippedStr );
		}

		return strippedStr;
	}

	/**
	 * Get the default price format from a currency.
	 *
	 * @param {Object} config Currency configuration.
	 * @return {string} Price format.
	 */
	const getPriceFormat = ( config ) => {
		if ( config.priceFormat ) {
			return stripTags( config.priceFormat.toString() );
		}

		switch ( config.symbolPosition ) {
			case 'left':
				return '%1$s%2$s';
			case 'right':
				return '%2$s%1$s';
			case 'left_space':
				return '%1$s %2$s';
			case 'right_space':
				return '%2$s %1$s';
		}

		return '%1$s%2$s';
	}

	const setCurrency = ( setting ) => {
		const defaultCurrency = {
			code: 'USD',
			symbol: '$',
			symbolPosition: 'left',
			thousandSeparator: ',',
			decimalSeparator: '.',
			precision: 2,
		};
		const config = { ...defaultCurrency, ...setting };

		let precision = config.precision;
		if ( precision === null ) {
			// eslint-disable-next-line no-console
			console.warn( 'Currency precision is null' );
			// eslint-enable-next-line no-console

			precision = NaN;
		} else if ( typeof precision === 'string' ) {
			precision = parseInt( precision, 10 );
		}

		currency = {
			code: config.code.toString(),
			symbol: decodeEntities( config.symbol.toString() ),
			symbolPosition: config.symbolPosition.toString(),
			decimalSeparator: config.decimalSeparator.toString(),
			priceFormat: getPriceFormat( config ),
			thousandSeparator: config.thousandSeparator.toString(),
			precision,
		};
	}

	/**
	 * Formats money value.
	 *
	 * @param {number|string} number          number to format
	 * @param {boolean}       [useCode=false] Set to `true` to use the currency code instead of the symbol.
	 * @return {?string} A formatted string.
	 */
	const formatAmount = ( number, useCode = false ) => {
		const formattedNumber = numberFormat( currency, number );

		if ( formattedNumber === '' ) {
			return formattedNumber;
		}

		const { priceFormat, symbol, code } = currency;

		// eslint-disable-next-line @wordpress/valid-sprintf
		return sprintf( priceFormat, useCode ? code : symbol, formattedNumber );
	}

	setCurrency( currencySetting );

	return {
		formatAmount,
	};
};

