export default (props) => {
	const {
		attributes: {
			clientId,
			label,
			description,
			placeholder,
			hideLabel,
			required,
			className,
			hasDescription,
			fieldWidth,
			min,
			max,
			step,
		},
	} = props;

	return (
		<p
			id={`number_${clientId}_field`}
			className={`form-row field-width-${fieldWidth}${
				className && ' ' + className
			}`}
		>
			<label
				htmlFor={`number_${clientId}`}
				style={hideLabel ? { display: 'none' } : {}}
			>
				{label} {required && <span className="required">*</span>}
			</label>
			<input
				min={min || null}
				max={max || null}
				step={step || null}
				type="number"
				placeholder={placeholder}
				className="input-text input-number"
				name={`number_${clientId}`}
				id={`number_${clientId}`}
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
