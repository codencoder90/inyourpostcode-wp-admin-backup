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
			id="reg_userbio_field"
			className={`form-row field-width-${fieldWidth}${
				className && ' ' + className
			}`}
		>
			<label htmlFor="reg_userbio" style={hideLabel ? { display: 'none' } : {}}>
				{label} {required && <span className="required">*</span>}
			</label>
			<textarea
				placeholder={placeholder}
				className="input-text"
				name="description"
				rows="5"
				cols="30"
				id="reg_userbio"
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
