import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/shipping-postcode', {
		title: __('Zip Code', 'registration-form-for-woocommerce'),
		description: __(
			'Zip code field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/shipping',
		keywords: [
			__('zip code', 'registration-form-for-woocommerce'),
			__('postal code', 'registration-form-for-woocommerce'),
		],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M22 8a2 2 0 1 1-2 2 2 2 0 0 1 2-2Zm0-2a4 4 0 1 0 4 4 4 4 0 0 0-4-4Zm8 24H2V10h12a8 8 0 0 1 16 0Zm-2-14.35A29.05 29.05 0 0 1 22 22s-6.3-4.74-7.71-10H11v2h2v2h-2v2h2v2h-2v2h2v2H9v-2H7v-2h2v-2H7v-2h2v-2H7v-2H4v16h24ZM28 10a6 6 0 0 0-12 0c0 3.42 3.64 7.34 6 9.41 2.36-2.07 6-5.99 6-9.41Z"
							fill="#000"
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
