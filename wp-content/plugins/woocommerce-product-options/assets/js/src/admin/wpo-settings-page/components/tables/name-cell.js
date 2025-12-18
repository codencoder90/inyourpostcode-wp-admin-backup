/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';

/**
 * Displays the content of the name column.
 *
 * @param {Object} props
 * @param {Object} props.table
 * @return {Object} JSX
 */
const NameCell = ( { table } ) => {
	const navigate = useNavigate();

	// Grab the group ID number
	const { id, name } = table.row.original;

	/**
	 * Handles redirect when clicking the button.
	 *
	 * @param {Function} event
	 */
	const handleClick = ( event ) => {
		event.preventDefault();
		navigate( 'edit/' + id );
	};

	return (
		<>
			<strong>
				{ /* eslint-disable-next-line jsx-a11y/anchor-is-valid */ }
				<a href="#" onClick={ ( e ) => handleClick( e ) }>
					{ name.length > 0 ? name : <span>{ __( '(No name)', 'woocommerce-product-options' ) }</span> }
				</a>
			</strong>
		</>
	);
};

export default NameCell;
