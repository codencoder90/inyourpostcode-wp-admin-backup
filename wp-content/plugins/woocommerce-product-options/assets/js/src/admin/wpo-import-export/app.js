/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from 'react-query';
import { MultipleAdminNotificationsProvider } from '@barn2plugins/react-helpers';

import ImportExportEditor from './import-export-editor';
/**
 * Internal dependencies
 */
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
const ImportExport = () => {
	return (
		<QueryClientProvider client={ queryClient }>
			<MultipleAdminNotificationsProvider>
				<ImportExportEditor />
			</MultipleAdminNotificationsProvider>
		</QueryClientProvider>
	);
};

export default ImportExport;
