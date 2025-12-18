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
			id="billing_email_field"
			className={`form-row field-width-${fieldWidth}${
				className && ' ' + className
			}`}
		>
			<label
				htmlFor="billing_email"
				style={hideLabel ? { display: 'none' } : {}}
			>
				{label} {required && <span className="required">*</span>}
			</label>
			<input
				type="email"
				placeholder={placeholder}
				className="input-text"
				name="billing_email"
				id="billing_email"
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
