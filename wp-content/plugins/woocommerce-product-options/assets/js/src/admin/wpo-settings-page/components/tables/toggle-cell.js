/**
 * External dependencies
 */
import { FormToggle } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useToggleGroup } from '../../hooks/groups';

/**
 * Displays the content of the toggle column.
 *
 * @param {Object} props
 * @param {Object} props.table
 * @return {Object} JSX
 */
const ToggleCell = ( { table } ) => {
	const { visibility, id } = table.row.original;
    const enabled = ! visibility.includes( 'disabled-' );

	const toggle = useToggleGroup();

	/**
	 * Fire the api request.
	 *
	 * @param {Boolean} isChecked The new value.
	 */
	const handleToggleUpdateRequest = ( isChecked ) => {
        const newVisibility = isChecked ? visibility.replace( 'disabled-', '' ) : `disabled-${ visibility }`;

		if ( ! id || isNaN( id ) ) {
			window.dispatchEvent(
				new CustomEvent( 'wpo-toggle-in-memory-group', {
					detail: {
						group: {
							id,
							visibility: newVisibility,
						},
					},
				} )
			);
			return;
		}

		toggle.mutate( {
			group: id,
			visibility: newVisibility,
		} );
	};

	return (
		<>
			<FormToggle
				checked={ enabled }
				disabled={ toggle.isFetching }
				onChange={ () => handleToggleUpdateRequest( ! enabled ) }
			/>
		</>
	);
};

export default ToggleCell;