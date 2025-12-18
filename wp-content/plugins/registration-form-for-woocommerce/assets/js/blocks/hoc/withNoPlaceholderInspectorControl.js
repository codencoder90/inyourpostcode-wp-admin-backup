import { createHigherOrderComponent } from '@wordpress/compose';

export default createHigherOrderComponent((Component) => {
	return (props) => {
		if (
			'tgwcfb/checkbox' === props.name ||
			'tgwcfb/radio' === props.name ||
			'tgwcfb/profile-picture' === props.name ||
			'tgwcfb/range' === props.name ||
			'tgwcfb/separate-shipping' === props.name
		) {
			return null;
		}

		return <Component {...props} />;
	};
}, 'withNoPlaceholderInspectorControl');
