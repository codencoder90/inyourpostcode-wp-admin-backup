import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/nickname', {
		title: __('Nickname', 'registration-form-for-woocommerce'),
		description: __(
			'Nickname field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/default',
		keywords: [__('nickname')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M23 21a5 5 0 1 0-5-5 5 5 0 0 0 5 5ZM9 21a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm7-16a11 11 0 0 0-8.64 4.2A6.82 6.82 0 0 1 9 9a7 7 0 0 1 0 14 7.45 7.45 0 0 1-1.65-.2 11 11 0 0 0 17.29 0A6.76 6.76 0 0 1 23 23a7 7 0 0 1 0-14 7.18 7.18 0 0 1 1.62.19A10.94 10.94 0 0 0 16 5ZM7 16a2 2 0 1 1 2 2 2 2 0 0 1-2-2Zm16 2a2 2 0 1 1 2-2 2 2 0 0 1-2 2Zm5.07 2.82q-.2.49-.42 1a13 13 0 0 1-23.57-.62l.17-.07-.17.07-.15-.39a7 7 0 0 1 0-9.67 13 13 0 0 1 24.12.06 7 7 0 0 1 0 9.64Z"
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
