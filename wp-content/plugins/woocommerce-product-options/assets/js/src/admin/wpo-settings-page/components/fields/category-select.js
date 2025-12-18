/**
 * WordPress dependencies.
 */
import { useState, useEffect, useLayoutEffect } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies.
 */
import { SearchListControl } from '@barn2plugins/components';
import { useMultipleAdminNotifications } from '@barn2plugins/react-helpers';
import { useDebouncedValue } from 'rooks';

/**
 * Searchable category multi-select control.
 *
 * @param {Object}   props
 * @param {Array}    props.prefilled
 * @param {Function} props.onChange
 */
const CategorySelect = ( { prefilled, onChange = () => {} } ) => {
	const { setNotification } = useMultipleAdminNotifications();

	// Holds the current search results.
	const [ categories, setCategories ] = useState( [] );

	// Holds the list of selected categories.
	const [ selectedCategories, setSelectedCategories ] = useState( [] );

	// Internal pending status of the component.
	const [ isPending, setPending ] = useState( false );

	// Track the search term.
	const [ searchTerm, setSearchTerm ] = useState( '' );

	// Track a debounced search term.
	const [ debouncedSearchTerm ] = useDebouncedValue( searchTerm, 500 );

	const categoryMessages = {
		clear: __( 'Clear all selected categories', 'woocommerce-product-options' ),
		noItems: __( 'No categories found', 'woocommerce-product-options' ),
		/* translators: %s: category select search query */
		noResults: _x( 'No results for %s', 'categories', 'woocommerce-product-options' ),
		search: __( 'Search for categories', 'woocommerce-product-options' ),
		selected: __( 'Selected categories', 'woocommerce-product-options' ),
		placeholder: __( 'Search for categories', 'woocommerce-product-options' ),
	};

	/**
	 * On component mount, trigger an automated search for selected categories.
	 */
	useLayoutEffect( () => {
		if ( ! prefilled || ! Array.isArray( prefilled ) || prefilled.length < 1 ) {
			return;
		}

		const fetchCategories = async () => {
			setPending( true );

			const includeParams = new URLSearchParams( {
				include: prefilled,
			} );

			const wcCategories = await apiFetch( {
				path: `/wc-product-options/v1/groups/categories/?${ includeParams.toString() }`,
			} ).catch( () => {
				setNotification(
					'error',
					__( 'There was a problem fetching your product categories.', 'woocommerce-product-options' )
				);
			} );

			setSelectedCategories( wcCategories ?? [] );
			setPending( false );
		};

		fetchCategories();
	}, [ prefilled ] );

	/**
	 * Fire onChange event when the selected categories change.
	 */
	useEffect( () => {
		const categoryIds = selectedCategories.map( ( category ) => category.id );
		onChange( categoryIds );
	}, [ selectedCategories ] );

	/**
	 * When the debounced search term changes,
	 * trigger api request.
	 */
	useEffect( () => {
		if ( debouncedSearchTerm.length !== 0 ) {
			searchCategories();
		}
	}, [ debouncedSearchTerm ] );

	/**
	 * Search the products from the WC API.
	 *
	 * @return {Array} wcProducts
	 */
	const searchCategories = async () => {
		setPending( true );

		const searchParams = new URLSearchParams( {
			search: searchTerm,
			lang: 'all', // this is necessary to support WPML in all languages
		} );

		const wcCategories = await apiFetch( {
			path: `/wc/v3/products/categories/?${ searchParams.toString() }`,
		} ).catch( () => {
			setNotification(
				'error',
				__( 'There was a problem fetching your product categories.', 'woocommerce-product-options' )
			);
		} );

		const formattedResults = wcCategories.map( ( category ) => {
			return {
				key: category.slug,
				name: category.name,
				id: category.id,
			};
		} );

		setCategories( formattedResults );
		setPending( false );
	};

	return (
		<SearchListControl
			onChange={ ( changedValue ) => setSelectedCategories( changedValue ) }
			isLoading={ isPending }
			messages={ categoryMessages }
			list={ categories }
			selected={ selectedCategories }
			onSearch={ ( searchValue ) => setSearchTerm( searchValue ) }
			didSearch={ debouncedSearchTerm.length !== 0 }
			isCompact
			searchOnly
		/>
	);
};

export default CategorySelect;
