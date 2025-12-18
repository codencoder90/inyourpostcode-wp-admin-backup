import { __ } from "@wordpress/i18n";
import defaultProfilePicture from "../../../../images/default_profile.png";

export default (props) => {
	const {
		attributes: {
			clientId,
			label,
			description,
			hideLabel,
			required,
			className,
			hasDescription,
			fieldWidth,
			maxFileSize,
			fileTypes,
			uploadLimit,
		},
	} = props;

	const allowedFileTypes = fileTypes?.length
		? fileTypes.join(",")
		: "image/jpeg,image/jpg,image/gif,image/png";

	return (
		<div
			id={`file_upload_url_${clientId}_field`}
			className={`tgwcfb-file-upload-field form-row field-width-${fieldWidth}${
				className && " " + className
			}`}
			data-client-id={clientId}
			data-max-size={maxFileSize}
			data-allowed-types={allowedFileTypes}
			data-upload-limit={uploadLimit}
		>
			<label style={hideLabel ? { display: "none" } : {}}>
				{label} {required && <span className="required">*</span>}
			</label>

			<div className="tgwcfb-dropzone">
				<div className="dz-message">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 32 32"
						width="32px"
						height="32px"
						fill="#868e96"
					>
						<path
							className="cls-1"
							d="M18.12,17.52,17,16.4V25a1,1,0,0,1-2,0V16.4l-1.12,1.12a1,1,0,0,1-1.42,0,1,1,0,0,1,0-1.41l2.83-2.83a1,1,0,0,1,1.42,0l2.83,2.83a1,1,0,0,1-.71,1.7A1,1,0,0,1,18.12,17.52ZM22,22H20a1,1,0,0,1,0-2h2a4,4,0,0,0,.27-8,1,1,0,0,1-.84-.57,6,6,0,0,0-11.36,1.69,1,1,0,0,1-1,.86H9A3,3,0,0,0,9,20h3a1,1,0,0,1,0,2H9a5,5,0,0,1-.75-9.94A8,8,0,0,1,23,10.1,6,6,0,0,1,22,22Z"
						/>
					</svg>
					<span className="title">
						{__(
							"Drop files here or click to upload",
							"registration-form-for-woocommerce"
						)}
					</span>
					<span className="hint">
						{uploadLimit > 1
							? __(
									`You can upload up to ${uploadLimit} files.`,
									"registration-form-for-woocommerce"
							  )
							: __(
									"You can upload 1 file.",
									"registration-form-for-woocommerce"
							  )}
					</span>
				</div>
			</div>
			<input type="hidden" className="tgwcfb-file-upload" />

			{description && hasDescription && (
				<span
					className="input-description"
					dangerouslySetInnerHTML={{ __html: description }}
				/>
			)}
		</div>
	);
};
