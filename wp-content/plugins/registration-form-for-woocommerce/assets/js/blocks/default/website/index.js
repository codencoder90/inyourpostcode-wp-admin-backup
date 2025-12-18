import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/url', {
		title: __('Website', 'registration-form-for-woocommerce'),
		description: __(
			'Website field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/default',
		keywords: [
			__('website', 'registration-form-for-woocommerce'),
			__('url', 'registration-form-for-woocommerce'),
		],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M28 12a7.94 7.94 0 0 0-.67-3.2 16.27 16.27 0 0 1-2.49.72 19.3 19.3 0 0 1 0 5 16.27 16.27 0 0 1 2.49.72A7.94 7.94 0 0 0 28 12Zm-1.73 5a12.35 12.35 0 0 0-1.8-.5 11.83 11.83 0 0 1-1 2.75 8 8 0 0 0 2.8-2.25Zm-1.8-9.4a12.86 12.86 0 0 0 1.81-.5 8.13 8.13 0 0 0-2.82-2.3 11.83 11.83 0 0 1 1.01 2.75ZM20 20c.72 0 1.85-1.41 2.49-3.86a22.21 22.21 0 0 0-5 0C18.15 18.59 19.28 20 20 20Zm-2.87-5.83a24.31 24.31 0 0 1 5.74 0 18.18 18.18 0 0 0 0-4.34A24.45 24.45 0 0 1 20 10a24.45 24.45 0 0 1-2.87-.17 18.18 18.18 0 0 0 0 4.34Zm5.36-6.31C21.85 5.41 20.72 4 20 4s-1.85 1.41-2.49 3.86A22.25 22.25 0 0 0 20 8a22.25 22.25 0 0 0 2.49-.14ZM16.54 19.2a11.83 11.83 0 0 1-1-2.75 12.86 12.86 0 0 0-1.81.5 8.13 8.13 0 0 0 2.81 2.25Zm0-14.4a8 8 0 0 0-2.81 2.25 12.35 12.35 0 0 0 1.8.5 11.83 11.83 0 0 1 1.01-2.75Zm-3.87 10.4a16.27 16.27 0 0 1 2.49-.72 19.3 19.3 0 0 1 0-5 16.27 16.27 0 0 1-2.49-.72 8 8 0 0 0 0 6.4ZM26 20a10 10 0 0 1-16-8 10 10 0 0 1 .2-2H6v14h20Zm4 10H2v-2h28Zm-2-12v8H4V8h6.84A10 10 0 1 1 28 18Z"
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
