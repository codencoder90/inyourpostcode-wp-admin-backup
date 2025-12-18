import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/shipping-last-name', {
		title: __('Last Name', 'registration-form-for-woocommerce'),
		description: __(
			'Shipping last name field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/shipping',
		keywords: [__('lastname', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							fill="#000000"
							d="M23 17a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm3 9H14v-2.29a8 8 0 0 1 12 0ZM4 12h4v6H6v2h6v-2h-2v-6h18v16H4ZM2 30h28V10H10V4h2V2H6v2h2v6H2Z"
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
