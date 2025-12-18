import { RichText } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { InspectorControls } from '../../common';
import { useClientId, useUpdateLabel } from '../../hooks';

export default (props) => {
	const {
		attributes: {
			clientId,
			label,
			description,
			required,
			className,
			hasDescription,
			fieldWidth,
			options,
			placeholder,
			edited,
		},
		setAttributes,
		isSelected,
	} = props;

	const inputRef = useRef(null);
	const focus = useRef(false);

	useClientId(props.clientId, setAttributes, props.attributes, 'multi_select');

	useUpdateLabel(
		props,
		__('Multi select', 'registration-form-for-woocommerce')
	);

	useEffect(() => {
		if (!edited) {
			setAttributes({
				options: [
					__('Option 1', 'registration-form-for-woocommerce'),
					__('Option 2', 'registration-form-for-woocommerce'),
				],
			});
		}
	}, []);

	useEffect(() => {
		if (!inputRef.current || !focus.current) {
			return;
		}
		inputRef.current.focus();
		focus.current = false;
	}, [options.length]);

	const addOption = useCallback(() => {
		focus.current = true;
		setAttributes({ options: [...options, ''] });
	}, [options]);

	return (
		<>
			<InspectorControls {...props} />
			<div
				data-id={`multi_select_${clientId}`}
				className={`form-row field-width-${fieldWidth}${
					className && ' ' + className
				}`}
			>
				<RichText
					className={`tgwcfb-label ${required ? 'required' : ''}`}
					value={label}
					tagName="label"
					onChange={(val) => setAttributes({ label: val })}
					htmlFor={`multi_select${clientId} }`}
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
					id={`multi_select${clientId}`}
					name={`multi_select${clientId}`}
					className="input_select tgwcfb-select"
					defaultValue=""
					disabled
				>
					<option value="">{placeholder || ''}</option>
				</select>
				{isSelected && (
					<ul className="tgwcfb-options">
						{options.map((option, idx) => (
							<li className="tgwcfb-option" key={idx} data-key={idx}>
								<input
									className="tgwcfb-option-input"
									onChange={(e) => {
										const tempOptions = [...options];
										tempOptions[idx] = e.currentTarget.value;
										setAttributes({ options: [...tempOptions] });
									}}
									placeholder={__(
										'Write option…',
										'registration-form-for-woocommerce'
									)}
									defaultValue={option}
									ref={inputRef}
								/>
								{isSelected && (
									<Button
										icon="trash"
										onClick={() => {
											const tempOptions = [...options];
											tempOptions.splice(idx, 1);
											setAttributes({ options: [...tempOptions] });
										}}
									/>
								)}
							</li>
						))}
					</ul>
				)}
				{isSelected && (
					<Button onClick={addOption} icon="insert">
						{__('Add option', 'registration-form-for-woocommerce')}
					</Button>
				)}
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
