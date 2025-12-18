import { RichText } from "@wordpress/block-editor";
import { __ } from "@wordpress/i18n";

import { InspectorControls } from "../../common";
import { useClientId, useUpdateLabel } from "../../hooks";

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
			uploadLimit,
			fileTypes,
		},
		setAttributes,
	} = props;

	const allowedFileTypes = fileTypes?.length
		? fileTypes.join(",")
		: "image/jpeg,image/jpg,image/gif,image/png";

	useClientId(props.clientId, setAttributes, props.attributes, "file_upload");

	useUpdateLabel(
		props,
		__("File Upload", "registration-form-for-woocommerce")
	);

	return (
		<>
			<InspectorControls {...props} />

			<div
				disabled
				id={`file_upload_url_${clientId}_field`}
				className={`tgwcfb-file-upload-field form-row field-width-${fieldWidth}${
					className && " " + className
				}`}
				data-client-id={clientId}
				data-max-size={maxFileSize}
				data-allowed-types={allowedFileTypes}
				data-upload-limit={uploadLimit}
			>
				<RichText
					className={`tgwcfb-label ${required ? "required" : ""}`}
					value={label}
					tagName="label"
					onChange={(val) => setAttributes({ label: val })}
					allowedFormats={[]}
					placeholder={__(
						"Enter label",
						"registration-form-for-woocommerce"
					)}
				/>
				{!label && (
					<span
						style={{
							display: "inline-block",
							backgroundColor: "#ff02029c",
							color: "#fff",
							padding: "0 4px",
							borderRadius: "4px",
							fontSize: "12px",
						}}
					>
						{__(
							"Label is required",
							"registration-form-for-woocommerce"
						)}
					</span>
				)}

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

				<input
					type="hidden"
					name={`file_upload_url_${clientId}`}
					className="tgwcfb-file-upload-input"
				/>

				{description && hasDescription && (
					<span
						className="input-description"
						dangerouslySetInnerHTML={{ __html: description }}
					/>
				)}
			</div>
		</>
	);
};
