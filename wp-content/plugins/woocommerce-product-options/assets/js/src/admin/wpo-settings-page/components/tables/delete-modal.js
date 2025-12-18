/**
 * WordPress dependencies
 */
import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isEmpty } from 'lodash';

/**
 * A delete confirmation modal.
 *
 * @param {*} props
 * @return {JSX.Element} DeleteModal
 */
const DeleteModal = ( { row, title, loading, confirmMessage, onModalDelete, onModalClose } ) => {
	const isVisible = ! isEmpty( row );

	const handleDelete = () => {
		onModalDelete( row ); // callback
	};

	const handleClose = () => {
		onModalClose( row ); // callback
	};

	return (
		<>
			{ isVisible && (
				<Modal title={ title } onRequestClose={ handleClose } isDismissible={ ! loading }>
					{ confirmMessage }

					<Button
						variant="secondary"
						isDestructive
						disabled={ loading }
						style={ { display: 'block', marginTop: '1rem', width: '100%' } }
						onClick={ () => handleDelete() }
					>
						{ __( 'Delete', 'woocommerce-product-options' ) }
					</Button>
				</Modal>
			) }
		</>
	);
};

export default DeleteModal;
