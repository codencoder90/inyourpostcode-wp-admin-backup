import attributes from "../attributes";

const v1 = {
		attributes,
		supports: {
			multiple: false,
			className: false,
			customClassName: false,
		},
		save:(props)=>{
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
				<p id="billing_country_field" className={ `form-row field-width-${ fieldWidth } address-field${ className && ( ' ' + className ) }` }>
					<label htmlFor="billing_country" style={ hideLabel ? { display: 'none' } : {} }>{ label } { required && ( <span className="required">*</span> ) }</label>
					<select className="country_to_state country_select" name="billing_country" id="billing_country" tabIndex={ -1 } aria-hidden data-placeholder={ placeholder } autoComplete="country">
						<option value="" selected>{ placeholder }</option>
						{ Object.entries( _TGWCFB_EDITOR_.billingCountries ).map( ( [ key, val ], idx ) => (
							<option value={ key } key={ idx }>{ val }</option>
						) ) }
					</select>
					{ description && <span className="input-description" dangerouslySetInnerHTML={ { __html: description } } /> }
				</p>
			);
		}
	}

export default v1;
