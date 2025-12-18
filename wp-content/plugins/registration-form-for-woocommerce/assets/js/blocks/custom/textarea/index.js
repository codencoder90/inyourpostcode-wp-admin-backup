import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/textarea', {
		title: __('Textarea', 'registration-form-for-woocommerce'),
		description: __(
			'Textarea field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/custom',
		keywords: [__('textarea', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M6 8h6v2h-2v6H8v-6H6Zm22 12.83L22.83 26H28ZM28 6H4v20h16l8-8Zm2 10v12H2V4h28Z"
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
