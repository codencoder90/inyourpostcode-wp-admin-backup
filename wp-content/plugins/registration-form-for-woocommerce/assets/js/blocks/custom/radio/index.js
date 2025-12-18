import { registerBlockType } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import attributes from './attributes';
import edit from './edit';
import save from './save';

export default () => {
	registerBlockType('tgwcfb/radio', {
		title: __('Radio', 'registration-form-for-woocommerce'),
		description: __(
			'Radio field for WC registration form',
			'registration-form-for-woocommerce'
		),
		category: 'tgwcfb/custom',
		keywords: [__('radio', 'registration-form-for-woocommerce')],
		icon: (
			<Icon
				size={24}
				icon={
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
						<path
							d="M16 22a6 6 0 1 1 6-6 6 6 0 0 1-6 6Zm0-18a12 12 0 1 0 12 12A12 12 0 0 0 16 4Zm0 26a14 14 0 1 1 14-14 14 14 0 0 1-14 14Z"
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
