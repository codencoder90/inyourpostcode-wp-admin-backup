import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/display-name', {
		title: __('Display Name', 'registration-form-for-woocommerce'),
		description: __(
			'Display name field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/default',
		keywords: [__('display name', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M22 24H10v-2.29a8 8 0 0 1 12 0ZM12 8V6h8v2Zm7 7a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm9 15H4V2h24ZM26 4H6v24h20Z"
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
