import { __ } from '@wordpress/i18n';

import defaultProfilePicture from '../../../../images/default_profile.png';

export default (props) => {
	const {
		attributes: {
			label,
			description,
			hideLabel,
			required,
			className,
			hasDescription,
			fieldWidth,
			maxFileSize,
			fileTypes,
		},
	} = props;

	const allowedFileTypes = fileTypes?.length
		? fileTypes.join(',')
		: 'image/jpeg,image/jpg,image/gif,image/png';

	return (
		<p
			id={`profile_picture_url_field`}
			className={`tgwcfb-profile-picture-upload-field form-row field-width-${fieldWidth}${
				className && ' ' + className
			}`}
		>
			{/* eslint-disable-next-line jsx-a11y/label-has-for */}
			<label style={hideLabel ? { display: 'none' } : {}}>
				{label} {required && <span className="required">*</span>}
			</label>
			<span className="profile-picture-wrapper">
				<img
					className="profile-picture-preview"
					src={defaultProfilePicture}
					alt={__('Profile picture', 'registration-form-for-woocommerce')}
					style={{ maxHeight: '96px', maxWidth: '96px' }}
				/>
			</span>
			<button
				type="submit"
				className="button tgwcfb-upload-profile-picture hide-if-no-js"
			>
				{__('Upload Image', 'registration-form-for-woocommerce')}
			</button>
			<button
				type="submit"
				className="button tgwcfb-remove-profile-picture hide-if-no-js"
				style={{ display: 'none' }}
			>
				{__('Remove', 'registration-form-for-woocommerce')}
			</button>
			<span
				className="tgwcfb-profile-picture-upload-node"
				style={{
					height: 0,
					width: 0,
					margin: 0,
					padding: 0,
					float: 'left',
					border: 0,
					overflow: 'hidden',
				}}
			>
				<input
					type="file"
					name="profile_picture"
					size={maxFileSize || null}
					accept={allowedFileTypes}
				/>
				<input
					type="text"
					name="profile_picture_url"
					className="tgwcfb-profile-picture-input"
				/>
			</span>
			{description && hasDescription && (
				<span
					className="input-description"
					dangerouslySetInnerHTML={{ __html: description }}
				/>
			)}
		</p>
	);
};
