/**
 * WordPress dependencies
 */
import { NoticeList } from '@barn2plugins/components';

/**
 * External dependencies.
 */
import { Outlet } from 'react-router-dom';
import { useMultipleAdminNotifications } from '@barn2plugins/react-helpers';

const AdminLayoutWrapper = () => {
	const { notifications, clearNotification } = useMultipleAdminNotifications();

	return (
		<div id="barn2-pages-wrapper">
			{ notifications.length > 0 && (
				<NoticeList notices={ notifications } onRemove={ ( id ) => clearNotification( id ) } />
			) }

			<Outlet />
		</div>
	);
};

export default AdminLayoutWrapper;
