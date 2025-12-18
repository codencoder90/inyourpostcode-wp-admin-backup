<?php
namespace Barn2\Plugin\WC_Product_Options\Model;

use Barn2\Plugin\WC_Product_Options\Dependencies\Illuminate\Database\Eloquent\Model;
use Barn2\Plugin\WC_Product_Options\Dependencies\Sematico\FluentQuery\Concerns\HasUniqueIdentifier;
use Barn2\Plugin\WC_Product_Options\Model\Group;
use Barn2\Plugin\WC_Product_Options\Plugin;
use Barn2\Plugin\WC_Product_Options\Util\Util;
use WC_Product_Variable;

/**
 * Representation of an individual group and it's options.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Option extends Model {

	use HasUniqueIdentifier;

	protected $table   = Plugin::META_PREFIX . 'options';
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
		'group_id',
		'menu_order',
		'display_name',
		'description',
		'required',
		'type',
		'choices',
		'settings',
		'conditional_logic',
	];

	/**
	 * Defaults
	 *
	 * @var array
	 */
	protected $attributes = [
		'name'              => '',
		'group_id'          => 0,
		'menu_order'        => 0,
		'display_name'      => 1,
		'description'       => '',
		'required'          => 0,
		'type'              => 'text',
		'choices'           => 'null',
		'settings'          => 'null',
		'conditional_logic' => 'null',
	];

	/**
	 * Automatically cast attributes in specific ways.
	 *
	 * @var array
	 */
	protected $casts = [
		'choices'           => 'array',
		'settings'          => 'array',
		'conditional_logic' => 'array',
	];

	/**
	 * Retrieve the first available price suffix on the product.
	 *
	 * @param WC_Product $product
	 * @return string|null
	 */
	public static function get_price_suffixes_by_product( $product ): ?string {
		$groups = Group::get_groups_by_product( $product );

		if ( empty( $groups ) ) {
			return null;
		}

		$group_ids = wp_list_pluck( $groups, 'id' );

		$formula_options = self::getQuery()
			->whereIn( 'group_id', $group_ids )
			->where( 'type', 'price_formula' )
			->whereNotNull( 'settings->price_suffix' )
			->get();

		if ( $formula_options->isEmpty() ) {
			return null;
		}

		$formula_options = $formula_options->toArray();

		$price_suffixes = array_map(
			function ( $option ) {
				return json_decode( $option->settings )->price_suffix;
			},
			$formula_options
		);

		return reset( $price_suffixes );
	}

	/**
	 * Determine if the product price should be excluded from the calculation.
	 *
	 * @param WC_Product $product
	 * @return bool
	 */
	public static function get_product_price_exclusion_status( $product ): bool {
		$groups = Group::get_groups_by_product( $product );

		if ( empty( $groups ) ) {
			return false;
		}

		$group_ids = wp_list_pluck( $groups, 'id' );

		$formula_options = self::getQuery()
			->whereIn( 'group_id', $group_ids )
			->where( 'type', 'price_formula' )
			->get();

		if ( $formula_options->isEmpty() ) {
			return false;
		}

		$formula_options = $formula_options->toArray();

		$exclude_product_price = array_filter(
			$formula_options,
			function ( $option ) {
				return isset( json_decode( $option->settings )->exclude_product_price ) ? json_decode( $option->settings )->exclude_product_price : false;
			}
		);

		return ! empty( $exclude_product_price );
	}

	/**
	 * Retrieve the image IDs to be used in the product gallery.
	 *
	 * @param WC_Product $product
	 * @return array
	 */
	public static function get_image_options_for_gallery( $product ): array {
		$groups = Group::get_groups_by_product( $product );

		if ( empty( $groups ) ) {
			return [];
		}

		$group_ids = wp_list_pluck( $groups, 'id' );

		$image_options = self::getQuery()
			->whereIn( 'group_id', $group_ids )
			->where( 'settings->show_in_product_gallery', true )
			->get();

		if ( $image_options->isEmpty() ) {
			return [];
		}

		$image_options = $image_options->toArray();

		$image_ids = array_map(
			function ( $option ) use ( $product ) {
				$class = Util::get_field_class( $option->type );

				if ( ! class_exists( $class ) ) {
					return [];
				}

				$option_model = self::where( 'id', $option->id )->get()->first();

				$field = new $class( $option_model, $product );

				if ( $field->is_variation_attribute_type_option() && ! $field->is_valid_attribute_option_for_product() ) {
					return [];
				}

				switch ( $option->type ) {
					case 'product':
						return self::get_product_choices_images( $option, $product );
					case 'images':
					default:
						return array_column( json_decode( $option->choices ), 'media' );
				}
			},
			$image_options
		);

		if ( empty( $image_ids ) ) {
			return [];
		}

		$image_ids = array_merge( ...$image_ids );

		return $image_ids;
	}

	public static function get_product_choices_images( $option, $product ) {
		if ( $option->type !== 'product' ) {
			return false;
		}

		$settings     = json_decode( $option->settings, true );
		$product_type = 'manual';
		$args         = [];

		if ( isset( $settings['product_selection'] ) && $settings['product_selection'] === 'dynamic' ) {
			$product_type = 'dynamic';
		}

		// for manually selected products
		if ( $product_type === 'manual' ) {
			$products_list = wp_list_pluck( $settings['manual_products'], 'product_id' );
			$products_list = array_diff( $products_list, [ $product->get_id() ] );

			$args = [
				'include' => $products_list,
				'orderby' => 'include',
			];
		} elseif ( $product_type === 'dynamic' ) {
			// for dynamic products
			$dynamic_products = $settings['dynamic_products'];
			$order_by         = str_replace( [ 'asc', 'desc', '_' ], '', $dynamic_products['sort'] );
			$order            = str_contains( $dynamic_products['sort'], 'desc' ) ? 'desc' : 'asc';
			$categories       = wp_list_pluck( $dynamic_products['categories'], 'category_slug' );

			$args = [
				'exclude'  => [ $product->get_id() ],
				'type'     => 'simple',
				'orderby'  => $order_by,
				'order'    => strtoupper( $order ),
				'limit'    => $dynamic_products['limit'],
				'category' => $categories,
			];
		}

		$products = wc_get_products( $args );

		return array_map(
			function ( $product ) {
				return $product->get_image_id();
			},
			$products
		);
	}

	public static function clean_option_data( $data ) {
		$type = $data['type'];

		foreach ( $data as $key => $value ) {
			if ( self::type_supports_property( $key, $type ) ) {
				$cleaned_data[ $key ] = $value;
			}
		}

		return $cleaned_data;
	}

	public static function type_supports_property( $property, $type ) {
		$property_support = [
			'checkbox' => [
				'choices'           => [],
				'settings'          => [ 'choice_qty' ],
				'conditional_logic' => [],
			],
			'radio'    => [
				'choices'           => [],
				'settings'          => [ 'choice_qty' ],
				'conditional_logic' => [],
			],
		];

		return in_array( $type, $property_support[ $property ], true );
	}

	/**
	 * Whether the price formula includes the [product_quantity]
	 *
	 * @param int $option_id
	 * @return bool
	 */
	public static function formula_includes_product_quantity( $option_id ): bool {
		$option_settings = self::getQuery()
			->where( 'id', $option_id )
			->where( 'type', 'price_formula' )
			->get( 'settings' );

		if ( $option_settings->isEmpty() ) {
			return false;
		}

		$option_settings = json_decode( $option_settings->first()->settings );

		return array_reduce(
			$option_settings->formula->customVariables ?? [],
			function ( $carry, $custom_variable ) {
				return $carry || str_contains( $custom_variable->formula, '[product_quantity]' );
			},
			str_contains( $option_settings->formula->formula, '[product_quantity]' )
		);
	}

	/**
	 * Retrieve the custom attribute options for the product.
	 *
	 * @param WC_Product $product
	 * @return array
	 */
	public static function get_product_custom_attribute_options( $product ) {
		if ( ! $product instanceof WC_Product_Variable ) {
			return [];
		}

		$groups = Group::get_groups_by_product( $product );

		if ( empty( $groups ) ) {
			return [];
		}

		$group_ids = wp_list_pluck( $groups, 'id' );

		$attribute_options = self::getQuery()
			->whereIn( 'group_id', $group_ids )
			->where( 'settings->choice_type', 'variation_attributes' )
			->whereNotNull( 'settings->selected_attribute' )
			->where( 'settings->selected_attribute', '!=', '' )
			->get();

		if ( $attribute_options->isEmpty() ) {
			return [];
		}

		$attribute_options = $attribute_options->toArray();

		// return only the selected attribute values for each option
		$attribute_options = array_map(
			function ( $option ) {
				$option_settings = json_decode( $option->settings );
				return $option_settings->selected_attribute;
			},
			$attribute_options
		);

		return array_unique( $attribute_options );
	}

	/**
	 * Retrieve all custom attribute options for the given attribute, which do not have a choice set for the given term.
	 */
	public static function get_missing_attribute_options( $attribute, $term_id ) {
		$term = get_term( $term_id );

		if ( ! $term ) {
			return [];
		}

		$term_slug = $term->slug;

		$attribute_options = self::getQuery()
			->where( 'settings->choice_type', 'variation_attributes' )
			->where( 'settings->selected_attribute', $attribute )
			->whereJsonDoesntContain('choices', [ 'term' => $term_slug ] )
			->get();

		if ( $attribute_options->isEmpty() ) {
			return [];
		}

		return $attribute_options->toArray();
	}
}
