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
			id="shipping_phone_field"
			className={`form-row field-width-${fieldWidth}${
				className && ' ' + className
			}`}
		>
			<label
				htmlFor="shipping_phone"
				style={hideLabel ? { display: 'none' } : {}}
			>
				{label} {required && <span className="required">*</span>}
			</label>
			<input
				type="tel"
				placeholder={placeholder}
				className="input-text"
				name="shipping_phone"
				id="shipping_phone"
				autoComplete="tel"
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
