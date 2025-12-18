import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/multi-select', {
		title: __('Multi Select', 'registration-form-for-woocommerce'),
		description: __(
			'Multi select field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/custom',
		keywords: [__('multi select', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M26 2h4v4h-2V4h-2Zm2 12v-4h2v4Zm2 4v4h-2v-4ZM18 2h4v2h-4Zm0 26h4v2h-4ZM10 2h4v2h-4Zm0 26h4v2h-4ZM2 2h4v2H4v2H2Zm0 8h2v4H2Zm0 8h2v4H2Zm0 12v-4h2v2h2v2H2Zm24-8h-4v4H6V10h4V6h16Zm0 6h2v-2h2v4h-4Zm-6-16H8v12h12Zm4-4H12v2h10v10h2Z"
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
