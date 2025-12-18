<?php
namespace Barn2\Plugin\WC_Product_Options\Model;

use Barn2\Plugin\WC_Product_Options\Dependencies\Illuminate\Database\Eloquent\Model;
use Barn2\Plugin\WC_Product_Options\Dependencies\Sematico\FluentQuery\Concerns\HasUniqueIdentifier;
use Barn2\Plugin\WC_Product_Options\Plugin;

/**
 * Representation of an individual group and it's options.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Group extends Model {

	use HasUniqueIdentifier;

	protected $table   = Plugin::META_PREFIX . 'groups';
	public $timestamps = false;

	// phpcs:ignore WordPress.NamingConventions.ValidVariableName.PropertyNotSnakeCase
	protected $primaryKey = 'id';


	/**
	 * Fields which can be mass assigned.
	 *
	 * @var array
	 */
	public $fillable = [
		'name',
		'display_name',
		'menu_order',
		'visibility',
		'categories',
		'exclude_categories',
		'products',
		'exclude_products',
	];

	/**
	 * Defaults
	 *
	 * @var array
	 */
	protected $attributes = [
		'name'               => '',
		'menu_order'         => 0,
		'display_name'       => 0,
		'visibility'         => 'global',
		'categories'         => 'null',
		'exclude_categories' => 'null',
		'products'           => 'null',
		'exclude_products'   => 'null',
	];

	/**
	 * Automatically cast attributes in specific ways.
	 *
	 * @var array
	 */
	protected $casts = [
		'products'           => 'array',
		'exclude_products'   => 'array',
		'categories'         => 'array',
		'exclude_categories' => 'array',
	];

	/**
	 * Get the groups for a particular product.
	 *
	 * @param \WC_Product $product
	 * @return array
	 */
	public static function get_groups_by_product( $product ) {
		if ( ! $product instanceof \WC_Product ) {
			return [];
		}

		$product_id = $product->is_type( 'variation' ) ? $product->get_parent_id() : $product->get_id();
		$term_ids   = wc_get_product_term_ids( $product_id, 'product_cat' );

		// We need to get the ancestors of the categories as well
		// otherwise a product that belongs to a subcategory will not be
		// included in the group that applies to the parent category.
		$deep_category_ids = [];

		foreach ( $term_ids as $term_id ) {
			$ancestors         = get_ancestors( $term_id, 'product_cat' );
			$deep_category_ids = array_merge( $deep_category_ids, $ancestors, [ $term_id ] );
		}

		$term_ids = array_unique( $deep_category_ids );

		// We finally get the groups that apply to the product.
		$collection = self::getQuery()

			// We exclude groups that are not enabled.
			->where( 'visibility', 'NOT LIKE', 'disabled-%' )

			// We exclude groups that have the current product listed in the product exclusion list.
			->whereJsonDoesntContain( 'exclude_products', [ $product_id ] )

			// We exclude groups that have the current product in one of the categories
			// listed in the category exclusion list or their ancestors.
			->where(
				function ( $query ) use ( $term_ids ) {
					foreach ( $term_ids as $term_id ) {
						$query->whereJsonDoesntContain( 'exclude_categories', [ $term_id ] );
					}
				}
			)

			// We include all the groups that meet one of the following conditions:
			->where(
				function ( $query ) use ( $term_ids, $product_id ) {
					$query
					// 1. The option group applies to all products.
					->orWhere( 'visibility', 'global' )
					// 2. The product is listed in the product inclusion list.
					->orWhereJsonContains( 'products', [ $product_id ] )
					// 3. The product belongs to at least one of the categories
					// listed in the category inclusion list or their ancestors.
					->orWhere(
						function ( $query ) use ( $term_ids ) {
							foreach ( $term_ids as $term_id ) {
								$query->orWhereJsonContains( 'categories', [ $term_id ] );
							}
						}
					);
				}
			)

			->orderBy( 'menu_order', 'asc' )
			->get();

		if ( $collection->isEmpty() ) {
			return [];
		}

		return $collection->toArray();
	}
}
