import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/billing-email', {
		title: __('Email', 'registration-form-for-woocommerce'),
		description: __('Billing email field for WC registration form'),
		category: 'tgwcfb/billing',
		keywords: [
			__('email', 'registration-form-for-woocommerce'),
			__('billing', 'registration-form-for-woocommerce'),
		],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							fill="#000000"
							d="M2 6v20h28V6Zm14 12.59L5.41 8h21.18Zm0 2.82 4-4L26.59 24H5.41L12 17.41Zm12-12v13.18L21.41 16ZM10.59 16 4 22.59V9.41Z"
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
