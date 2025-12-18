/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External Dependencies
 */
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Internal dependencies
 */
import GroupForm from '../forms/group-form';
import { useGroup } from '../hooks/groups';

/**
 * Displays the content of the edit group page.
 *
 * @return {React.ReactElement} EditGroupPage component
 */
const EditGroupPage = () => {
	const navigate = useNavigate();
	const { groupID, editMode = 'edit' } = useParams();
	const groupQuery = useGroup( parseInt( groupID ) );
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
				{ __( 'Edit option group', 'woocommerce-product-options' ) }
			</h3>

			<GroupForm editMode={ editMode } group={ groupQuery.isFetched ? groupQuery.data : false } />
		</>
	);
};

export default EditGroupPage;
