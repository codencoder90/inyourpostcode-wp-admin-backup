/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';

/**
 * Internal dependencies
 */
import GroupForm from '../forms/group-form';

/**
 * Displays the content of the add group page.
 *
 * @return {React.ReactElement} AddGroupPage component
 */
const AddGroupPage = () => {
	const navigate = useNavigate();

	/**
	 * Redirect back to the main page.
	 *
	 * @param {Object} e
	 */
	const handleRedirectBack = ( e ) => {
		e.preventDefault();
		navigate( '/' );
	};

	return (
		<>
			<h3>
				{ /* eslint-disable-next-line jsx-a11y/anchor-is-valid */ }
				<a href="#" onClick={ ( e ) => handleRedirectBack( e ) }>
					{ __( 'Option Groups', 'woocommerce-product-options' ) }
				</a>
				<span> &gt; </span>
				{ __( 'Add new', 'woocommerce-product-options' ) }
			</h3>

			<GroupForm />
		</>
	);
};

export default AddGroupPage;
