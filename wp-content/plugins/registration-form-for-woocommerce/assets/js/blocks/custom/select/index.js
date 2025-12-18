import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/select', {
		title: __('Select', 'registration-form-for-woocommerce'),
		description: __(
			'Select field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/custom',
		keywords: [__('select', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M10 10v12h12V10Zm8-8h4v2h-4Zm0 26h4v2h-4ZM10 2h4v2h-4Zm0 26h4v2h-4ZM2 10h2v4H2Zm0 8h2v4H2Zm4 12H2v-4h2v2h2ZM6 4H4v2H2V2h4Zm18 20H8V8h16Zm6 4v2h-4v-2h2v-2h2Zm0-6h-2v-4h2Zm0-8h-2v-4h2Zm0-10v2h-2V4h-2V2h4Z"
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
