import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/checkbox', {
		title: __('Checkbox', 'registration-form-for-woocommerce'),
		description: __(
			'Checkbox field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/custom',
		keywords: [__('checkbox', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="m8.93 15.65 4.24 4.24 9.9-9.9 1.42 1.41-11.32 11.32-5.66-5.66ZM28 4H4v24h24Zm2 26H2V2h28Z"
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
