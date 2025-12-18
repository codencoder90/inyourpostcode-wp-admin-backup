import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/number', {
		title: __('Number', 'registration-form-for-woocommerce'),
		description: __(
			'Number field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/custom',
		keywords: [__('number', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M4 28h24V4H4Zm14-14h-4v4h4Zm2 10h-2v-4h-4v4h-2v-4H8v-2h4v-4H8v-2h4V8h2v4h4V8h2v4h4v2h-4v4h4v2h-4Zm10 6H2V2h28Z"
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
