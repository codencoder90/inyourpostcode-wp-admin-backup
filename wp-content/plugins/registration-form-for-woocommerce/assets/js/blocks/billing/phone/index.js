import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/billing-phone', {
		title: __('Phone', 'registration-form-for-woocommerce'),
		description: __(
			'Billing phone field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/billing',
		keywords: [__('phone', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M8 4v24h16V4Zm6 4h-2V6h2Zm2 18a1 1 0 1 1 1-1 1 1 0 0 1-1 1Zm4-18h-4V6h4Zm6 22H6V2h20Z"
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
