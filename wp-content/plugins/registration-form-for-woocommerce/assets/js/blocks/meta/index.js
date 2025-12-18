import { registerPlugin } from '@wordpress/plugins';

import MetaSettings from './MetaSettings';

export default () => {
	registerPlugin('tgwcfb-meta-settings', {
		render() {
			return <MetaSettings />;
		},
	});
};
