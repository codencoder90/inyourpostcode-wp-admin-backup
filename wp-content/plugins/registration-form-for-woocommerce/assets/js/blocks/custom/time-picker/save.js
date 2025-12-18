export default (props) => {
	const {
		attributes: {
			clientId,
			label,
			description,
			placeholder,
			hideLabel,
			required,
			className,
			hasDescription,
			fieldWidth,
		},
	} = props;

	return (
		<p
			id={`time_picker_${clientId}_field`}
			className={`form-row field-width-${fieldWidth}${
				className && ' ' + className
			}`}
		>
			<label
				htmlFor={`time_picker_${clientId}`}
				style={hideLabel ? { display: 'none' } : {}}
			>
				{label} {required && <span className="required">*</span>}
			</label>
			<input
				type="text"
				placeholder={placeholder}
				className="input-text input-time tgwcfb-input-time"
				name={`time_picker_${clientId}`}
				id={`time_picker_${clientId}`}
			/>
			{description && hasDescription && (
				<span
					className="input-description"
					dangerouslySetInnerHTML={{ __html: description }}
				/>
			)}
		</p>
	);
};
