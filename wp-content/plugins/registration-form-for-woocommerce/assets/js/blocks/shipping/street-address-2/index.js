import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/shipping-address-2', {
		title: __('Street Address 2', 'registration-form-for-woocommerce'),
		description: __(
			'Street address 2 field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/shipping',
		keywords: [__('street address 2', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M16 22a9 9 0 1 0-9-9 9 9 0 0 0 9 9Zm3-6v2h-6v-2a1.21 1.21 0 0 1 .34-.78l3.5-3.5a1 1 0 0 0 0-1.44.93.93 0 0 0-.26-.18A1.91 1.91 0 0 0 16 10a1.92 1.92 0 0 0-.72.14 2 2 0 0 0-1.16 1.2l-1.63-1.22a4 4 0 0 1 3-2.07 3 3 0 0 1 1.89.22 3.11 3.11 0 0 1 .87.59A3 3 0 0 1 19 12a3 3 0 0 1-.7 1.14L15.41 16Zm6.67 2.25C22.74 24.48 16 30 16 30s-6.74-5.52-9.67-11.75a11 11 0 1 1 19.34 0Z"
							fill="#000"
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
