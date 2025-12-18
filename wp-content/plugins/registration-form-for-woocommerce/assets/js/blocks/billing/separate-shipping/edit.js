import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

import { InspectorControls } from '../../common';
import { useUpdateLabel } from '../../hooks';

export default (props) => {
	const {
		attributes: {
			label,
			description,
			required,
			className,
			hasDescription,
			fieldWidth,
		},
		setAttributes,
	} = props;

	useUpdateLabel(
		props,
		__('Ship to different address', 'registration-form-for-woocommerce')
	);

	return (
		<>
			<InspectorControls {...props} />
			<>
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
						htmlFor="separate_shipping"
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
						type="checkbox"
						disabled
						className="input-text tgwcfb-input"
						name="separate_shipping"
						id="separate_shipping"
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
		</>
	);
};
