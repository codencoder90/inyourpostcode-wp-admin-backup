import { TextControl } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

export default createHigherOrderComponent((Component) => {
	return (props) => {
		if ('tgwcfb/number' === props.name || 'tgwcfb/range' === props.name) {
			return (
				<>
					<TextControl
						type="number"
						label={__('Minimum value', 'registration-form-for-woocommerce')}
						value={props.attributes.min}
						onChange={(val) => props.setAttributes({ min: parseFloat(val) })}
					/>
					<TextControl
						type="number"
						label={__('Maximum value', 'registration-form-for-woocommerce')}
						value={props.attributes.max}
						onChange={(val) => props.setAttributes({ max: parseFloat(val) })}
					/>
					<TextControl
						type="number"
						label={__('Step', 'registration-form-for-woocommerce')}
						value={props.attributes.step}
						onChange={(val) => props.setAttributes({ step: parseFloat(val) })}
					/>
					<Component {...props} />
				</>
			);
		}
		return <Component {...props} />;
	};
}, 'withNumberAttributeInspectorControl');
