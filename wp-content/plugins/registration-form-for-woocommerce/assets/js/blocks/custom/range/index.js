import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/range', {
		title: __('Range', 'registration-form-for-woocommerce'),
		description: __(
			'Range field is Premium field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/custom',
		keywords: [__('range', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							fill="#000"
							d="M29 8H17.9a5 5 0 0 0-9.8 0H3a1 1 0 0 0 0 2h5.1a5 5 0 0 0 9.8 0H29a1 1 0 0 0 0-2Zm-16 5a4 4 0 0 1-3.87-3 3.91 3.91 0 0 1 0-2 4 4 0 0 1 7.74 0 3.91 3.91 0 0 1 0 2A4 4 0 0 1 13 13ZM3 24h11.1a5 5 0 0 0 9.8 0H29a1 1 0 0 0 0-2h-5.1a5 5 0 0 0-9.8 0H3a1 1 0 0 0 0 2Zm16-5a4 4 0 0 1 3.87 3 3.91 3.91 0 0 1 0 2 4 4 0 0 1-7.74 0 3.91 3.91 0 0 1 0-2A4 4 0 0 1 19 19Z"
						/>
					</svg>
				}
			/>
		),
		attributes,
		supports: {
			className: false,
			customClassName: false,
		},
		edit,
		save,
	});
};
