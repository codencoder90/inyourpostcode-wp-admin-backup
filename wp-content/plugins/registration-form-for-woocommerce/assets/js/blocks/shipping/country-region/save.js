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
			id="shipping_country_field"
			className={`form-row field-width-${fieldWidth} address-field${
				className && ' ' + className
			}`}
		>
			<label
				htmlFor="shipping_country"
				style={hideLabel ? { display: 'none' } : {}}
			>
				{label} {required && <span className="required">*</span>}
			</label>
			<select
				className="shipping_country_select"
				name="shipping_country"
				id="shipping_country"
				tabIndex={-1}
				aria-hidden
				data-placeholder={placeholder}
				autoComplete="country"
			>
				<option value="" selected>
					{placeholder}
				</option>
				{Object.entries(_TGWCFB_EDITOR_.shippingCountries).map(
					([key, val], idx) => (
						<option value={key} key={idx}>
							{val}
						</option>
					)
				)}
			</select>
			{description && (
				<span
					className="input-description"
					dangerouslySetInnerHTML={{ __html: description }}
				/>
			)}
		</p>
	);
};
