import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/shipping-address-1', {
		title: __('Street Address', 'registration-form-for-woocommerce'),
		description: __(
			'Street address field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/shipping',
		keywords: [__('street address', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M18 18h-2v-6h-2v-2a2 2 0 0 0 2-2h2Zm-2 12a47 47 0 0 1-3.74-3.54 33.47 33.47 0 0 1-5.93-8.21 11 11 0 1 1 19.34 0C22.74 24.48 16 30 16 30Zm0-8a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z"
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
	});
};
