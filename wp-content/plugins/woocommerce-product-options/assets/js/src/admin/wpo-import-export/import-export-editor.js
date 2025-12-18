import { useMultipleAdminNotifications } from '@barn2plugins/react-helpers';
import { NoticeList } from '@barn2plugins/components';
import ExportPanel from './panels/export';
import ImportPanel from './panels/import';

const ImportExportEditor = () => {
	const { notifications, clearNotification } = useMultipleAdminNotifications();

	return (
		<>
			{ notifications.length > 0 && (
				<NoticeList notices={ notifications } onRemove={ ( id ) => clearNotification( id ) } />
			) }

			<div id="wpo-import-export-page">
				<ExportPanel />
				<ImportPanel />
			</div>
		</>
	);
};

export default ImportExportEditor;
