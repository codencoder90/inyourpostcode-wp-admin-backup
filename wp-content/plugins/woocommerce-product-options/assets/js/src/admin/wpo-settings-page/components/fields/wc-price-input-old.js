/**
 * WordPress dependencies.
 */
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * External dependencies.
 */
import classnames from 'classnames';

/**
 * A pricing input which is formatted according to WC store settings.
 *
 * @param {Object}   props
 * @param {boolean}  props.displayCode
 * @param {Object}   props.storeCurrency
 * @param {boolean}  props.required
 * @param {string}   props.value
 * @param {Function} props.onChange
 * @return {React.ReactElement} InputWCPrice
 */
export default function WCPriceInput( { required = false, storeCurrency, value, onChange = () => {} } ) {
	const currencyConfig = storeCurrency.getCurrencyConfig();

	const wpoFormatDecimalString = ( number ) => {
		if ( number === '-' ) {
			return '-';
		}

		if ( typeof number !== 'number' ) {
			number = parseFloat( number );
		}

		if ( Number.isNaN( number ) ) {
			return '';
		}

		return storeCurrency.formatAmount( number ).replace( currencyConfig?.symbol, '' );
	};

	const formattedAmount = wpoFormatDecimalString( value );
	const ref = useRef( null );
	const [ prevSepCount, setPrevSepCount ] = useState( 0 );

	/**
	 * Track the cursor position.
	 */
	const [ cursor, setCursor ] = useState( null );

	/**
	 * Track the fcous state.
	 */
	const [ isFocused, setIsFocused ] = useState( false );

	const backdropCSSClasses = classnames( 'barn2-prefixed-input-backdrop', {
		'barn2-input-focused': isFocused,
	} );

	const parseNumber = ( event ) => {
		let priceString = event.target.value;
		if ( priceString === '' ) {
			return;
		}
		priceString = priceString.replace( currencyConfig?.thousandSeparator, '' );
		priceString = priceString.replace( currencyConfig?.decimalSeparator, '.' );
		event.target.value = parseFloat( priceString );
	};

	const sanitizeNumber = ( event ) => {
		event.target.value = storeCurrency.formatDecimal( parseFloat( event.target.value ) );
	};

	/**
	 * Handles the cursor position when formatting the input amount.
	 */
	// useEffect( () => {
	// 	const input = ref.current;
	// 	if ( input ) input.setSelectionRange( cursor, cursor );
	// }, [ ref, cursor, value ] );

	/**
	 * Handles the input change.
	 *
	 * @param {Event} event
	 */
	const handleChange = ( event ) => {
		let targetValue = event.target.value;

		if ( currencyConfig?.thousandSeparator?.length > 0 ) {
			const thousandRegExp = new RegExp( `\\${ currencyConfig?.thousandSeparator }`, 'gi' );
			targetValue = targetValue.replace( thousandRegExp, '' );
		}

		let targetFloat = parseFloat( targetValue );
		let sepCount = 0;

		if ( currencyConfig?.thousandSeparator?.length > 0 ) {
			while ( Math.abs( targetFloat ) >= 1000 ) {
				// count the thousand separator
				sepCount++;
				targetFloat = targetFloat / 1000;
			}
		}

		// get the thousand separator count from the previous change
		// move the cursor to the right if the number of thousand separators changed
		setCursor( event.target.selectionStart + sepCount - prevSepCount );
		// store the current number of thousand separators
		setPrevSepCount( sepCount );

		onChange( event );
	};

	return (
		<div className="barn2-prefixed-input-container barn2-currency-input-container">
			<span className="barn2-input-prefix">{ currencyConfig.symbol }</span>
			<input
				required={ required }
				className="barn2-prefixed-input barn2-currency-input"
				ref={ ref }
				type="text"
				onChange={ onChange }
				onFocus={ parseNumber }
				onBlur={ sanitizeNumber }
				value={ value }
			/>
			<div className={ backdropCSSClasses }></div>
		</div>
	);
}
