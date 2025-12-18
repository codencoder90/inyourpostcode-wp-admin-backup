/**
 * WordPress dependencies
 */
import { useState, useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Spinner, Dashicon } from '@wordpress/components';

/**
 * External dependencies
 */
import { ListTable } from '@barn2plugins/components';
import { useNavigate } from 'react-router-dom';
import { useMultipleAdminNotifications } from '@barn2plugins/react-helpers';

/**
 * Internal dependencies
 */
import OptionsCell from '../components/tables/options-cell';
import NameCell from '../components/tables/name-cell';
import VisibilityCell from '../components/tables/visibility-cell';
import ToggleCell from '../components/tables/toggle-cell';
import DeleteModal from '../components/tables/delete-modal';
import WCTableTooltip from '../components/wc-table-tooltip';

import {
	useGroups,
	useDeleteGroup,
	useReOrderGroup,
	useDuplicateGroup,
	useGroupVisibilityObjects,
} from '../hooks/groups';

/**
 * Displays the table with the list of filter groups
 */
const ManageGroupsPage = () => {
	const { clearNotifications } = useMultipleAdminNotifications();

	const [ deleteRow, setDeleteRow ] = useState( {} );

	const navigate = useNavigate();

	const groupsQuery = useGroups();
	const deleteGroup = useDeleteGroup();
	const reOrderGroup = useReOrderGroup();
	const duplicateGroup = useDuplicateGroup();

	const confirmDeleteMessage = deleteRow?.name
		? sprintf(
				/* translators: %s: Option group name */
				__( 'Are you sure you want to delete the "%s" option group?', 'woocommerce-product-options' ),
				deleteRow?.name
		  )
		: __( 'Are you sure you want to delete this option group?', 'woocommerce-product-options' );

	const columns = useMemo(
		() => [
			{
				Header: __( 'Options Group', 'woocommerce-product-options' ),
				accessor: 'name',
				Cell: ( table ) => <NameCell table={ table } />,
			},
			{
				Header: __( 'Options', 'woocommerce-product-options' ),
				accessor: 'options',
				Cell: ( table ) => <OptionsCell table={ table } />,
			},
			{
				Header: __( 'Visibility', 'woocommerce-product-options' ),
				accessor: 'visibility',
				Cell: ( table ) => <VisibilityCell table={ table } />,
			},
			{
				Header: __( 'Enabled', 'woocommerce-product-options' ),
				accessor: 'enabled',
				Cell: ( table ) => <ToggleCell table={ table } />,
			},
		],
		[]
	);

	/**
	 * Reorder the groups in the table.
	 *
	 * @param {Array} reOrderedGroups
	 */
	const handleReOrder = async ( reOrderedGroups ) => {
		reOrderGroup.mutate( reOrderedGroups );
		useGroupVisibilityObjects.fetchData();
	};

	/**
	 * Delete a group.
	 *
	 * @param {Object} group
	 */
	const handleDelete = async ( group ) => {
		deleteGroup.mutate( group.id );
		setDeleteRow( {} );
	};

	const onDeleteClick = ( row ) => {
		setDeleteRow( row );
	};

	/**
	 * Navigate to the "add" page.
	 *
	 * @param {Event} e
	 * @return {void}
	 */
	const handleRedirect = ( e ) => {
		e.preventDefault();
		navigate( 'add' );
	};

	useEffect( () => {
		clearNotifications();
	}, [] );

	return (
		<>
			<h2>
				{ __( 'Option Groups', 'woocommerce-product-options' ) }
				<a className={ 'page-title-action' } href="#" onClick={ ( e ) => handleRedirect( e ) }>
					{ __( 'Add Group', 'woocommerce-product-options' ) }
				</a>
			</h2>

			<p>
				{ __(
					'Create as many sets of product options as you like, organized into groups. You can choose which products will display the options for each group. ',
					'woocommerce-product-options'
				) }
			</p>

			<ListTable
				className="wpo-groups-table"
				columns={ columns }
				data={ groupsQuery.isFetched ? groupsQuery.data : [] }
				fetchData={ () => {} }
				loading={ groupsQuery.isFetching }
				compTableLoading={ <Spinner /> }
				compEmptyTable={
					groupsQuery.isFetching ? (
						<Spinner />
					) : (
						<div>
							{ __( 'No product options yet', 'woocommerce-product-options' ) + ' - ' }
							<a href="#" onClick={ ( e ) => handleRedirect( e ) }>
								{ __( 'add options', 'woocommerce-product-options' ) }
							</a>
						</div>
					)
				}
				compDraggableIcon={ <Dashicon className={ 'barn2-list-table-drag' } icon={ 'menu' } /> }
				compDraggableHeader={
					<WCTableTooltip
						tooltip={ __(
							'Drag and drop to re-order. This is used to order the options when a product has more than one group.',
							'woocommerce-product-options'
						) }
					/>
				}
				rowActionsAccessor={ 'name' }
				rowActions={ () => [
					{
						title: __( 'Edit', 'woocommerce-product-options' ),
						isTrash: false,
						onClick: ( row ) => navigate( `/edit/${ row.id }` ),
					},
					{
						title: __( 'Duplicate', 'woocommerce-product-options' ),
						isTrash: false,
						onClick: ( row ) => navigate( `/edit/${ row.id }/duplicate` ),
					},
					{
						title: __( 'Delete', 'woocommerce-product-options' ),
						isTrash: true,
						onClick: ( row ) => onDeleteClick( row ),
					},
				] }
				draggable={ true }
				onDragEnd={ ( result ) => handleReOrder( result ) }
			/>
			<DeleteModal
				row={ deleteRow }
				title={ __( 'Delete option group', 'woocommerce-product-options' ) }
				confirmMessage={ confirmDeleteMessage }
				onModalDelete={ handleDelete }
				onModalClose={ () => setDeleteRow( {} ) }
			/>
		</>
	);
};

export default ManageGroupsPage;
