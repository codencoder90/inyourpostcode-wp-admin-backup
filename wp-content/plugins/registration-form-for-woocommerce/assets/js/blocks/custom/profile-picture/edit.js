import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

import defaultProfilePicture from '../../../../images/default_profile.png';
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
		__('Profile picture', 'registration-form-for-woocommerce')
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
				<div className="profile-picture-wrapper">
					<img
						src={defaultProfilePicture}
						className="profile-picture-preview"
						alt={__('Profile picture', 'registration-form-for-woocommerce')}
					/>
				</div>
				<button disabled className="button">
					{__('Upload Image', 'registration-form-for-woocommerce')}
				</button>
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
