import { __ } from '@wordpress/i18n';
import Icon from '../icons';

const ImportResult = ( { result, onChange } ) => {
	const { success, conflict, action, changedVisibility, selectionChanges, group } = result;
	const { name, id } = group;

	let icon = success ? 'success' : 'error';
	icon = conflict ? 'warning' : icon;
	icon = changedVisibility ? 'warning' : icon;

	return (
		<li key={ id }>
			<Icon id={ icon } />
			<div className="imported-group-info">
				<span className="imported-group-name">{ name }</span>
				<ul className="imported-group-details">
					{ success && <li key="detail-ready">{ __( 'Ready to be imported' ) }</li> }
					{ conflict && (
						<li key={ `detail-conflict-${ id }` }>
							{ __(
								'A group with the same configuration is already present in the database.',
								'woocommerce-product-options'
							) }
						</li>
					) }
					{ conflict && (
						<li key={ `detail-conflict-${ id }` }>
							{ __(
								'Choose "Overwrite" to replace it with the imported group, or "Duplicate" to create a new group.',
								'woocommerce-product-options'
							) }
						</li>
					) }
					{ selectionChanges && (
						<li key={ `detail-selection-changes-${ id }` }>
							{ __(
								'Products and categories this group was attached to will be remapped.',
								'woocommerce-product-options'
							) }
						</li>
					) }
					{ changedVisibility && (
						<li key={ `detail-no-products-${ id }` }>
							{ __(
								'This group was attached to products and categories that are not present in the database.',
								'woocommerce-product-options'
							) }
						</li>
					) }
					{ changedVisibility && (
						<li key={ `detail-changed-visibility-${ id }` }>
							{ __( 'The visibility settings will switch to "Global".', 'woocommerce-product-options' ) }
						</li>
					) }
				</ul>
				<select
					className="imported-group-action"
					data-default_action={ success ? 'import' : 'skip' }
					value={ action }
					onChange={ ( event ) => {
						onChange( event?.target?.value, id );
					} }
				>
					{ [
						! conflict && {
							value: 'import',
							label: __( 'Import', 'woocommerce-product-options' ),
						},
						{ value: 'skip', label: __( 'Skip', 'woocommerce-product-options' ) },
						conflict && {
							value: 'overwrite',
							label: __( 'Overwrite', 'woocommerce-product-options' ),
						},
						( conflict || action === 'duplicate' ) && {
							value: 'duplicate',
							label: __( 'Duplicate', 'woocommerce-product-options' ),
						},
					]
						.filter( Boolean )
						.map( ( option ) => (
							<option key={ option.value } value={ option.value }>
								{ option.label }
							</option>
						) ) }
				</select>
			</div>
		</li>
	);
};

export default ImportResult;
