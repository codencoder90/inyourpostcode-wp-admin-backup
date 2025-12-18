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
			id="billing_state_field"
			className={`form-row field-width-${fieldWidth} address-field ${
				className && ' ' + className
			}`}
		>
			<label
				htmlFor="billing_city"
				style={hideLabel ? { display: 'none' } : {}}
			>
				{label} {required && <span className="required">*</span>}
			</label>
			<select
				name="billing_state"
				className="state_select"
				id="billing_state"
				defaultValue=""
				data-placeholder={placeholder}
				autoComplete="address-level1"
				tabIndex={-1}
				data-input-classes={true}
				data-label="State"
			>
				<option value="">{placeholder}</option>
				{Object.entries(_TGWCFB_EDITOR_.states.US).map(([key, val], idx) => (
					<option value={key} key={idx}>
						{val}
					</option>
				))}
			</select>
			{description && hasDescription && (
				<span
					className="input-description"
					dangerouslySetInnerHTML={{ __html: description }}
				/>
			)}
		</p>
	);
};
