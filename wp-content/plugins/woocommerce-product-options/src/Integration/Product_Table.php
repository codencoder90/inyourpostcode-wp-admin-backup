<?php

namespace Barn2\Plugin\WC_Product_Options\Integration;

use Barn2\Plugin\WC_Product_Options\Model\Group as Group_Model;
use Barn2\Plugin\WC_Product_Options\Model\Option as Option_Model;
use Barn2\Plugin\WC_Product_Options\Handlers;
use Barn2\Plugin\WC_Product_Table\Table_Args;
use Barn2\Plugin\WC_Product_Table\Cart_Handler as WPT_Cart_Handler;
use Barn2\Plugin\WC_Product_Options\Util\Util;
use Barn2\Plugin\WC_Product_Options\Util\Cart as Cart_Util;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Util as Lib_Util;
use WC_Product;

/**
 * Handles the WooCommerce Product Table integration.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Product_Table implements Standard_Service, Registerable {

	/**
	 * Register the integrations for WPT.
	 */
	public function register() {
		if ( ! Lib_Util::is_barn2_plugin_active( '\Barn2\Plugin\WC_Product_Table\wpt' ) ) {
			return;
		}

		// Load our WPO scripts
		add_action( 'wc_product_table_load_table_scripts', [ $this, 'load_scripts' ] );

		// Special cart item data and validation handling for multi add to cart.
		add_action( 'wc_product_table_before_add_to_cart_multi', [ $this, 'before_multi_add_to_cart' ] );

		// Handle multi add to cart.
		add_filter( 'wc_product_table_multi_add_to_cart_data', [ $this, 'multi_add_to_cart_data' ], 10, 2 );
	}

	/**
	 * Load frontend scripts.
	 *
	 * @param Barn2\Plugin\WC_Product_Table\Table_Args $args
	 */
	public function load_scripts( Table_Args $args ) {
		// Product Options scripts only needed if add to cart column present.
		if ( ! in_array( 'buy', $args->columns, true ) ) {
			return;
		}

		// Next check if the Addons script is already queued.
		if ( wp_script_is( 'wpo-product-table', 'enqueued' ) ) {
			return;
		}

		wp_enqueue_script( 'wpo-product-table' );
		wp_enqueue_style( 'wpo-frontend-fields' );
	}

	/**
	 * Add custom handlers item_data and validaiton for multi add to cart.
	 */
	public function before_multi_add_to_cart() {
		// Remove and add some filters to process the multi cart data correctly.
		remove_filter( 'woocommerce_add_cart_item_data', [ Handlers\Item_Data::class, 'add_cart_item_data' ], 10 );
		add_filter( 'woocommerce_add_cart_item_data', [ $this, 'cart_item_data_wrapper' ], 10, 4 );

		remove_filter( 'woocommerce_add_to_cart_validation', [ Handlers\Add_To_Cart::class, 'handle_validation' ], 10, 5 );
		add_filter( 'woocommerce_add_to_cart_validation', [ $this, 'handle_validation' ], 10, 5 );
	}

	/**
	 * Add product options data to item inside the cart.
	 *
	 * @param array $cart_item_data
	 * @param int   $product_id
	 * @param int   $variation_id
	 * @param int   $quantity
	 * @return array
	 */
	public function cart_item_data_wrapper( $cart_item_data, $product_id, $variation_id, $quantity ) {
		$cart_data = WPT_Cart_Handler::get_multi_cart_data();

		if ( isset( $cart_data[ $product_id ] ) && is_array( $cart_data[ $product_id ] ) ) {
			$post_data = $cart_data[ $product_id ];

			// serializeObject combines array options into a comma separated string.
			if ( isset( $post_data['wpo-option'] ) && is_array( $post_data['wpo-option'] ) ) {
				foreach ( $post_data['wpo-option'] as $key => $value ) {
					if ( is_array( $value ) ) {
						$post_data['wpo-option'][ $key ] = explode( ',', $value[0] );
					}
				}
			}
		} else {
			return $cart_item_data;
		}

		return Cart_Util::add_cart_item_data( $cart_item_data, $product_id, $variation_id, $quantity, $post_data );
	}

	/**
	 * Handles validation on add to cart.
	 *
	 * @param bool $passed
	 * @param int $product_id
	 * @param int $quantity
	 * @param int|null $variation_id
	 * @param WC_Product_Variation $variation
	 * @return bool $passed
	 */
	public function handle_validation( $passed, $product_id, $quantity, $variation_id = null, $variation = null ) {
		$cart_data = WPT_Cart_Handler::get_multi_cart_data();

		if ( isset( $cart_data[ $product_id ] ) && is_array( $cart_data[ $product_id ] ) ) {
			$post_data = $cart_data[ $product_id ];

			// serializeObject combines array options into a comma separated string.
			if ( isset( $post_data['wpo-option'] ) && is_array( $post_data['wpo-option'] ) ) {
				foreach ( $post_data['wpo-option'] as $key => $value ) {
					if ( isset( $value['product_ids'] ) ) {
						$post_data['wpo-option'][ $key ] = [ 'product_ids' => explode( ',', $value['product_ids'][0] ) ];
					} elseif ( is_array( $value ) ) {
						$post_data['wpo-option'][ $key ] = explode( ',', $value[0] );
					}
				}
			}

			$passed = Cart_Util::handle_validation( $passed, $product_id, $quantity, $variation_id, $variation, $post_data );
		}

		return $passed;
	}

	/**
	 * Set multi add to cart data.
	 *
	 * @param array $data
	 * @param WC_Product $product
	 * @return array
	 */
	public function multi_add_to_cart_data( array $data, WC_Product $product ) {

		if ( ! $product || ! Util::is_allowed_product_type( $product->get_type() ) ) {
			return $data;
		}

		$groups = Group_Model::get_groups_by_product( $product );

		if ( empty( $groups ) ) {
			return $data;
		}

		foreach ( $groups as $group ) {

			$options = Option_Model::where( 'group_id', (int) $group->id )->orderBy( 'menu_order', 'asc' )->get();

			if ( $options->isEmpty() ) {
				continue;
			}

			foreach ( $options as $option ) {

				$class = Util::get_field_class( $option->type );

				if ( ! class_exists( $class ) ) {
					continue;
				}

				$field = new $class( $option, $product );

				if ( $field->stores_multiple_values() ) {
					$data[ "wpo-option[option-$option->id][]" ] = '';
				} elseif ( $field->get_type() === 'product' ) {
					$data[ "wpo-option[option-$option->id][products][]" ] = '';
				} else {
					$data[ "wpo-option[option-$option->id]" ] = '';
				}
			}
		}

		return $data;
	}
}
