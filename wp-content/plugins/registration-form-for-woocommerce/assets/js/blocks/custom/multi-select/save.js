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
			options,
			placeholder,
		},
	} = props;

	return (
		<p
			id={`multi_select_${clientId}_field`}
			className={`form-row field-width-${fieldWidth}${
				className && ' ' + className
			}`}
		>
			<label
				htmlFor={`multi_select_${clientId}`}
				style={hideLabel ? { display: 'none' } : {}}
			>
				{label} {required && <span className="required">*</span>}
			</label>
			<select
				className="tgwcfb-select tgwcfb-enhanced-select"
				name={`multi_select_${clientId}[]`}
				multiple
				id={`multi_select_${clientId}`}
			>
				{placeholder && (
					<option value="" selected>
						{placeholder}
					</option>
				)}
				{[...new Set(options)].map((option, idx) => (
					<option value={option} key={idx}>
						{option}
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
