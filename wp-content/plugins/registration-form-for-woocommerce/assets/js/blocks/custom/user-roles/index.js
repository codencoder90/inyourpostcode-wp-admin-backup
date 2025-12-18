import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/user-roles', {
		title: __('User Roles', 'registration-form-for-woocommerce'),
		description: __(
			'User roles field is Premium field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/custom',
		keywords: [__('user roles', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M29.82 28.85a13.91 13.91 0 0 0-10.69-11.49 8 8 0 1 0-6.26 0A13.91 13.91 0 0 0 2.18 28.85L2 30h28ZM10 10a6 6 0 1 1 6 6 6 6 0 0 1-6-6ZM4.39 28a12 12 0 0 1 23.22 0Z"
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
