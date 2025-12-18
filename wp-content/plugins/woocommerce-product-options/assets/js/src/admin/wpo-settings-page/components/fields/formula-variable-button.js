/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import ButtonDropdown from '../button-dropdown';
import { sanitize } from '../../../../common/util/util';

const FormulaVariableButton = ( { option, insertVariable } ) => {
	const optionName = sanitize( option.name );

	const renderDropdownButton = ( items ) => {
		return (
			<ButtonDropdown key={ option.id } id={ option.id } label={ option.name } items={ items }></ButtonDropdown>
		);
	};

	const NumberButton = () => {
		const items = [
			{
				key: `${ option.id }`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }]` ),
				label: option.name,
			},
		];

		return renderDropdownButton( items.filter( Boolean ) );
	};

	const textButton = () => {
		const items = [
			{
				key: `${ option.id }.characters`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.characters]` ),
				label: __( 'Character count', 'woocommerce-product-options' ),
			},
			{
				key: `${ option.id }.words`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.words]` ),
				label: __( 'Word count', 'woocommerce-product-options' ),
			},
			option.type === 'textarea' && {
				key: `${ option.id }.lines`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.lines]` ),
				label: __( 'Line count', 'woocommerce-product-options' ),
			},
		];

		return renderDropdownButton( items.filter( Boolean ) );
	};

	const choiceButton = () => {
		const singleChoice =
			[ 'radio', 'dropdown', 'color_swatches' ].includes( option.type ) ||
			Number( option?.settings?.choice_qty?.max ) === 1;

		const hasValues = option?.choices?.some?.( ( choice ) => choice.value !== '' );

		const items = [
			{
				key: `${ option.id }.choices`,
				value: option.id,
				label: 'Choices',
				subItems: [
					...option.choices.map( ( choice ) => {
						const sanitizedLabel = sanitize( choice.label );
						const hasValue = choice.value !== '';
						return {
							key: `${ option.id }.choices.${ sanitizedLabel }`,
							value: choice.id,
							onClick: () => insertVariable( `[${ optionName }.choices.${ sanitizedLabel }]` ),
							label: `${ choice.label }`,
							subItems: [
								{
									key: `${ option.id }.choices.${ choice.id }.checked`,
									value: choice.id,
									onClick: () =>
										insertVariable( `[${ optionName }.choices.${ sanitizedLabel }.checked]` ),
									label: __( 'Checked', 'woocommerce-product-options' ),
								},
								hasValue && {
									key: `${ option.id }.choices.${ choice.id }.value`,
									value: choice.id,
									onClick: () =>
										insertVariable( `[${ optionName }.choices.${ sanitizedLabel }.value]` ),
									label: __( 'Value', 'woocommerce-product-options' ),
								},
							].filter( Boolean ),
						};
					} ),
				],
			},
		];

		items.push(
			! singleChoice && {
				key: `${ option.id }.none`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.none]` ),
				label: __( 'If none selected', 'woocommerce-product-options' ),
			},
			! singleChoice && {
				key: `${ option.id }.any`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.any]` ),
				label: __( 'If any selected', 'woocommerce-product-options' ),
			},
			! singleChoice && {
				key: `${ option.id }.all`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.all]` ),
				label: __( 'If all selected', 'woocommerce-product-options' ),
			},
			! singleChoice && {
				key: `${ option.id }.count`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.count]` ),
				label: __( 'Count selected', 'woocommerce-product-options' ),
			},
			! singleChoice &&
				hasValues && {
					key: `${ option.id }.min`,
					value: option.id,
					onClick: () => insertVariable( `[${ optionName }.min]` ),
					label: __( 'Min selected value', 'woocommerce-product-options' ),
				},
			! singleChoice &&
				hasValues && {
					key: `${ option.id }.max`,
					value: option.id,
					onClick: () => insertVariable( `[${ optionName }.max]` ),
					label: __( 'Max selected value', 'woocommerce-product-options' ),
				},
			! singleChoice &&
				hasValues && {
					key: `${ option.id }.sum`,
					value: option.id,
					onClick: () => insertVariable( `[${ optionName }.sum]` ),
					label: __( 'Sum of selected values', 'woocommerce-product-options' ),
				},
			singleChoice && {
				key: `${ option.id }.selected`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.selected]` ),
				label: __( 'If selected', 'woocommerce-product-options' ),
			},
			singleChoice &&
				hasValues && {
					key: `${ option.id }.value`,
					value: option.id,
					onClick: () => insertVariable( `[${ optionName }.value]` ),
					label: __( 'Selected value', 'woocommerce-product-options' ),
				}
		);

		return renderDropdownButton( items.filter( Boolean ) );
	};

	const productButton = () => {
		const singleProduct = [ 'radio', 'dropdown' ].includes( option?.settings?.product_display_style );

		const items = [
			! singleProduct && {
				key: `${ option.id }.none`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.none]` ),
				label: __( 'If none selected', 'woocommerce-product-options' ),
			},
			! singleProduct && {
				key: `${ option.id }.any`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.any]` ),
				label: __( 'If any selected', 'woocommerce-product-options' ),
			},
			! singleProduct && {
				key: `${ option.id }.all`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.all]` ),
				label: __( 'If all selected', 'woocommerce-product-options' ),
			},
			! singleProduct && {
				key: `${ option.id }.count`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.count]` ),
				label: __( 'Count selected', 'woocommerce-product-options' ),
			},
			! singleProduct && {
				key: `${ option.id }.min`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.min]` ),
				label: __( 'Min price of selected products', 'woocommerce-product-options' ),
			},
			! singleProduct && {
				key: `${ option.id }.max`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.max]` ),
				label: __( 'Max price of selected products', 'woocommerce-product-options' ),
			},
			! singleProduct && {
				key: `${ option.id }.total`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.total]` ),
				label: __( 'Total price of selected products', 'woocommerce-product-options' ),
			},
			singleProduct && {
				key: `${ option.id }.selected`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.selected]` ),
				label: __( 'If selected', 'woocommerce-product-options' ),
			},
			singleProduct && {
				key: `${ option.id }.price`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.price]` ),
				label: __( 'Selected product price', 'woocommerce-product-options' ),
			},
		];

		return renderDropdownButton( items.filter( Boolean ) );
	};

	const fileUploadButton = () => {
		const items = [
			{
				key: `${ option.id }.count`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.count]` ),
				label: __( 'File count', 'woocommerce-product-options' ),
			},
		];

		return renderDropdownButton( items.filter( Boolean ) );
	};

	const priceFormulaButton = () => {
		// const customVariables = option?.settings?.formula?.customVariables || [];
		const items = [
			{
				key: `${ option.id }`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }]` ),
				label: __( 'Result', 'woocommerce-product-options' ),
			},
			// {
			// 	key: `${ option.id }.variables`,
			// 	value: option.id,
			// 	label: 'Custom variables',
			// 	subItems: [
			// 		...customVariables.map( ( cVar ) => {
			// 			const sanitizedLabel = sanitize( cVar.name );
			// 			return {
			// 				key: `${ option.id }.${ sanitizedLabel }`,
			// 				value: cVar.name,
			// 				onClick: () => insertVariable( `[${ optionName }.${ sanitizedLabel }]` ),
			// 				label: `${ cVar.name }`,
			// 			};
			// 		} ),
			// 	],
			// }
		];
		return renderDropdownButton( items.filter( Boolean ) );
	};

	const customerPriceButton = () => {
		const items = [
			{
				key: `${ option.id }.value`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }]` ),
				label: option.name,
			},
		];
		return renderDropdownButton( items.filter( Boolean ) );
	};

	const dateButton = () => {
		const startOfWeek = parseInt( wpoSettings?.start_of_week, 10 ) || 0;
		const weekDays = [
			__( 'Sunday', 'default' ),
			__( 'Monday', 'default' ),
			__( 'Tuesday', 'default' ),
			__( 'Wednesday', 'default' ),
			__( 'Thursday', 'default' ),
			__( 'Friday', 'default' ),
			__( 'Saturday', 'default' ),
		];

		const items = [
			{
				key: `${ option.id }.daycount`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.daycount]` ),
				label: __( 'Number of days from today', 'woocommerce-product-options' ),
			},
			{
				key: `${ option.id }.year`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.year]` ),
				label: __( 'Year', 'woocommerce-product-options' ),
			},
			{
				key: `${ option.id }.month`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.month]` ),
				label: __( 'Month (1-12)', 'woocommerce-product-options' ),
			},
			{
				key: `${ option.id }.day`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.day]` ),
				label: __( 'Day (1-31)', 'woocommerce-product-options' ),
			},
			{
				key: `${ option.id }.weekday`,
				value: option.id,
				onClick: () => insertVariable( `[${ optionName }.weekday]` ),
				label: sprintf( __( 'Weekday (%s: 1 - %s: 7)', 'woocommerce-product-options' ), weekDays[ startOfWeek ], weekDays[ ( startOfWeek + 6 ) % 7 ] ),
			},
		];
		return renderDropdownButton( items.filter( Boolean ) );
	};

	switch ( option.type ) {
		case 'number':
		case 'price':
			return NumberButton( option );

		case 'text':
		case 'textarea':
			return textButton( option );

		case 'checkbox':
		case 'radio':
		case 'dropdown':
		case 'images':
		case 'color_swatches':
		case 'text_labels':
			return choiceButton( option );

		case 'file_upload':
			return fileUploadButton( option );

		case 'customer_price':
			return customerPriceButton( option );

		case 'datepicker':
			return dateButton( option );

		case 'price_formula':
			return priceFormulaButton( option );

		case 'product':
			return productButton( option );

		default:
			return <></>;
	}
};

export default FormulaVariableButton;
