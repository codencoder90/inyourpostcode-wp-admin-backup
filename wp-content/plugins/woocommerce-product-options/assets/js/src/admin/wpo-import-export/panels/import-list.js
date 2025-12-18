import { __ } from '@wordpress/i18n';
import ImportResult from './import-result';
import { nanoid } from 'nanoid';
import { useRef } from '@wordpress/element';

const ImportList = ( { groups, preflightGroups, onChange, onChangeAll } ) => {
	const importExists = groups.some( ( group ) => group.success );
	const overwriteExists = groups.some( ( group ) => group.conflict );
	const duplicateExists = groups.some( ( group ) => group.conflict || group.action === 'duplicate' );

	const onImportAll = () => {
		const newGroups = [ ...groups ];
		groups.forEach( ( group, index ) => {
			if ( group.success ) {
				newGroups[ index ] = {
					...group,
					action: 'import',
				}
			}
		} );

		onChangeAll( newGroups );
	};
	
	const onSkipAll = () => {
		const newGroups = [ ...groups ];
		groups.forEach( ( group, index ) => {
			newGroups[ index ] = {
				...group,
				action: 'skip',
			}
	} );

		onChangeAll( newGroups );
	};
	
	const onOverwriteAll = () => {
		const newGroups = [ ...groups ];
		groups.forEach( ( group, index ) => {
			if ( ! group.success && group.conflict ) {
				newGroups[ index ] = {
					...group,
					action: 'overwrite',
				}
			}
		} );

		onChangeAll( newGroups );
	};

	const onDuplicateAll = () => {
		const newGroups = [ ...groups ];
		groups.forEach( ( group, index ) => {
			if ( ! group.success && group.conflict ) {
				newGroups[ index ] = {
					...group,
					action: 'duplicate',
				};
			}
		} );

		onChangeAll( newGroups );
	};

	const onResetAll = () => {
		const newGroups = [ ...groups ];
		groups.forEach( ( group, index ) => {
			newGroups[ index ] = {
				...group,
				action: group.success ? 'import' : 'skip',
			}
		} );

		onChangeAll( newGroups );
	}

	
	return (
		<div className="import-list-container">
			<h2>{ __( 'The file contains the following option groups.' ) }</h2>
			<p className="description">
				{ __(
					'Please review the list below, select the appropriate action for each group and click the "Import" button to proceed.',
					'woocommerce-product-options'
				) }
			</p>
			<div className="wpo-panel-actions">
				{ importExists && (
					<>
						<button className="button-link" onClick={ onImportAll }>
							{ __( 'Import all', 'woocommerce-product-options' ) }
						</button>
						{ ' | ' }
					</>
				) }
				<>
					<button className="button-link" onClick={ onSkipAll }>
						{ __( 'Skip all', 'woocommerce-product-options' ) }
					</button>
					{ ' | ' }
				</>
				{ overwriteExists && (
					<>
						<button className="button-link" onClick={ onOverwriteAll }>
							{ __( 'Overwrite all', 'woocommerce-product-options' ) }
						</button>
						{ ' | ' }
					</>
				) }
				{ duplicateExists && (
					<>
						<button className="button-link" onClick={ onDuplicateAll }>
							{ __( 'Duplicate all', 'woocommerce-product-options' ) }
						</button>
						{ ' | ' }
					</>
				) }
				<button className="button-link" onClick={ onResetAll }>
					{ __( 'Reset all', 'woocommerce-product-options' ) }
				</button>
			</div>

			<ul className="import-list">
				{ groups.map( ( result ) => (
						<ImportResult key={ nanoid() } result={ result } onChange={ onChange } />
					)
				) }
			</ul>
		</div>
	);
};

export default ImportList;
