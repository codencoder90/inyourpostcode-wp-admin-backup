import { InspectorControls } from '@wordpress/block-editor';
import {
	BaseControl,
	Button,
	ButtonGroup,
	PanelBody,
	TextControl,
	TextareaControl,
	ToggleControl,
	withFilters,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const LabelControl = withFilters('tgwcfb.inspectorControls.label')((props) => {
	return (
		<TextControl
			label={__('Label', 'registration-form-for-woocommerce')}
			value={props.attributes.label}
			onChange={(val) => props.setAttributes({ label: val })}
			help={
				'' === props.attributes.label
					? __('Label cannot be empty!', 'registration-form-for-woocommerce')
					: null
			}
		/>
	);
});

const PlaceholderControl = withFilters('tgwcfb.inspectorControls.placeholder')(
	(props) => {
		return (
			<TextControl
				label={__('Placeholder', 'registration-form-for-woocommerce')}
				value={props.attributes.placeholder}
				onChange={(val) => props.setAttributes({ placeholder: val })}
			/>
		);
	}
);

const HideLabelControl = withFilters('tgwcfb.inspectorControls.hideLabel')(
	(props) => {
		return (
			<ToggleControl
				label={__('Hide label', 'registration-form-for-woocommerce')}
				checked={props.attributes.hideLabel}
				onChange={() =>
					props.setAttributes({ hideLabel: !props.attributes.hideLabel })
				}
			/>
		);
	}
);

const RequiredControl = withFilters('tgwcfb.inspectorControls.required')(
	(props) => {
		return (
			<ToggleControl
				label={__('Required', 'registration-form-for-woocommerce')}
				checked={props.attributes.required}
				onChange={() =>
					props.setAttributes({ required: !props.attributes.required })
				}
			/>
		);
	}
);

const DescriptionToggleControl = withFilters(
	'tgwcfb.inspectorControls.hasDescription'
)((props) => {
	return (
		<ToggleControl
			label={__('Description', 'registration-form-for-woocommerce')}
			checked={props.attributes.hasDescription}
			onChange={() =>
				props.setAttributes({
					hasDescription: !props.attributes.hasDescription,
				})
			}
		/>
	);
});

const DescriptionControl = withFilters('tgwcfb.inspectorControls.description')(
	(props) => {
		return (
			<TextareaControl
				value={props.attributes.description}
				onChange={(val) => props.setAttributes({ description: val })}
			/>
		);
	}
);

const FieldWidthControl = withFilters('tgwcfb.inspectorControls.fieldWidth')(
	(props) => {
		return (
			<BaseControl className="tgwcfb-control">
				<BaseControl.VisualLabel>
					{__('Field width', 'registration-form-for-woocommerce')}
				</BaseControl.VisualLabel>
				<ButtonGroup>
					<Button
						onClick={() => props.setAttributes({ fieldWidth: 50 })}
						variant={50 === props.attributes.fieldWidth ? 'primary' : null}
					>
						50%
					</Button>
					<Button
						onClick={() => props.setAttributes({ fieldWidth: 100 })}
						variant={100 === props.attributes.fieldWidth ? 'primary' : null}
					>
						100%
					</Button>
				</ButtonGroup>
			</BaseControl>
		);
	}
);

const CustomCSSControl = withFilters('tgwcfb.inspectorControls.customCSSClass')(
	(props) => {
		return (
			<TextControl
				label={__('Custom CSS class(es)', 'registration-form-for-woocommerce')}
				value={props.attributes.className}
				onChange={(val) => props.setAttributes({ className: val })}
				help={__(
					'Separate multiple classes with spaces.',
					'registration-form-for-woocommerce'
				)}
			/>
		);
	}
);

export default (props) => {
	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Settings', 'registration-form-for-woocommerce')}
					initialOpen
				>
					<LabelControl {...props} />
					<PlaceholderControl {...props} />
					<HideLabelControl {...props} />
					<RequiredControl {...props} />
					<DescriptionToggleControl {...props} />
					{props.attributes.hasDescription && <DescriptionControl {...props} />}
					<FieldWidthControl {...props} />
					<CustomCSSControl {...props} />
				</PanelBody>
			</InspectorControls>
		</>
	);
};
