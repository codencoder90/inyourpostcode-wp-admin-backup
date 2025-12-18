import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';
import deprecated from './deprecated';

export default () => {
	registerBlockType('tgwcfb/shipping-country', {
		title: __('Country / Region', 'registration-form-for-woocommerce'),
		description: __('Shipping country field for WC registration form'),
		category: 'tgwcfb/shipping',
		keywords: [
			__('country region', 'registration-form-for-woocommerce'),
			__('shipping', 'registration-form-for-woocommerce'),
		],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="m27.08 16-4.8-6 4.8-6H10V2H8v26H6v2h6v-2h-2V16ZM22.92 6l-3.2 4 3.2 4H10V6Z"
							fill="#000000"
						/>
					</svg>
				}
			/>
		),
		attributes,
		supports: {
			multiple: false,
			className: false,
			customClassName: false,
		},
		edit,
		save,
		deprecated:deprecated
	});
};
