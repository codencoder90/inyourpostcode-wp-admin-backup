import { __ } from '@wordpress/i18n';
import {
	checkbox,
	colorSwatches,
	customerPrice,
	datePicker,
	dropdown,
	fileUpload,
	html,
	imageButtons,
	number,
	paragraph,
	priceFormula,
	radio,
	textInput,
	textLabels,
	visualEditor,
	productSelect,
} from './svg';

export const optionTypes = [
	{
		key: 'checkbox',
		icon: checkbox,
		label: __( 'Checkboxes', 'woocommerce-product-options' ),
		operators: [
			{
				key: 'contains',
				label: __( 'Contains', 'woocommerce-product-options' ),
				comparison: 'choices',
			},
			{
				key: 'not_contains',
				label: __( 'Does not contain', 'woocommerce-product-options' ),
				comparison: 'choices',
			},
		],
	},
	{
		key: 'radio',
		icon: radio,
		label: __( 'Radio buttons', 'woocommerce-product-options' ),
		operators: [
			{
				key: 'equals',
				label: __( 'Equals', 'woocommerce-product-options' ),
				comparison: 'choices',
			},
			{
				key: 'not_equals',
				label: __( 'Does not equal', 'woocommerce-product-options' ),
				comparison: 'choices',
			},
		],
	},
	{
		key: 'dropdown',
		icon: dropdown,
		label: __( 'Dropdown select', 'woocommerce-product-options' ),
		operators: [
			{
				key: 'equals',
				label: __( 'Equals', 'woocommerce-product-options' ),
				comparison: 'choices',
			},
			{
				key: 'not_equals',
				label: __( 'Does not equal', 'woocommerce-product-options' ),
				comparison: 'choices',
			},
		],
	},
	{
		key: 'text',
		icon: textInput,
		label: __( 'Text input', 'woocommerce-product-options' ),
		operators: [
			{
				key: 'equals',
				label: __( 'Equals', 'woocommerce-product-options' ),
				comparison: 'text',
			},
			{
				key: 'not_equals',
				label: __( 'Does not equal', 'woocommerce-product-options' ),
				comparison: 'text',
			},
			{
				key: 'empty',
				label: __( 'Is empty', 'woocommerce-product-options' ),
				comparison: null,
			},
			{
				key: 'not_empty',
				label: __( 'Is not empty', 'woocommerce-product-options' ),
				comparison: null,
			},
		],
	},
	{
		key: 'textarea',
		icon: paragraph,
		label: __( 'Paragraph', 'woocommerce-product-options' ),
		operators: [
			{
				key: 'equals',
				label: __( 'Equals', 'woocommerce-product-options' ),
				comparison: 'text',
			},
			{
				key: 'not_equals',
				label: __( 'Does not equal', 'woocommerce-product-options' ),
				comparison: 'text',
			},
			{
				key: 'empty',
				label: __( 'Is empty', 'woocommerce-product-options' ),
				comparison: null,
			},
			{
				key: 'not_empty',
				label: __( 'Is not empty', 'woocommerce-product-options' ),
				comparison: null,
			},
		],
	},
	{
		key: 'number',
		icon: number,
		label: __( 'Number', 'woocommerce-product-options' ),
		operators: [
			{
				key: 'empty',
				label: __( 'Is empty', 'woocommerce-product-options' ),
				comparison: null,
			},
			{
				key: 'not_empty',
				label: __( 'Is not empty', 'woocommerce-product-options' ),
				comparison: null,
			},
			{
				key: 'equals',
				label: __( 'Equals', 'woocommerce-product-options' ),
				comparison: 'number',
			},
			{
				key: 'not_equals',
				label: __( 'Does not equal', 'woocommerce-product-options' ),
				comparison: 'number',
			},
			{
				key: 'greater',
				label: __( 'Greater than', 'woocommerce-product-options' ),
				comparison: 'number',
			},
			{
				key: 'less',
				label: __( 'Less than', 'woocommerce-product-options' ),
				comparison: 'number',
			},
		],
	},
	{
		key: 'file_upload',
		icon: fileUpload,
		label: __( 'File upload', 'woocommerce-product-options' ),
		operators: [
			{
				key: 'not_empty',
				label: __( 'Has an upload', 'woocommerce-product-options' ),
				comparison: null,
			},
			{
				key: 'empty',
				label: __( 'Does not have an upload', 'woocommerce-product-options' ),
				comparison: null,
			},
		],
	},
	{
		key: 'images',
		icon: imageButtons,
		label: __( 'Image buttons', 'woocommerce-product-options' ),
		operators: [
			{
				key: 'equals',
				label: __( 'Equals', 'woocommerce-product-options' ),
				comparison: 'choices',
			},
			{
				key: 'not_equals',
				label: __( 'Does not equal', 'woocommerce-product-options' ),
				comparison: 'choices',
			},
		],
	},
	{
		key: 'color_swatches',
		icon: colorSwatches,
		label: __( 'Color swatches', 'woocommerce-product-options' ),
		operators: [
			{
				key: 'equals',
				label: __( 'Equals', 'woocommerce-product-options' ),
				comparison: 'choices',
			},
			{
				key: 'not_equals',
				label: __( 'Does not equal', 'woocommerce-product-options' ),
				comparison: 'choices',
			},
		],
	},
	{
		key: 'text_labels',
		icon: textLabels,
		label: __( 'Text labels', 'woocommerce-product-options' ),
		operators: [
			{
				key: 'equals',
				label: __( 'Equals', 'woocommerce-product-options' ),
				comparison: 'choices',
			},
			{
				key: 'not_equals',
				label: __( 'Does not equal', 'woocommerce-product-options' ),
				comparison: 'choices',
			},
		],
	},
	{
		key: 'customer_price',
		icon: customerPrice,
		label: __( 'Customer defined price', 'woocommerce-product-options' ),
		operators: [
			{
				key: 'empty',
				label: __( 'Is empty', 'woocommerce-product-options' ),
				comparison: null,
			},
			{
				key: 'not_empty',
				label: __( 'Is not empty', 'woocommerce-product-options' ),
				comparison: null,
			},
			{
				key: 'equals',
				label: __( 'Equals', 'woocommerce-product-options' ),
				comparison: 'number',
			},
			{
				key: 'not_equals',
				label: __( 'Does not equal', 'woocommerce-product-options' ),
				comparison: 'number',
			},
			{
				key: 'greater',
				label: __( 'Greater than', 'woocommerce-product-options' ),
				comparison: 'number',
			},
			{
				key: 'less',
				label: __( 'Less than', 'woocommerce-product-options' ),
				comparison: 'number',
			},
		],
	},
	{
		key: 'datepicker',
		icon: datePicker,
		label: __( 'Date', 'woocommerce-product-options' ),
		operators: [
			{
				key: 'empty',
				label: __( 'Is empty', 'woocommerce-product-options' ),
				comparison: null,
			},
			{
				key: 'not_empty',
				label: __( 'Is not empty', 'woocommerce-product-options' ),
				comparison: null,
			},
			{
				key: 'date_equals',
				label: __( 'Equals', 'woocommerce-product-options' ),
				comparison: 'date',
			},
			{
				key: 'date_not_equals',
				label: __( 'Does not equal', 'woocommerce-product-options' ),
				comparison: 'date',
			},
			{
				key: 'date_greater',
				label: __( 'Greater than', 'woocommerce-product-options' ),
				comparison: 'date',
			},
			{
				key: 'date_less',
				label: __( 'Less than', 'woocommerce-product-options' ),
				comparison: 'date',
			},
		],
	},
	{
		key: 'price_formula',
		icon: priceFormula,
		label: __( 'Price formula', 'woocommerce-product-options' ),
		operators: [],
	},
	{
		key: 'product',
		icon: productSelect,
		label: __( 'Products', 'woocommerce-product-options' ),
		operators: [
			{
				key: 'equals',
				label: __( 'Equals', 'woocommerce-product-options' ),
				comparison: 'choices',
			},
			{
				key: 'not_equals',
				label: __( 'Does not equal', 'woocommerce-product-options' ),
				comparison: 'choices',
			},
		],
	},
];

export const visualOptionTypes = [
	{
		key: 'wysiwyg',
		icon: visualEditor,
		label: __( 'Visual editor', 'woocommerce-product-options' ),
		operators: [],
	},
	{
		key: 'html',
		icon: html,
		label: __( 'HTML', 'woocommerce-product-options' ),
		operators: [],
	},
];

export const defaultOperators = [
	{
		key: 'equals',
		label: __( 'Equals', 'woocommerce-product-options' ),
		comparison: 'choices',
	},
	{
		key: 'not_equals',
		label: __( 'Does not equal', 'woocommerce-product-options' ),
		comparison: 'choices',
	},
];
