export default (props) => {
	const {
		attributes: {
			clientId,
			label,
			description,
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
			id={`range_${clientId}_field`}
			className={`form-row field-width-${fieldWidth}${
				className && ' ' + className
			}`}
		>
			<label
				htmlFor={`range_${clientId}`}
				style={hideLabel ? { display: 'none' } : {}}
			>
				{label} {required && <span className="required">*</span>}
			</label>
			<span className="input-wrapper">
				<input
					type="range"
					className="input-range"
					id={`range_${clientId}`}
					step={step}
					max={max}
					min={min}
					name={`range_${clientId}`}
				/>
				<input
					type="number"
					step={step}
					max={max}
					min={min}
					className="input-number input-text"
					name={`range_${clientId}`}
				/>
			</span>
			{description && hasDescription && (
				<span
					className="input-description"
					dangerouslySetInnerHTML={{ __html: description }}
				/>
			)}
		</p>
	);
};
