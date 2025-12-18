import {
	BaseControl,
	CheckboxControl,
	TextControl,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

export default createHigherOrderComponent((Component) => {
	return (props) => {
		if ('tgwcfb/profile-picture' === props.name) {
			const options = [
				{ label: 'jpg', value: 'image/jpg' },
				{ label: 'jpeg', value: 'image/jpeg' },
				{ label: 'gif', value: 'image/gif' },
				{ label: 'png', value: 'image/png' },
			];
			return (
				<>
					<BaseControl
						className="tgwcfb-control"
						help={__(
							'Choose valid file types allowed for upload',
							'registration-form-for-woocommerce'
						)}
					>
						<BaseControl.VisualLabel>
							{__('Valid file types', 'registration-form-for-woocommerce')}
						</BaseControl.VisualLabel>
						<CheckboxControl
							label={__('Select all', 'registration-form-for-woocommerce')}
							checked={options.length === props.attributes.fileTypes.length}
							onChange={(checked) => {
								if (checked) {
									props.setAttributes({
										fileTypes: [...options.map((o) => o.value)],
									});
								} else if (!checked) {
									props.setAttributes({ fileTypes: [] });
								}
							}}
						/>
						{options.map(({ label, value }, idx) => (
							<CheckboxControl
								key={idx}
								label={label}
								checked={props.attributes?.fileTypes?.includes(value)}
								onChange={(checked) => {
									let temp = [...props.attributes.fileTypes];
									if (checked) {
										temp.push(value);
									} else if (!checked) {
										temp = temp.filter((t) => t !== value);
									}
									props.setAttributes({ fileTypes: [...temp] });
								}}
							/>
						))}
					</BaseControl>
					<TextControl
						label={__(
							'Max file size allowed',
							'registration-form-for-woocommerce'
						)}
						help={
							__(
								'Enter the max file size, in megabytes, to allow. If left blank, the value defaults to the maximum size the server allows which is ',
								'registration-form-for-woocommerce'
							) +
							(_TGWCFB_EDITOR_.maxUploadSize / 1024).toFixed(0) +
							'Kb'
						}
						type="string"
						value={props.attributes.maxFileSize || ''}
						onChange={(val) => props.setAttributes({ maxFileSize: val })}
					/>
				</>
			);
		}
		return <Component {...props} />;
	};
}, 'withProfilePictureInspectorControl');
