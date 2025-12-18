import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

import { InspectorControls } from '../../common';
import { useClientId, useUpdateLabel } from '../../hooks';

export default (props) => {
	const {
		attributes: {
			clientId,
			label,
			description,
			required,
			className,
			hasDescription,
			fieldWidth,
		},
		setAttributes,
	} = props;

	useClientId(props.clientId, setAttributes, props.attributes, 'range');

	useUpdateLabel(props, __('Range', 'registration-form-for-woocommerce'));

	return (
		<>
			<InspectorControls {...props} />
			<div
				data-id={`range_${clientId}`}
				className={`form-row field-width-${fieldWidth}${
					className && ' ' + className
				}`}
			>
				<RichText
					className={`tgwcfb-label ${required ? 'required' : ''}`}
					value={label}
					tagName="label"
					onChange={(val) => setAttributes({ label: val })}
					htmlFor={`number_${clientId}`}
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
				<div className="input-wrapper">
					<input
						type="range"
						disabled
						className="input-text tgwcfb-input"
						name={`range_${clientId}`}
						id={`range_${clientId}`}
					/>
					<input
						type="number"
						disabled
						className="input-text tgwcfb-input"
						name={`range_${clientId}`}
					/>
				</div>
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
