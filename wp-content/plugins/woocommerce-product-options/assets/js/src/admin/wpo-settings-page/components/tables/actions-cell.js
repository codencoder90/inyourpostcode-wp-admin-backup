/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '@barn2plugins/components';

/**
 * Displays the content of the name column.
 *
 * @param {Object} props
 * @param {Object} props.table
 * @return {Object} JSX
 */
const ActionsCell = ( { table } ) => {
	const navigate = useNavigate();
	const { id } = table.row.original;

	/**
	 * Handles redirect when clicking the button.
	 *
	 * @param {Function} e
	 */
	const handleClick = ( e ) => {
		e.preventDefault();
		navigate( `/edit/${ id }` );
	};

	return (
		<>
			<Button href="#" onClick={ ( e ) => handleClick( e ) }>
				{ __( 'Manage Options', 'woocommerce-product-options' ) }
			</Button>
		</>
	);
};

export default ActionsCell;
