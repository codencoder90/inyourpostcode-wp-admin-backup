import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/shipping-company', {
		title: __('Company', 'registration-form-for-woocommerce'),
		description: __(
			'Shipping company field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/shipping',
		keywords: [__('company', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M16 4H4v24h2v-6h8v6h2V4Zm-2 6v2H6v-2ZM6 8V6h8v2Zm8 6v2H6v-2Zm0 4v2H6v-2Zm14-4H18v14h10Zm-2 6v2h-6v-2Zm-6-2v-2h6v2Zm6 6v2h-6v-2Zm4 6H2V2h16v10h12Z"
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
