/**
 * External dependencies
 */
import { useRoutes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MultipleAdminNotificationsProvider } from '@barn2plugins/react-helpers';

/**
 * Internal dependencies
 */
import AdminLayoutWrapper from './components/admin-layout-wrapper';
import RouteNotFound from './pages/route-not-found';
import AddGroupPage from './pages/add-group-page';
import EditGroupPage from './pages/edit-group-page';
import ManageGroupsPage from './pages/manage-groups-page';

const queryClient = new QueryClient( {
	defaultOptions: {
		queries: {
			notifyOnChangeProps: 'tracked',
		},
	},
} );

/**
 * Displays the admin editor page.
 *
 * @return {React.ReactElement} The main app component.
 */
const AdminEditor = () => {
	const routes = [
		{
			path: '/',
			element: <AdminLayoutWrapper />,
			children: [
				{ index: true, element: <ManageGroupsPage /> },
				{ path: '/add', element: <AddGroupPage /> },
				{ path: '/edit/:groupID/:editMode?', element: <EditGroupPage /> },
				{ path: '*', element: <RouteNotFound /> },
			],
		},
	];

	const routesRenderer = useRoutes( routes );

	return (
		<div id="wpo-admin-editor-page">
			<MultipleAdminNotificationsProvider>
				<QueryClientProvider client={ queryClient }>{ routesRenderer }</QueryClientProvider>
			</MultipleAdminNotificationsProvider>
		</div>
	);
};

export default AdminEditor;
