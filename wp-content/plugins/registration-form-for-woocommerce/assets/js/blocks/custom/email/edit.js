import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

import { InspectorControls } from '../../common';
import { useClientId, useUpdateLabel } from '../../hooks';

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
			clientId,
		},
		setAttributes,
	} = props;

	useClientId(props.clientId, setAttributes, props.attributes, 'email');

	useUpdateLabel(
		props,
		__('Secondary Email address', 'registration-form-for-woocommerce')
	);

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
					htmlFor={`secondary_email_${clientId}_field`}
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
					type="email"
					placeholder={placeholder}
					disabled
					className="input-text tgwcfb-input"
					name={`secondary_email_${clientId}_field`}
					id={`secondary_email_${clientId}_field`}
					autoComplete="email"
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
