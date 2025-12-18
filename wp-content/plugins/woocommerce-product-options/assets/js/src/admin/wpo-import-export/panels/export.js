import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';

import HeadedContainer from '../components/headed-container';

import { useGroups } from '../../wpo-settings-page/hooks/groups';
import { Button } from '@barn2plugins/components';

import { useMultipleAdminNotifications } from '@barn2plugins/react-helpers';

const ExportPanel = () => {
	const groupsQuery = useGroups();
	const { setNotification } = useMultipleAdminNotifications();
	const [ exportDisabled, setExportDisabled ] = useState( true );
	const [ isExporting, setIsExporting ] = useState( false );

	const onSelectAll = () => {
		Array.from( document.querySelectorAll( '#wpo-export-panel input[type="checkbox"]' ) ).map(
			( checkbox ) => ( checkbox.checked = true )
		);
		setExportDisabled( document.querySelectorAll( '#wpo-export-panel input[type="checkbox"]:checked' ).length === 0 );
	};

	const onUnselectAll = () => {
		Array.from( document.querySelectorAll( '#wpo-export-panel input[type="checkbox"]' ) ).map(
			( checkbox ) => ( checkbox.checked = false )
		);
		setExportDisabled( true );
	};

	const onGroupSelection = () => {
		const checkboxes = Array.from(
			document.querySelectorAll( '#wpo-export-panel input[type="checkbox"]:checked' )
		);
		setExportDisabled( checkboxes.length === 0 );
	};

	const getExportedGroups = async ( ids = '' ) => {
		const groups = await apiFetch( {
			path: `/wc-product-options/v1/groups/export/?id=${ ids }`,
		} );

		return groups;
	};

	const onExport = () => {
		setIsExporting( true );
		const checkboxes = Array.from(
			document.querySelectorAll( '#wpo-export-panel input[type="checkbox"]:checked' )
		);
		const groupIds = checkboxes.map( ( checkbox ) => checkbox.value );

		if ( groupIds.length === 0 ) {
			setNotification(
				'error',
				__( 'Please select at least one group to export.', 'woocommerce-product-options' ),
				false,
				true
			);
			return;
		}

		getExportedGroups( groupIds.join( ',' ) ).then( ( data ) => {
			const blob = new Blob( [ JSON.stringify( data ) ], { type: 'application/json' } );
			const url = URL.createObjectURL( blob );
			const a = document.createElement( 'a' );
			a.href = url;
			const name = [
				'wpo-export',
				window.location.hostname,
				new Date().toISOString().split( '.' )[ 0 ].replace( /[-:T]/g, '' ),
			];
			a.download = `${ name.join( '-' ) }.json`;
			document.body.appendChild( a );
			a.click();
			URL.revokeObjectURL( url );
			checkboxes.map( ( checkbox ) => ( checkbox.checked = false ) );
			setExportDisabled( true );
			setIsExporting( false );
		} );
	};

	return (
		<div id="wpo-export-panel" className="wpo-panel">
			<HeadedContainer
				title={ __( 'Export', 'woocommerce-product-options' ) }
				icon="export"
				tooltip={ __(
					'Export your product options as a JSON file so that you can easily import them in a different WordPress installation.',
					'woocommerce-product-options'
				) }
			>
				{ groupsQuery.isFetching ? <Spinner /> : '' }
				{ groupsQuery.isFetched && (
					<>
						<h3>
							{ __( 'Product option groups', 'woocommerce-product-options' ) }
							<div className="wpo-panel-actions">
								<button className="button-link" href="#" onClick={ onSelectAll }>
									{ __( 'Select all', 'woocommerce-product-options' ) }
								</button>
								{ ' | ' }
								<button className="button-link" href="#" onClick={ onUnselectAll }>
									{ __( 'Deselect all', 'woocommerce-product-options' ) }
								</button>
							</div>
						</h3>
						<ul>
							{ groupsQuery.data.map( ( group ) => (
								<li key={ group.id }>
									<label htmlFor={ `group-${ group.id }` }>
										<input
											id={ `group-${ group.id }` }
											type="checkbox"
											value={ group.id }
											onChange={ onGroupSelection }
										/>
										<span>{ group.name }</span>
									</label>
								</li>
							) ) }
						</ul>
					</>
				) }
			</HeadedContainer>
			<Button isPrimary onClick={ onExport } disabled={ exportDisabled || isExporting }>
				{ isExporting && <Spinner style={ { margin: '0 7px -3px 0' } } /> }
				{ __( 'Export as JSON', 'woocommerce-product-options' ) }
			</Button>
		</div>
	);
};

export default ExportPanel;
