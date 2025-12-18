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
			id="shipping_postcode_field"
			className={`form-row field-width-${fieldWidth}${
				className && ' ' + className
			}`}
		>
			<label
				htmlFor="shipping_postcode"
				style={hideLabel ? { display: 'none' } : {}}
			>
				{label} {required && <span className="required">*</span>}
			</label>
			<input
				type="text"
				placeholder={placeholder}
				className="input-text"
				name="shipping_postcode"
				id="shipping_postcode"
				autoComplete="postal-code"
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
