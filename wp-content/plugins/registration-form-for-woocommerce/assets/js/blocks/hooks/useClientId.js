import { useEffect } from '@wordpress/element';

export default (id, callback, attributes, blockName) => {
	useEffect(() => {
		const ID = id.substring(0, 8);

		if (!attributes.clientId) {
			callback({ clientId: ID });
		} else if (attributes.clientId !== ID) {
			if (
				document.querySelectorAll(`[data-id="${blockName}_${ID}"]`).length > 1
			) {
				callback({ clientId: ID });
			}
		}
	}, []);
};
