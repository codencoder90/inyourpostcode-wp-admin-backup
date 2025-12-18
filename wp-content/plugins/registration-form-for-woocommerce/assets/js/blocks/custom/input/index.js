import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/input', {
		title: __('Input', 'registration-form-for-woocommerce'),
		description: __(
			'Input field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/custom',
		keywords: [__('input', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M24 8V6h2V4h-6v2h2v2H2v20h28V8Zm4 18H4V10h18v12h-2v2h6v-2h-2V10h4Z"
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
