import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/password', {
		title: __('Password', 'registration-form-for-woocommerce'),
		description: __(
			'Password field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/default',
		keywords: [__('password', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M12 10h8V8a4 4 0 0 0-8 0ZM6 28h20V12H6Zm4-6a2 2 0 1 1 2-2 2 2 0 0 1-2 2Zm6 0a2 2 0 1 1 2-2 2 2 0 0 1-2 2Zm6 0a2 2 0 1 1 2-2 2 2 0 0 1-2 2Zm6 8H4V10h6V8a6 6 0 0 1 12 0v2h6Z"
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
