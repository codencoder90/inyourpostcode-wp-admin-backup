import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/separate-shipping', {
		title: __('Separate Shipping', 'registration-form-for-woocommerce'),
		description: __(
			'Separate shipping field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/billing',
		keywords: [__('separate shipping', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M8 25.84l1.75-1.4 1.25-1 1.25 1 3.75 3 3.75-3 1.25-1 1.25 1 1.75 1.4V6.16l-1.75 1.4-1.25 1-1.25-1-3.75-3-3.75 3-1.25 1-1.25-1L8 6.16zM22 21H10v-2h12zm0-4H10v-2h12zm0-4H10v-2h12zm4 17l-5-4-5 4-5-4-5 4V2l5 4 5-4 5 4 5-4z"
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
