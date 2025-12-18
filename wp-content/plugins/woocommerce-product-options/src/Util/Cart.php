<?php

namespace Barn2\Plugin\WC_Product_Options\Util;

use Barn2\Plugin\WC_Product_Options\Model\Option as Option_Model;
use Barn2\Plugin\WC_Product_Options\Dependencies\Illuminate\Database\Eloquent\ModelNotFoundException;
use Barn2\Plugin\WC_Product_Options\Util\Conditional_Logic;

/**
 * Cart utilities.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
final class Cart {

	/**
	 * Handles validation on add to cart.
	 *
	 * @param bool $passed
	 * @param int $product_id
	 * @param int $quantity
	 * @param int|null $variation_id
	 * @param WC_Product_Variation $variation
	 * @param array|null $post_data
	 * @return bool $passed
	 */
	public static function handle_validation( $passed, $product_id, $quantity, $variation_id = null, $variation = null, $post_data = null ): bool {
		/**
		 * Filters whether to allow product option price calculation on a product.
		 *
		 * @param bool $enable Whether to handle validation on the product
		 * @param int $product_id The product ID which is being validated.
		 * @param int $quantity The quantity of the product being validated.
		 * @param int|null $variation_id The variation ID if this is a variation.
		 * @param WC_Product_Variation $variation The variation if this is a variation.
		 */
		$handle_add_to_cart_validation = apply_filters( 'wc_product_options_handle_add_to_cart_validation', true, $passed, $product_id, $quantity, $variation_id, $variation );

		if ( ! $handle_add_to_cart_validation ) {
			return $passed;
		}

		$object_id = is_numeric( $variation_id ) ? $variation_id : $product_id;
		$product   = wc_get_product( $object_id );

		if ( is_null( $product ) || $product === false ) {
			return $passed;
		}

		if ( ! Util::is_allowed_product_type( $product->get_type() ) ) {
			return $passed;
		}

		if ( $post_data ) {
			$options = $post_data['wpo-option'] ?? [];
		} else {
			$options = filter_input( INPUT_POST, 'wpo-option', FILTER_DEFAULT, FILTER_REQUIRE_ARRAY );
		}

		if ( ! $options ) {
			return $passed;
		}

		foreach ( $options as $prefixed_option_id => $value ) {
			$option_id = str_replace( 'option-', '', $prefixed_option_id );

			try {
				$option = Option_Model::findOrFail( $option_id );
			} catch ( ModelNotFoundException $exception ) {
				continue;
			}

			$field_class = Util::get_field_class( $option->type );

			if ( ! class_exists( $field_class ) ) {
				/* translators: %s: option name */
				wc_add_notice( esc_html( sprintf( __( 'The option "%s" is not supported.', 'woocommerce-product-options' ), $option->name ) ), 'error' );
				return false;
			}

			if ( is_array( $value ) ) {
				$value = array_filter( $value );
			}

			$field_object   = new $field_class( $option, $product );
			$field_validate = $field_object->validate( $value, $options );

			if ( is_wp_error( $field_validate ) ) {
				wc_add_notice( $field_validate->get_error_message(), 'error' );
				$passed = false;
			}
		}

		return $passed;
	}

	/**
	 * Add product options data to item inside the cart.
	 *
	 * @param array $cart_item_data
	 * @param int   $product_id
	 * @param int   $variation_id
	 * @param int   $quantity
	 * @param array|null $post_data This is used for the WPT integration.
	 * @return array|null
	 */
	public static function add_cart_item_data( $cart_item_data, $product_id, $variation_id, $quantity, $post_data = null ) {
		$product = $variation_id === 0 ? wc_get_product( $product_id ) : wc_get_product( $variation_id );

		if ( ! $product || ! Util::is_allowed_product_type( $product->get_type() ) ) {
			return $cart_item_data;
		}

		if ( $post_data ) {
			$options = $post_data['wpo-option'] ?? [];
		} else {
			$options = filter_input( INPUT_POST, 'wpo-option', FILTER_DEFAULT, FILTER_REQUIRE_ARRAY );
		}

		if ( ! $options ) {
			return $cart_item_data;
		}

		foreach ( $options as $prefixed_option_id => $input_value ) {

			$option_id = str_replace( 'option-', '', $prefixed_option_id );

			try {
				$option = Option_Model::findOrFail( $option_id );
			} catch ( ModelNotFoundException $exception ) {
				continue;
			}

			if ( $option->type !== 'price_formula' && empty( $option->choices ) ) {
				continue;
			}

			$field_class  = Util::get_field_class( $option->type );
			$field_object = new $field_class( $option, $product );

			if ( Conditional_logic::is_field_hidden( $field_object, $options ) || $field_object->is_variation_attribute_type_option() ) {
				continue;
			}

			$sanitized_value = $field_object->sanitize( $input_value );

			$item_data = $field_object->get_cart_item_data( $sanitized_value, $product, $quantity, $options );

			if ( $item_data ) {
				$cart_item_data['wpo_options'][ $option->id ] = $item_data;
			}
		}

		return $cart_item_data;
	}
}
