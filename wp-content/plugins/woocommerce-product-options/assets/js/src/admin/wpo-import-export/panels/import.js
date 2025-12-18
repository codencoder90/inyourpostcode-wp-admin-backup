import { __, _n, sprintf } from '@wordpress/i18n';
import { Button } from '@barn2plugins/components';
import { useRef, useState } from '@wordpress/element';
import { Spinner } from '@wordpress/components';

import ImportList from './import-list';
import HeadedContainer from '../components/headed-container';
import { useMultipleAdminNotifications } from '@barn2plugins/react-helpers';
import { useImportGroups } from '../../wpo-settings-page/hooks/groups';

const ImportPanel = () => {
	const inputFileRef = useRef( null );
	const fileNameRef = useRef( null );
	const { setNotification, clearNotifications } = useMultipleAdminNotifications();
	const importGroups = useImportGroups();
	const [ groups, setGroups ] = useState( [] );
	const [ importDisabled, setImportDisabled ] = useState( true );
	const [ isReadingFile, setIsReadingFile ] = useState( false );
	const [ isImporting, setIsImporting ] = useState( false );

	const onChooseFile = () => {
		inputFileRef.current.click();
	};

	const onFileChosen = () => {
		if ( inputFileRef.current.files?.[ 0 ] ) {
			setImportDisabled( false );
			fileNameRef.current.textContent = inputFileRef.current.files?.[ 0 ]?.name;

			onPreflight();
		} else {
			resetPanel();
		}
	};

	const onPreflight = () => {
		clearNotifications();

		const file = inputFileRef.current.files?.[ 0 ];
		if ( ! file ) {
			setIsReadingFile( false );
			return;
		}

		const reader = new FileReader();
		setIsReadingFile( true );

		reader.onload = () => {
			setGroups( [] );

			const data = JSON.parse( reader.result );

			if ( ! data ) {
				setNotification(
					'error',
					__( 'This is not a valid JSON file.', 'woocommerce-product-options' ),
					true,
					false
				);
				setIsReadingFile( false );
				return;
			}

			const compatibleJSON = data.wpoVersion && data.groups.length === parseInt( data.groupCount );

			if ( ! compatibleJSON ) {
				setNotification(
					'error',
					__( 'This is not a WooCommerce Product Options export file.', 'woocommerce-product-options' ),
					true,
					false
				);
				setIsReadingFile( false );
				return;
			}

			const body = {
				preflight: true,
				groups: data.groups,
				maps: data.maps,
			};

			importGroups.mutateAsync( body ).then( ( results ) => {
				setGroups( results );
				setIsReadingFile( false );
			} );
		};

		reader.readAsText( file );
	};

	const onImport = () => {
		const body = {
			preflight: false,
			groups,
		};

		setIsImporting( true );

		importGroups.mutateAsync( body ).then( ( results ) => {
			// filter the groups with action set as `import` or `overwrite`
			const groupsToImport = groups.filter( ( group ) => [ 'import', 'overwrite', 'duplicate' ].includes( group.action ) );

			// filter the results with imported set as `true`
			const imported = results?.data?.filter?.( ( result ) => result.imported === true );

			if ( groupsToImport.length === imported?.length ) {
				setNotification(
					'success',
					sprintf(
						// translators: %s: the summary of the imported groups
						__( 'Import complete - %s', 'woocommerce-product-options' ),
						sprintf(
							// translators: %s: the number of imported groups
							_n( '%s option group was imported.', '%s option groups were imported.', imported.length, 'woocommerce-product-options' ),
							imported.length
						)
					),
					true,
					false
				);

				resetPanel();
			} else {
				// filter the groups that were not imported
				const errors = results?.data?.filter( ( result ) => result.imported !== false );

				setNotification(
					'error',
					sprintf(
						// translators: %s: list of group names
						__( 'The following option groups could not be imported: %s', 'woocommerce-product-options' ),
						errors.map( ( error ) => `"${ error.name }"` ).join( ', ' )
					),
					true,
					false
				);
			}
		} );
	};

	const onChangeAction = ( action, groupID ) => {
		const groupIndex = groups.findIndex( ( g ) => g.id === groupID );
		const group = groups.find( ( g ) => g.id === groupID );
		const newGroups = [ ...groups ];

		group.action = action;

		newGroups[ groupIndex ] = group;

		setGroups( newGroups );
	};

	const resetPanel = () => {
		setGroups( [] );
		setImportDisabled( true );
		setIsImporting( false );
		fileNameRef.current.textContent = __( 'No file chosen', 'woocommerce-product-options' );
		inputFileRef.current.value = '';
	};

	return (
		<div id="wpo-import-panel" className="wpo-panel">
			<HeadedContainer
				title={ __( 'Import', 'woocommerce-product-options' ) }
				icon="import"
				tooltip={ __(
					'Import product options from a different WordPress installation. Select the JSON file you previously exported and click the "Import" button to proceed. You will be able to review the groups before importing them.',
					'woocommerce-product-options'
				) }
			>
				<h3>{ __( 'Select file', 'woocommerce-product-options' ) }</h3>
				<form>
					<Button id="wpo-import-file-button" onClick={ onChooseFile }>
						{ __( 'Choose file', 'woocommerce-product-options' ) }
					</Button>
					<span id="wpo-import-file-name" ref={ fileNameRef }>
						{ __( 'No file chosen', 'woocommerce-product-options' ) }
					</span>
					<label htmlFor="wpo-import-file">
						<input
							id="wpo-import-file"
							type="file"
							accept="application/json"
							ref={ inputFileRef }
							onChange={ onFileChosen }
							style={ { display: 'none' } }
						/>
					</label>
				</form>
				{ isReadingFile && <Spinner style={ { margin: '16px 0 0 12px' } } /> }
				{ groups.length > 0 && <ImportList groups={ groups } onChange={ onChangeAction } onChangeAll={ setGroups } /> }
			</HeadedContainer>
			<Button isPrimary disabled={ importDisabled || isImporting } onClick={ () => onImport() }>
				{ isImporting && <Spinner style={ { margin: '0 7px -3px 0' } } /> }
				{ __( 'Import', 'woocommerce-product-options' ) }
			</Button>
		</div>
	);
};

export default ImportPanel;
