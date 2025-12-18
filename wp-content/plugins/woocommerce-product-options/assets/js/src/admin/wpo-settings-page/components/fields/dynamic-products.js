/**
 * WordPress dependencies.
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies.
 */
import { useDebouncedValue } from 'rooks';
import classnames from 'classnames';
import { useMultipleAdminNotifications } from '@barn2plugins/react-helpers';

/**
 * Internal dependencies.
 */
import { spinner, crossX } from '../../svg';

const DynamicProducts = ( { optionType, value, onChange = () => {} } ) => {
	const { setNotification } = useMultipleAdminNotifications();
	const containerClasses = classnames( 'option-setting-repeater wpo-choices-repeater wpo-dynamic-products', {
		'wpo-choices-is-customer-price': optionType === 'customer_price',
	} );

	const kbLinkToDynamicChoices =
		'https://barn2.com/kb/display-other-products-as-options/#select-products-dynamically';

	/**
	 * Value of the dynamic products field.
	 */
	const fieldValue = () => {
		if ( value.length < 1 ) {
			return {
				limit: 5,
				sort: 'title',
				categories: [],
			};
		}

		return value;
	};

	// Define default sorting options.
	const defaultSorting = [
		{
			name: 'title',
			label: __( 'Title', 'woocommerce-product-options' ),
		},
		{
			name: 'price_desc',
			label: __( 'Price (highest)', 'woocommerce-product-options' ),
		},
		{
			name: 'price_asc',
			label: __( 'Price (lowest)', 'woocommerce-product-options' ),
		},
		{
			name: 'rating_desc',
			label: __( 'Rating (highest)', 'woocommerce-product-options' ),
		},
		{
			name: 'rating_asc',
			label: __( 'Rating (lowest)', 'woocommerce-product-options' ),
		},
		{
			name: 'date_desc',
			label: __( 'Date (newest)', 'woocommerce-product-options' ),
		},
		{
			name: 'date_asc',
			label: __( 'Date (oldest)', 'woocommerce-product-options' ),
		},
		{
			name: 'popularity',
			label: __( 'Popularity', 'woocommerce-product-options' ),
		},
	];

	// Product search limit
	const [ limit, setLimit ] = useState( fieldValue().limit );
	// Track on a debounced limit change.
	const [ debouncedLimitChange ] = useDebouncedValue( limit, 500 );

	// Product category search term.
	const [ categorySearchTerm, setCategorySearchTerm ] = useState();
	// Track on a debounced search term.
	const [ debouncedSearchTerm ] = useDebouncedValue( categorySearchTerm, 500 );

	// Product sort
	const [ sort, setSort ] = useState( fieldValue().sort );
	// Track on a debounced sort change.
	const [ debouncedSortChange ] = useDebouncedValue( sort, 500 );

	const [ categoryNotFound, setCategoryNotFound ] = useState();
	const [ isCategorySearching, setIsCategorySearching ] = useState();
	const [ isProductSearching, setIsProductSearching ] = useState();
	const [ wcSearchedCategories, setWcSearchedCategories ] = useState( [] );
	const [ selectedCategories, setSelectedCategories ] = useState( fieldValue().categories );
	const [ wcSelectedProducts, setWcSelectedProducts ] = useState( [] );

	/**
	 * On limit change, refresh selected product list.
	 */
	useEffect( () => {
		if ( debouncedLimitChange ) {
			handleLimitChange();
		} else {
		}
	}, [ debouncedLimitChange ] );

	/**
	 * On product category search term change, trigger a search.
	 */
	useEffect( () => {
		if ( debouncedSearchTerm ) {
			searchCategories();
		} else {
		}
	}, [ debouncedSearchTerm ] );

	/**
	 * On debounced sort change, refresh selected product list.
	 */
	useEffect( () => {
		if ( debouncedSortChange ) {
			handleSortChange();
		} else {
		}
	}, [ debouncedSortChange ] );

	/**
	 * Refresh the selected products list on debounced limit change
	 */
	const handleLimitChange = () => {
		if ( selectedCategories.length > 0 ) {
			handleSearchProducts( selectedCategories );
		}

		onChange( updatedDynamicProductsObject( limit, sort, selectedCategories ) );
	};

	/**
	 * Search the product categories from the WC API on use of debounced search term.
	 *
	 * @return {Array} wcCategories
	 */
	const searchCategories = async () => {
		// return if not searched for products yet
		if ( ! categorySearchTerm ) {
			return;
		}
		// get the search product term and choice id
		const excludedCategories = excludeSelectedCategories();

		setCategoryNotFound( false );
		setIsCategorySearching( true );
		setWcSearchedCategories( [] );

		const searchParams = new URLSearchParams( {
			search: categorySearchTerm,
			per_page: limit,
			exclude: excludedCategories,
		} );

		const wcCategories = await apiFetch( {
			path: `/wc/v3/products/categories/?${ searchParams.toString() }`,
		} ).catch( () => {
			setNotification( 'error', 'There was a problem fetching your products.' );
		} );

		setIsCategorySearching( false );

		if ( wcCategories.length === 0 ) {
			setCategoryNotFound( true );
		}

		setWcSearchedCategories( wcCategories );
	};

	/**
	 * Refresh the selected products list on debounced sort change
	 */
	const handleSortChange = () => {
		if ( selectedCategories.length > 0 ) {
			handleSearchProducts( selectedCategories );
		}

		onChange( updatedDynamicProductsObject( limit, sort, selectedCategories ) );
	};

	/**
	 * Select category from the list of searched categories
	 *
	 * @param {integer} category_id
	 * @param {string}  category_name
	 * @param {string}  category_slug
	 */
	const handleSelectCategory = ( category_id, category_name, category_slug ) => {
		const updateSelectedCategories = [
			...selectedCategories,
			{
				category_id,
				category_name,
				category_slug,
			},
		];
		setSelectedCategories( updateSelectedCategories );
		setWcSearchedCategories( [] );
		setCategorySearchTerm( '' );

		onChange( updatedDynamicProductsObject( limit, sort, updateSelectedCategories ) );

		// initiate the product search for the selected categories
		handleSearchProducts( updateSelectedCategories );
	};

	/**
	 * Search for products from the WC API
	 *
	 * @param  categories_array
	 * @return {Array} wcProducts
	 */
	const handleSearchProducts = async ( categories_array ) => {
		if ( ! categories_array || ! Array.isArray( categories_array ) || categories_array.length < 1 ) {
			return;
		}
		// set product searching true and reset the selected products
		setIsProductSearching( true );
		setWcSelectedProducts( [] );

		// get comma separated category ids
		const commaSeparatedCategoryIds = categories_array.reduce( ( acc, category ) => {
			if ( acc !== '' ) acc += ',';
			acc += category.category_id;
			return acc;
		}, '' );

		const productOrderAttr = productSortOrder();
		const productOrderByAttr = productSortOrderBy();

		const searchParams = new URLSearchParams( {
			type: 'simple',
			per_page: limit,
			category: commaSeparatedCategoryIds,
			order: productOrderAttr,
			orderby: productOrderByAttr,
		} );

		// Make REST API request
		await apiFetch( {
			path: `/wc/v3/products/?${ searchParams.toString() }`,
		} )
			.catch( () => {
				setNotification( 'error', 'There was a problem fetching your products.' );
			} )
			.then( ( response ) => {
				setWcSelectedProducts( response );
				setIsProductSearching( false );
			} );
	};

	/**
	 * Return the selected products
	 *
	 * @return {string} excludeSelectedProduct
	 */
	const excludeSelectedCategories = () => {
		if ( ! selectedCategories || ! Array.isArray( selectedCategories ) || selectedCategories.length < 1 ) {
			return;
		}
		// list the product ids
		const productIDs = selectedCategories.map( ( category ) => category.category_id );
		return productIDs.join( ',' );
	};

	/**
	 * Handle clear all categories
	 */
	const handleClearCategories = () => {
		setSelectedCategories( [] );

		onChange( updatedDynamicProductsObject( limit, sort, [] ) );
	};

	/**
	 * Handle clear category
	 *
	 * @param {integer} category_id
	 */
	const handleClearCategory = ( category_id ) => {
		const filteredCategory = selectedCategories.filter( ( category ) => category.category_id !== category_id );

		setSelectedCategories( filteredCategory );

		// refresh the selected products list
		handleSearchProducts( filteredCategory );

		onChange( updatedDynamicProductsObject( limit, sort, filteredCategory ) );
	};

	const productSortOrder = () => {
		let orderValue = 'asc';
		if ( sort.includes( 'desc' ) ) {
			orderValue = 'desc';
		}
		return orderValue;
	};

	const productSortOrderBy = () => {
		return sort.replace( /_(asc|desc)?$/, '' );
	};

	const updatedDynamicProductsObject = ( limit = 5, sort = 'title', selectedCategories = [] ) => {
		const dynamicProductsObject = {
			limit,
			sort,
			categories: selectedCategories,
		};

		return dynamicProductsObject;
	};

	return (
		<>
			<table className={ containerClasses }>
				<thead className="choice-headers">
					<tr>
						<th colSpan={ 2 } className="wpo-product-limit-category label-wrap">
							{ __( 'Category', 'woocommerce-product-options' ) }
						</th>
						<th colSpan={ 1 } className="wpo-product-limit-label label-wrap">
							{ __( 'Limit', 'woocommerce-product-options' ) }
						</th>
						<th colSpan={ 1 } className="wpo-product-limit-sorting label-wrap">
							{ __( 'Sorting', 'woocommerce-product-options' ) }
						</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td colSpan={ 2 } className="label-wrap">
							<input
								type="text"
								className="regular-input"
								placeholder={ __( 'Search for categories', 'woocommerce-product-options' ) }
								value={ categorySearchTerm }
								onChange={ ( event ) => setCategorySearchTerm( event.target.value ) }
							/>
						</td>
						<td colSpan={ 1 } className="label-wrap">
							<input
								type="number"
								min="0"
								max="50"
								value={ limit }
								className="regular-input"
								onChange={ ( event ) => setLimit( event.target.value ) }
							/>
						</td>
						<td colSpan={ 1 } className="label-wrap">
							<select onChange={ ( event ) => setSort( event.target.value ) } defaultValue={ sort }>
								{ defaultSorting.map( ( sort_option ) => {
									return (
										<option key={ sort_option.name } value={ sort_option.name }>
											{ sort_option.label }
										</option>
									);
								} ) }
							</select>
						</td>
					</tr>
				</tbody>
			</table>

			{ isCategorySearching && <div className="wpo-products-loader">{ spinner }</div> }
			{ categoryNotFound && (
				<div className="barn2-search-list__list is-not-found wpo-products-not-found">
					<div className="components-notice is-info">
						<div className="components-notice__content">
							{ __( 'No categories found', 'woocommerce-product-options' ) }
						</div>
					</div>
				</div>
			) }
			{ wcSearchedCategories.length > 0 && (
				<ul className="barn2-search-list__list wpo-products-option-search">
					{ wcSearchedCategories.map( ( category, id ) => {
						return (
							<li key={ id }>
								<button
									onClick={ () => {
										handleSelectCategory( category.id, category.name, category.slug );
									} }
									className="button button-link barn2-search-list__item"
								>
									<span className="barn2-search-list__item-label">
										<span className="barn2-search-list__item-name">{ category.name }</span>
									</span>
								</button>
							</li>
						);
					} ) }
				</ul>
			) }

			{ selectedCategories.length > 0 && (
				<div className="barn2-search-list__selected wpo-selected-dynamic-categories">
					<div className="barn2-search-list__selected-header">
						<strong>{ __( 'Selected categories', 'woocommerce-product-options' ) }</strong>
						<button
							type="button"
							aria-label="Clear all selected categories"
							className="components-button is-link is-destructive"
							onClick={ () => handleClearCategories() }
						>
							{ __( 'Clear all selected categories', 'woocommerce-product-options' ) }
						</button>
					</div>
					<ul>
						{ selectedCategories.map( ( category, id ) => {
							return (
								<li key={ id }>
									<span className="barn2-tag has-remove">
										<span className="barn2-tag__text" id="barn2-tag__label-16">
											<span className="screen-reader-text">{ category.category_name }</span>
											<span aria-hidden="true">{ category.category_name }</span>
										</span>
										<button
											type="button"
											aria-describedby="barn2-tag__label-16"
											className="components-button barn2-tag__remove"
											aria-label={ category.category_name }
											onClick={ () => handleClearCategory( category.category_id ) }
										>
											{ crossX }
										</button>
									</span>
								</li>
							);
						} ) }
					</ul>
				</div>
			) }

			{ isProductSearching && <div className="wpo-products-loader">{ spinner }</div> }

			{ wcSelectedProducts.length > 0 && selectedCategories.length > 0 && (
				<div>
					<span>{ __( 'The following products will be displayed:', 'woocommerce-product-options' ) }</span>
					<ul className="wpo-dynamic-select-products-list">
						{ wcSelectedProducts.map( ( product, id ) => {
							return (
								<li key={ id }>
									<span>{ product.name } </span>
									<span
										className="wpo-dynamic-product-price"
										dangerouslySetInnerHTML={ { __html: product.price_html } }
									></span>
								</li>
							);
						} ) }
					</ul>
					<p>
						<span>
							{ __(
								'The selected products will change dynamically to ensure that the above criteria are always met. ',
								'woocommerce-product-options'
							) }
						</span>
						<a href={ kbLinkToDynamicChoices } target="_blank" rel="noreferrer">
							{ __( 'Learn more.', 'woocommerce-product-options' ) }
						</a>
					</p>
				</div>
			) }

			{ ! isProductSearching && wcSelectedProducts.length === 0 && selectedCategories.length > 0 && (
				<div>
					<p>{ __( 'No available products found. ', 'woocommerce-product-options' ) }</p>
				</div>
			) }
		</>
	);
};

export default DynamicProducts;
