/**
 * WordPress dependencies
 */
import { useState, useEffect, useLayoutEffect } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { SearchListControl } from '@barn2plugins/components';
import { useMultipleAdminNotifications } from '@barn2plugins/react-helpers';
import { useDebouncedValue } from 'rooks';

/**
 * Searchable product multi-select control.
 *
 * @param {Object}   props
 * @param {Array}    props.prefilled
 * @param {Function} props.onChange
 */
const ProductSelect = ( { prefilled, onChange = () => {} } ) => {
	const { setNotification } = useMultipleAdminNotifications();
	const [ products, setProducts ] = useState( [] );

	// Holds the list of selected categories.
	const [ selectedProducts, setSelectedProducts ] = useState( [] );

	// Internal pending status of the component.
	const [ isPending, setPending ] = useState( false );

	// Track the search term.
	const [ searchTerm, setSearchTerm ] = useState( '' );

	// Track a debounced search term.
	const [ debouncedSearchTerm ] = useDebouncedValue( searchTerm, 500 );

	const productMessages = {
		clear: __( 'Clear all selected products', 'woocommerce-product-options' ),
		noItems: __( 'No products found', 'woocommerce-product-options' ),
		/* translators: %s: product select search query */
		noResults: _x( 'No results for %s', 'products', 'woocommerce-product-options' ),
		search: __( 'Search for products', 'woocommerce-product-options' ),
		selected: __( 'Selected products', 'woocommerce-product-options' ),
		placeholder: __( 'Search for products', 'woocommerce-product-options' ),
	};

	// WooCommerce returns 10 products for each request by default
	const numberOfProducts = 5;

	/**
	 * On component mount, trigger an automated search for selected products.
	 */
	useLayoutEffect( () => {
		if ( ! prefilled || ! Array.isArray( prefilled ) || prefilled.length < 1 ) {
			return;
		}

		const fetchProducts = async () => {
			setPending( true );

			const includeParams = new URLSearchParams( {
				include: prefilled,
				per_page: prefilled.length,
				lang: 'all', // this is necessary to support WPML in all languages
			} );

			const wcProducts = await apiFetch( {
				path: `/wc-product-options/v1/groups/products/?${ includeParams.toString() }`,
			} ).catch( () => {
				setNotification( 'error', 'There was a problem fetching your products.' );
			} );

			const formattedResults = wcProducts.map( ( product ) => {
				return {
					key: product.slug,
					name: product.name,
					id: product.id,
					href: product.href,
				};
			} );

			setSelectedProducts( formattedResults );
			setPending( false );
		};

		fetchProducts();
	}, [ prefilled ] );

	/**
	 * Fire onChange event when the selected products change.
	 */
	useEffect( () => {
		const productIds = selectedProducts.map( ( product ) => product.id );
		onChange( productIds );
	}, [ selectedProducts ] );

	/**
	 * When the debounced search term changes,
	 * trigger api request.
	 */
	useEffect( () => {
		if ( debouncedSearchTerm.length !== 0 ) {
			searchProducts();
		}
	}, [ debouncedSearchTerm ] );

	/**
	 * Search the products from the WC API.
	 *
	 * @return {Array} wcProducts
	 */
	const searchProducts = async () => {
		setPending( true );

		const searchParams = new URLSearchParams( {
			search: searchTerm,
			per_page: numberOfProducts,
			lang: 'all', // this is necessary to support WPML in all languages
		} );

		const wcProducts = await apiFetch( {
			path: `/wc-product-options/v1/groups/products/?${ searchParams.toString() }`,
		} ).catch( () => {
			setNotification(
				'error',
				__( 'There was a problem fetching your products', 'woocommerce-product-options' )
			);
		} );

		setPending( false );

		const selectProducts = wcProducts.map( ( product ) => {
			return {
				key: product.slug,
				name: product.name,
				id: product.id,
				href: product.href,
			};
		} );

		setProducts( selectProducts );
	};

	return (
		<SearchListControl
			onChange={ ( changedValue ) => setSelectedProducts( changedValue ) }
			isLoading={ isPending }
			messages={ productMessages }
			list={ products }
			selected={ selectedProducts ?? [] }
			onSearch={ ( searchValue ) => setSearchTerm( searchValue ) }
			didSearch={ debouncedSearchTerm.length !== 0 }
			isCompact
			searchOnly
			isUnfiltered={ true }
		/>
	);
};
	
export default ProductSelect;
