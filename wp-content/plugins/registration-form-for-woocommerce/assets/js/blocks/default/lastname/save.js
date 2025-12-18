export default (props) => {
	const {
		attributes: {
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
			id="reg_lastname_field"
			className={`form-row field-width-${fieldWidth}${
				className && ' ' + className
			}`}
		>
			<label
				htmlFor="reg_lastname"
				style={hideLabel ? { display: 'none' } : {}}
			>
				{label} {required && <span className="required">*</span>}
			</label>
			<input
				type="text"
				placeholder={placeholder}
				className="input-text"
				name="last_name"
				id="reg_lastname"
				autoComplete="family-name"
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
