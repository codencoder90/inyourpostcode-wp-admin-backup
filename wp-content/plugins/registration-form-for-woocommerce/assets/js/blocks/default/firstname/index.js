import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/first-name', {
		title: __('First Name', 'registration-form-for-woocommerce'),
		description: __(
			'First name field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/default',
		keywords: [__('username')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							fill="#000000"
							d="M12 14a3 3 0 1 1-3 3 3 3 0 0 1 3-3Zm-6 9.71a8 8 0 0 1 12 0V26H6ZM28 28H4V12h18v6h-2v2h6v-2h-2v-6h4Zm2-18h-6V4h2V2h-6v2h2v6H2v20h28Z"
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
