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
		},
	} = props;

	return (
		<p
			id="reg_email_field"
			className={`form-row field-width-${fieldWidth}${
				className && ' ' + className
			}`}
		>
			<label htmlFor="reg_email" style={hideLabel ? { display: 'none' } : {}}>
				{label} {required && <span className="required">*</span>}
			</label>
			<input
				type="email"
				placeholder={placeholder}
				className="input-text"
				name="email"
				id="reg_email"
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
