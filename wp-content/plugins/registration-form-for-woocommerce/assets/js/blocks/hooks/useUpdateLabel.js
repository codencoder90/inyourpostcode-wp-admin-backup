import { useEffect } from '@wordpress/element';

export default (props, label) => {
	useEffect(() => {
		if (!props.attributes?.edited && !props.attributes?.label) {
			props.setAttributes({ label, edited: true });
		}
	}, []);
};
