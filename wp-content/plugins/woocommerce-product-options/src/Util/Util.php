<?php

namespace Barn2\Plugin\WC_Product_Options\Util;

use Barn2\Plugin\WC_Product_Options\Fields;
use Barn2\Plugin\WC_Product_Options\Model\Option as Option_Model;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Util as Lib_Util;

/**
 * General utilities.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
final class Util {

	/**
	 * Helper function to replace wp_localize_script
	 *
	 * @param string $script_handle
	 * @param string $variable_name
	 * @param array  $script_params
	 */
	public static function add_inline_script_params( $script_handle, $variable_name, $script_params ) {
		$script_data = sprintf( 'var %1$s = %2$s', $variable_name, wp_json_encode( $script_params ) );
		wp_add_inline_script( $script_handle, $script_data, 'before' );
	}

	/**
	 * Retrieve the Field class for an option type.
	 *
	 * @param  string $type
	 * @return string|false
	 */
	public static function get_field_class( $type ) {
		/**
		 * Filters the field classes.
		 *
		 * @param array $fields The field classes.
		 */
		$fields = apply_filters(
			'wc_product_options_field_classes',
			[
				'text'           => Fields\Text::class,
				'textarea'       => Fields\Textarea::class,
				'number'         => Fields\Number::class,
				'checkbox'       => Fields\Checkboxes::class,
				'radio'          => Fields\Radios::class,
				'images'         => Fields\Image_Buttons::class,
				'color_swatches' => Fields\Color_Swatches::class,
				'text_labels'    => Fields\Text_Labels::class,
				'dropdown'       => Fields\Select::class,
				'customer_price' => Fields\Price::class,
				'file_upload'    => Fields\File::class,
				'html'           => Fields\Display::class,
				'wysiwyg'        => Fields\Display::class,
				'price_formula'  => Fields\Price_Formula::class,
				'datepicker'     => Fields\Date_Picker::class,
				'product'        => Fields\Products::class,
			]
		);

		return isset( $fields[ $type ] ) ? $fields[ $type ] : false;
	}

	/**
	 * Generates a HTML attributes string for an array of data.
	 *
	 * @param  array $attributes
	 * @return string $attribute_string
	 */
	public static function get_html_attribute_string( array $attributes ) : string {
		$formatted_attributes = array_map(
			function ( $name, $value ) {
				return sprintf( '%1$s="%2$s"', esc_attr( $name ), esc_attr( $value ) );
			},
			array_keys( $attributes ),
			array_values( $attributes )
		);

		$attribute_string = implode( ' ', $formatted_attributes );

		return $attribute_string;
	}

	/**
	 * Determine if a color is bright.
	 *
	 * @param  string $hex_color Hexadecimal color value without the '#' e.g. 'E6E6E6'
	 * @param  int    $threshold
	 * @return bool
	 */
	public static function is_color_bright( string $hex_color, int $threshold = 240 ) : bool {
		$r = hexdec( substr( $hex_color, 0, 2 ) );
		$g = hexdec( substr( $hex_color, 2, 2 ) );
		$b = hexdec( substr( $hex_color, 4, 2 ) );

		return ( ( $r * 299 + $g * 587 + $b * 114 ) / 1000 > $threshold );
	}

	/**
	 * Returns the allowed product types.
	 *
	 * @return array
	 */
	public static function get_allowed_product_types() {
		/**
		 * Filters the allowed product types.
		 *
		 * @param array $product_types The allowed product types.
		 */
		return apply_filters( 'wc_product_options_allowed_product_types', [ 'simple', 'variable', 'variation', 'subscription', 'variable-subscription', 'subscription_variation' ] );
	}

	/**
	 * Checks if a product type is allowed.
	 *
	 * @param  string $type
	 * @return bool
	 */
	public static function is_allowed_product_type( $type ) {
		return in_array( $type, self::get_allowed_product_types(), true );
	}

	/**
	 * Determines if a group has options.
	 *
	 * @param  mixed $groups
	 * @return bool
	 */
	public static function groups_have_options( $groups ) {
		foreach ( $groups as $group ) {
			$options = Option_Model::where( 'group_id', $group->id )->orderBy( 'menu_order', 'asc' )->get();

			if ( ! $options->isEmpty() ) {
				return true;
			}
		}

		return false;
	}

	public static function get_attribute_taxonomies() {
		$taxonomies = wc_get_attribute_taxonomies();

		return [
			...array_values(
				array_map(
					function ( $taxonomy ) {
						return [
							'id'      => "pa_{$taxonomy->attribute_name}",
							'name'    => $taxonomy->attribute_label,
							'choices' => array_map(
								function ( $term ) use ( $taxonomy ) {
									return [
										'id'    => $term->slug,
										'label' => $term->name,
										'link'  => get_edit_term_link( $term->term_id, "pa_{$taxonomy->attribute_name}" ),
									];
								},
								get_terms(
									[
										'taxonomy'   => "pa_{$taxonomy->attribute_name}",
										'hide_empty' => false,
									]
								)
							),
						];
					},
					$taxonomies
				)
			),
		];
	}

	public static function get_inventory_properties() {
		return [];
	}

	public static function get_shipping_properties() {
		return [
			[
				'id'   => 'product_weight',
				'name' => __( 'Weight', 'woocommerce-product-options' ),
			],
			[
				'id'   => 'product_length',
				'name' => __( 'Length', 'woocommerce-product-options' ),
			],
			[
				'id'   => 'product_width',
				'name' => __( 'Width', 'woocommerce-product-options' ),
			],
			[
				'id'   => 'product_height',
				'name' => __( 'Height', 'woocommerce-product-options' ),
			],
		];
	}

	public static function is_live_preview_installed() {
		$is_live_preview_installed = ! empty(
			array_filter(
				array_column( Lib_Util::get_installed_barn2_plugins( true ), 'TextDomain' ),
				function ( $textdomain ) {
					return $textdomain === 'woocommerce-live-preview';
				}
			)
		);

		return $is_live_preview_installed;
	}

	public static function is_live_preview_active() {
		return is_plugin_active( 'woocommerce-live-preview/woocommerce-live-preview.php' );
	}

	public static function is_live_preview_included( $license ) {
		return ! empty(
			array_filter(
				$license->get_bonus_downloads(),
				function ( $download ) {
					return intval( $download->id ) === 657851;
				}
			)
		);
	}
}
