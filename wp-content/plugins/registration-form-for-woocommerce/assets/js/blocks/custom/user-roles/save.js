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
			roles,
		},
	} = props;

	return (
		<p
			id="user_roles_field"
			className={`form-row field-width-${fieldWidth}${
				className && ' ' + className
			}`}
		>
			<label htmlFor="user_roles" style={hideLabel ? { display: 'none' } : {}}>
				{label} {required && <span className="required">*</span>}
			</label>
			<select
				className="tgwcfb-select tgwcfb-enhanced-select"
				name="user_roles"
				id="user_roles"
			>
				{placeholder && (
					<option value="" selected>
						{placeholder}
					</option>
				)}
				{Object.entries(roles).map(([slug, name], idx) => (
					<option value={slug} key={idx}>
						{name}
					</option>
				))}
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
