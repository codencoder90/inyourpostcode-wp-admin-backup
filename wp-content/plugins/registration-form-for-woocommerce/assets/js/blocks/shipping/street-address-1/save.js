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
			id="shipping_address_1_field"
			className={`form-row field-width-${fieldWidth} address-field ${
				className && ' ' + className
			}`}
		>
			<label
				htmlFor="shipping_address_1"
				style={hideLabel ? { display: 'none' } : {}}
			>
				{label} {required && <span className="required">*</span>}
			</label>
			<input
				type="text"
				placeholder={placeholder}
				className="input-text"
				name="shipping_address_1"
				id="shipping_address_1"
				autoComplete="address-line1"
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
