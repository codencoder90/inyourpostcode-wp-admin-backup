export default (props) => {
	const {
		attributes: {
			label,
			description,
			hideLabel,
			required,
			className,
			hasDescription,
			fieldWidth,
		},
	} = props;

	return (
		<p
			id="separate_shipping_field"
			className={`form-row field-width-${fieldWidth}${
				className && ' ' + className
			}`}
		>
			<label
				htmlFor="separate_shipping"
				style={hideLabel ? { display: 'none' } : {}}
			>
				<input
					type="checkbox"
					className="input-text"
					name="separate_shipping"
					id="separate_shipping"
				/>
				{label} {required && <span className="required">*</span>}
			</label>
			{description && hasDescription && (
				<span
					className="input-description"
					dangerouslySetInnerHTML={{ __html: description }}
				/>
			)}
		</p>
	);
};
