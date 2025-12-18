import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/description', {
		title: __('User Bio', 'registration-form-for-woocommerce'),
		description: __(
			'User bio field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/default',
		keywords: [__('user bio')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M16 6a3 3 0 1 1-3 3 3 3 0 0 1 3-3Zm12 24H4V2h24Zm-10-4h-8v-2h8Zm4-4H10v-2h12Zm0-4H10v-2.29a8 8 0 0 1 12 0ZM6 28h20V4H6Z"
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
