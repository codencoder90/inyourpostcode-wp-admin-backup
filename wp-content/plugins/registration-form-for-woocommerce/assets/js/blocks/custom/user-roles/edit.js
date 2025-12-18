import { RichText } from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { InspectorControls } from '../../common';
import { useUpdateLabel } from '../../hooks';

export default (props) => {
	const {
		attributes: {
			label,
			description,
			placeholder,
			required,
			className,
			hasDescription,
			fieldWidth,
		},
		setAttributes,
		loading,
	} = props;

	useUpdateLabel(props, __('User roles', 'registration-form-for-woocommerce'));

	return (
		<>
			<InspectorControls {...props} />
			<div
				className={`form-row field-width-${fieldWidth}${
					className && ' ' + className
				}`}
			>
				{loading && (
					<div className="loading">
						<Spinner />
					</div>
				)}
				<RichText
					className={`tgwcfb-label ${required ? 'required' : ''}`}
					value={label}
					tagName="label"
					onChange={(val) => setAttributes({ label: val })}
					htmlFor="user_roles"
					allowedFormats={[]}
					placeholder={__('Enter label', 'registration-form-for-woocommerce')}
				/>
				{!label && (
					<span
						style={{
							display: 'inline-block',
							backgroundColor: '#ff02029c',
							color: '#fff',
							padding: '0 4px',
							borderRadius: '4px',
							fontSize: '12px',
						}}
					>
						{__('Label is required', 'registration-form-for-woocommerce')}
					</span>
				)}
				<select
					name="user_roles"
					id="user_roles"
					disabled
					className="user_roles_select tgwcfb-select"
					defaultValue=""
				>
					<option value="">{placeholder}</option>
				</select>
				{hasDescription && (
					<RichText
						className="input-description"
						value={description}
						tagName="span"
						placeholder={__(
							'Enter description',
							'registration-form-for-woocommerce'
						)}
						onChange={(val) => setAttributes({ description: val })}
						allowedFormats={['core/italic']}
					/>
				)}
			</div>
		</>
	);
};
