/**
 * WordPress dependencies.
 */
import { Fragment } from '@wordpress/element';
import { __, _n } from '@wordpress/i18n';

/**
 * Displays the content of the visiblity column.
 *
 * @param {Object} props
 * @param {Object} props.table
 * @param {Object} props.visibilityObjects
 * @return {Object} JSX
 */
const VisibilityCell = ( { table } ) => {
	const { visibility, products, exclude_products, categories, exclude_categories, visibility_objects } =
		table.row.original;
	const visibilityObjects = visibility_objects;

	/**
	 * On component mount, trigger an automated search for selected products.
	 */
	const formattedProducts = visibilityObjects?.products?.filter( ( object ) => {
		return products?.includes( object.id );
	} );

	const formattedCategories = visibilityObjects?.categories?.filter( ( object ) => {
		return categories?.includes( object.term_id );
	} );

	const formattedExcludedProducts = visibilityObjects?.products?.filter( ( object ) => {
		// eslint-disable-next-line camelcase
		return exclude_products?.includes( object.id );
	} );

	const formattedExcludedCategories = visibilityObjects?.categories?.filter( ( object ) => {
		// eslint-disable-next-line camelcase
		return exclude_categories?.includes( object.term_id );
	} );

	/**
	 * Get the formatted list of renderable visibilities.
	 *
	 * @return {React.ReactElement} Formatted list of products and categories
	 */
	const getItemsFormatted = () => {
		if ( visibilityObjects === null ) {
			return '';
		}

		const productCount = formattedProducts?.length ?? 0;
		const categoryCount = formattedCategories?.length ?? 0;
		const excludedProductCount = formattedExcludedProducts?.length ?? 0;
		const excludedCategoryCount = formattedExcludedCategories?.length ?? 0;
		const objectCount = productCount + categoryCount + excludedProductCount + excludedCategoryCount;

		return (
			<div className="wpo-visibility-cell">
				{ ( objectCount === 0 || visibility === 'global' ) && (
					<span className="barn2-selection-item" key={ 'all-product-list' }>
						{ __( 'All products', 'woocommerce-product-options' ) }
					</span>
				) }
				{
					<>
						{ productCount > 0 && (
							<span className="barn2-selection-item" key={ 'products-list' }>
								<strong>
									{ _n( 'Product: ', 'Products: ', productCount, 'woocommerce-product-options' ) }
								</strong>
								<span className="barn2-selection-list">
									{ formattedProducts.map( ( product, index ) => {
										return (
											<Fragment key={ product.id }>
												<a href={ product.href }>{product.name}</a>
												{ index < formattedProducts.length - 1 && <>, </> }
											</Fragment>
										);
									} ) }
								</span>
							</span>
						) }
						{ categoryCount > 0 && (
							<span className="barn2-selection-item" key={ 'category-list' }>
								<strong>
									{ _n( 'Category: ', 'Categories: ', categoryCount, 'woocommerce-product-options' ) }
								</strong>
								<span className="barn2-selection-list">
									{ formattedCategories.map( ( category, index ) => {
										return (
											<Fragment key={ category.term_id }>
												<a href={ category.href }>{category.name}</a>
												{ index < formattedCategories.length - 1 && <>, </> }
											</Fragment>
										);
									} ) }
								</span>
							</span>
						) }
						{ excludedProductCount > 0 && (
							<span className="barn2-selection-item" key={ 'excluded-products-list' }>
								<strong>
									{ _n(
										'Excluding product: ',
										'Excluding products: ',
										excludedProductCount,
										'woocommerce-product-options'
									) }
								</strong>
								<span className="barn2-selection-list">
									{ formattedExcludedProducts.map( ( product, index ) => {
										return (
											<Fragment key={ product.id }>
												<a href={ product.href }>{product.name}</a>
												{ index < formattedExcludedProducts.length - 1 && <>, </> }
											</Fragment>
										);
									} ) }
								</span>
							</span>
						) }
						{ excludedCategoryCount > 0 && (
							<span className="barn2-selection-item" key={ 'excluded-category-list' }>
								<strong>
									{ _n(
										'Excluding category: ',
										'Excluding categories: ',
										excludedCategoryCount,
										'woocommerce-product-options'
									) }
								</strong>
								<span className="barn2-selection-list">
									{ formattedExcludedCategories.map( ( category, index ) => {
										return (
											<Fragment key={ category.term_id }>
												<a href={ category.href }>{category.name}</a>
												{ index < formattedExcludedCategories.length - 1 && <>, </> }
											</Fragment>
										);
									} ) }
								</span>
							</span>
						) }
					</>
				}
			</div>
		);
	};

	return <>{ getItemsFormatted() }</>;
};

export default VisibilityCell;
