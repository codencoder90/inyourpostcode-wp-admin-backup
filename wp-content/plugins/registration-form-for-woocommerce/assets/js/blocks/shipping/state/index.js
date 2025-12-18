import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/shipping-state', {
		title: __('State', 'registration-form-for-woocommerce'),
		description: __(
			'State field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/shipping',
		keywords: [__('state', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M28 16v-4h2v-1L16 4 2 11v1h2v4h2v10H2v2h28v-2h-4V16ZM16 6.24 23.53 10H8.47ZM26 12v2H6v-2ZM8 26V16h4v10Zm6 0V16h4v10Zm10 0h-4V16h4Z"
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
