import apiFetch from '@wordpress/api-fetch';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect, useRef, useState } from '@wordpress/element';

export default createHigherOrderComponent((Component) => {
	return (props) => {
		const [state, setState] = useState({ loading: true, userRoles: [] });
		const mount = useRef(false);

		useEffect(() => {
			mount.current = true;
			apiFetch({
				path: '/tgwcfb/v1/user-roles',
				method: 'GET',
			})
				.then((res) => {
					if (!res.success || !mount.current) {
						return;
					}
					setState({ loading: false, userRoles: { ...res.userRoles } });
				})
				.catch(() => {
					if (!mount.current) {
						return;
					}
					setState({ ...state, loading: false });
				});

			return () => {
				mount.current = false;
			};
		}, []);

		return <Component {...props} {...state} />;
	};
}, 'withUserRoles');
