/**
 * WordPress dependencies.
 */
import { useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Barn2 dependencies
 */
import { SearchListControl } from '@barn2plugins/components';

/**
 * Internal dependencies.
 */
import { useProductAttributes } from '../../hooks/options';

/**
 *  Select a WooCommerce attribute and grab the terms.
 *
 * @param {} param0
 */
const AttributeSelect = ( { option, value, onChange = () => {} } ) => {
	const { attributes, selectedAttribute, setSelectedAttribute } = useProductAttributes( value );

	const attributeMessages = {
		clear: __( 'Clear all selected attributes', 'woocommerce-product-options' ),
		noItems: __( 'No attributes found', 'woocommerce-product-options' ),
		/* translators: %s: attribute select search query */
		noResults: _x( 'No results for %s', 'attribute', 'woocommerce-product-options' ),
		search: __( 'Search for attributes', 'woocommerce-product-options' ),
		selected: __( 'Selected attributes', 'woocommerce-product-options' ),
		placeholder: __( 'Search for attributes', 'woocommerce-product-options' ),
	};

	return (
		<>
			<SearchListControl
				onChange={ ( changedValue ) => {
					setSelectedAttribute( changedValue );

					const formValue = changedValue.length > 0 ? changedValue[ 0 ].id : '';
					onChange( formValue );
				} }
				messages={ attributeMessages }
				list={ attributes }
				selected={ selectedAttribute }
				isSingle
				isCompact
			/>
		</>
	);
};

export default AttributeSelect;
