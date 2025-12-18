import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/time-picker', {
		title: __('Time Picker', 'registration-form-for-woocommerce'),
		description: __(
			'Time picker field is Premium field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/custom',
		keywords: [__('time picker', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M17 6h2v7h7v2h-9Zm-3 16a4 4 0 1 0-4 4 4 4 0 0 0 4-4Zm14-8a10 10 0 1 0-19.74 2.26 6.11 6.11 0 0 1 .74-.17V14h2v2.09A6 6 0 0 1 15.91 21H18v2h-2.09a6.11 6.11 0 0 1-.17.74A10 10 0 0 0 28 14ZM18 26a11.74 11.74 0 0 1-3.18-.44A6 6 0 0 1 11 27.91V30H9v-2.09A6 6 0 0 1 4.09 23H2v-2h2.09a6 6 0 0 1 2.34-3.81A12.21 12.21 0 0 1 6 14a12 12 0 1 1 12 12Z"
							fill="#000000"
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
