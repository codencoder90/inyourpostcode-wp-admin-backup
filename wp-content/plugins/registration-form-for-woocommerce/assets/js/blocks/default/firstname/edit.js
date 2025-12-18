import { RichText } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { InspectorControls } from '../../common';
import { useUpdateLabel } from '../../hooks';

export default (props) => {
	const {
		attributes: {
			label,
			description,
			placeholder,
			required,
			className,
			hasDescription,
			fieldWidth,
			edited,
		},
		setAttributes,
	} = props;

	useEffect(() => {
		if (!edited) {
			setAttributes({
				label: __('First Name', 'registration-form-for-woocommerce'),
				edited: true,
			});
		}
	}, []);

	useUpdateLabel(props, __('First name', 'registration-form-for-woocommerce'));

	return (
		<>
			<InspectorControls {...props} />
			<div
				className={`form-row field-width-${fieldWidth}${
					className && ' ' + className
				}`}
			>
				<RichText
					className={`tgwcfb-label ${required ? 'required' : ''}`}
					value={label}
					tagName="label"
					onChange={(val) => setAttributes({ label: val })}
					htmlFor="reg_firstname"
					allowedFormats={[]}
					placeholder={__('Enter label', 'registration-form-for-woocommerce')}
				/>
				{!label && (
					<span
						style={{
							display: 'inline-block',
							backgroundColor: '#ff02029c',
							color: '#fff',
							padding: '0 4px',
							borderRadius: '4px',
							fontSize: '12px',
						}}
					>
						{__('Label is required', 'registration-form-for-woocommerce')}
					</span>
				)}
				<input
					type="text"
					placeholder={placeholder}
					disabled
					className="input-text tgwcfb-input"
					name="firstname"
					id="reg_firstname"
				/>
				{hasDescription && (
					<RichText
						className="input-description"
						value={description}
						tagName="span"
						placeholder={__(
							'Enter description',
							'registration-form-for-woocommerce'
						)}
						onChange={(val) => setAttributes({ description: val })}
						allowedFormats={['core/italic']}
					/>
				)}
			</div>
		</>
	);
};
