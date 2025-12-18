export default (props) => {
	const {
		attributes: {
			label,
			description,
			placeholder,
			hideLabel,
			required,
			className,
			fieldWidth,
			clientId,
		},
	} = props;

	return (
		<p
			id={`secondary_email_${clientId}_field`}
			className={`form-row field-width-${fieldWidth}${
				className && ' ' + className
			}`}
		>
			<label
				htmlFor={`secondary_email_${clientId}`}
				style={hideLabel ? { display: 'none' } : {}}
			>
				{label} {required && <span className="required">*</span>}
			</label>
			<input
				type="email"
				placeholder={placeholder}
				className="input-text"
				name={`secondary_email_${clientId}`}
				id={`secondary_email_${clientId}`}
				autoComplete="email"
			/>
			{description && (
				<span
					className="input-description"
					dangerouslySetInnerHTML={{ __html: description }}
				/>
			)}
		</p>
	);
};
