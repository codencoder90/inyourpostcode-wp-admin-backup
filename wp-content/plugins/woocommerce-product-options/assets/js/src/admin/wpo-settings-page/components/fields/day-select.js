import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

import { MultiselectControl } from '@barn2plugins/components';

const DaySelect = ( { value, onChange = () => {} } ) => {
	const daySuggestions = useMemo(
		() => [
			{ label: __( 'Monday', 'woocommerce-product-options' ), value: 1 },
			{ label: __( 'Tuesday', 'woocommerce-product-options' ), value: 2 },
			{ label: __( 'Wednesday', 'woocommerce-product-options' ), value: 3 },
			{ label: __( 'Thursday', 'woocommerce-product-options' ), value: 4 },
			{ label: __( 'Friday', 'woocommerce-product-options' ), value: 5 },
			{ label: __( 'Saturday', 'woocommerce-product-options' ), value: 6 },
			{ label: __( 'Sunday', 'woocommerce-product-options' ), value: 0 },
		],
		[]
	);

	/**
	 * Convert the days to a format the multiselect control can use.
	 *
	 * @param {Array} daysArray
	 * @return {Array} multiSelectStructure formatted for the multiselect control
	 */
	const convertDaysForMultiselect = ( daysArray ) => {
		const multiSelectStructure = daysArray.map( ( day ) => ( {
			label: daySuggestions.find( ( dayObject ) => dayObject.value === day )?.label ?? '',
			value: day,
		} ) );

		return multiSelectStructure;
	};

	/**
	 * Convert the multiSelectStructure to an array of days (integers).
	 *
	 * @param {Array} multiSelectStructure
	 * @return {Array} fileExtensions formatted for the multiselect control
	 */
	const convertMultiSelectStructureToDays = ( multiSelectStructure ) => {
		return multiSelectStructure.map( ( day ) => day.value );
	};

	return (
		<MultiselectControl
			className="wpo-option-datepicker-disable-days"
			label={ __( 'Disable days', 'woocommerce-product-options' ) }
			placeholder={ __( 'Select one or more days of the week to disable', 'woocommerce-product-options' ) }
			suggestions={ daySuggestions }
			value={ value ? convertDaysForMultiselect( value ) : [] }
			onChange={ ( newValues ) => onChange( convertMultiSelectStructureToDays( newValues ) ) }
			searchable
		/>
	);
};

export default DaySelect;
