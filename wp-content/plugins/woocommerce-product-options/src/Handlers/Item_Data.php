<?php

namespace Barn2\Plugin\WC_Product_Options\Handlers;

use Barn2\Plugin\WC_Product_Options\Util\Util;
use Barn2\Plugin\WC_Product_Options\Util\Price as Price_Util;
use Barn2\Plugin\WC_Product_Options\Util\Cart as Cart_Util;
use Barn2\Plugin\WC_Product_Options\Model\Option as Option_Model;
use Barn2\Plugin\WC_Product_Options\Dependencies\Illuminate\Database\Eloquent\ModelNotFoundException;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service as ServiceStandard_Service;

/**
 * Handles adding and displaying the product options item data.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Item_Data implements Registerable, ServiceStandard_Service {

	/**
	 * Register hooks and filters.
	 */
	public function register() {
		add_filter( 'woocommerce_add_cart_item_data', [ $this, 'add_cart_item_data' ], 10, 4 );
		add_filter( 'woocommerce_get_item_data', [ $this, 'display_cart_item_data' ], 10, 2 );
		add_action( 'woocommerce_checkout_create_order_line_item', [ $this, 'add_order_item_data' ], 10, 4 );

		add_filter( 'woocommerce_order_again_cart_item_data', [ $this, 'order_again_cart_item_data' ], 10, 3 );
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
	public function add_cart_item_data( $cart_item_data, $product_id, $variation_id, $quantity ): array {
		return Cart_Util::add_cart_item_data( $cart_item_data, $product_id, $variation_id, $quantity );
	}

	/**
	 * Display product options data in the cart and checkout.
	 *
	 * @param array $item_data
	 * @param array $cart_item
	 *
	 * @return array
	 */
	public function display_cart_item_data( $item_data, $cart_item ): array {
		if ( ! isset( $cart_item['wpo_options'] ) ) {
			return $item_data;
		}

		$wpo_options = $cart_item['wpo_options'];

		foreach ( $wpo_options as $option_data ) {
			do_action( 'wc_product_options_before_cart_item_data_option', $item_data, $cart_item, $option_data, $wpo_options );

			$item_data[] = [
				'key'   => $option_data['name'],
				'value' => $this->format_item_data( $option_data['choice_data'], $cart_item['data'], $cart_item['quantity'], $cart_item ),
			];

			do_action( 'wc_product_options_after_cart_item_data_option', $item_data, $cart_item, $option_data, $wpo_options );
		}

		/**
		 * Filter the item data displayed in the cart and checkout.
		 *
		 * @param array $item_data The array of metadata attached to each cart item
		 * @param array $cart_item The cart item
		 */
		return apply_filters( 'wc_product_options_get_item_data', $item_data, $cart_item );
	}

	/**
	 * Add product options data to order item.
	 *
	 * @param WC_Order_Item_Product $item
	 * @param string                $cart_item_key
	 * @param array                 $cart_item
	 * @param WC_Order              $order
	 */
	public function add_order_item_data( $item, $cart_item_key, $cart_item, $order ): void {

		if ( ! isset( $cart_item['wpo_options'] ) ) {
			return;
		}

		$wpo_options = $cart_item['wpo_options'];
		$item->add_meta_data( '_wpo_options', $wpo_options );
		$files = [];

		do_action( 'wc_product_options_before_order_item_data', $item, $cart_item, $order, $wpo_options );

		foreach ( $cart_item['wpo_options'] as $option_data ) {
			if ( $option_data['type'] === 'file_upload' && ! empty( $option_data['value'] ) ) {
				$files = array_merge( $files, $option_data['value'] );
			}

			do_action( 'wc_product_options_before_order_item_data_option', $item, $cart_item, $order, $option_data, $wpo_options );

			$item->add_meta_data( $option_data['name'], $this->format_item_data( $option_data['choice_data'], $item->get_product(), $item->get_quantity(), $cart_item ) );

			do_action( 'wc_product_options_after_order_item_data_option', $item, $cart_item, $order, $option_data, $wpo_options );
		}

		do_action( 'wc_product_options_after_order_item_data', $item, $cart_item, $order, $wpo_options );

		if ( ! empty( $files ) ) {
			// remove from unlinked files option
			$unlinked_files = get_option( 'wpo_unlinked_files', [] );

			foreach ( $files as $file ) {
				if ( ( $key = array_search( $file, $unlinked_files ) ) !== false ) {
					unset( $unlinked_files[ $key ] );
				}
			}

			update_option( 'wpo_unlinked_files', $unlinked_files );

			// add to current files order option
			$current_files = $order->get_meta( '_wpo_files' );

			if ( ! empty( $current_files ) ) {
				$files = array_merge( $current_files, $files );
			}

			$order->update_meta_data( '_wpo_files', $files );
			$order->save();
		}
	}

	/**
	 * Format the item data for display in cart/checkout/order.
	 *
	 * @param array $choice_data
	 * @param WC_Product $product
	 * @param int $quantity
	 * @param array $cart_item
	 * @return string
	 */
	private function format_item_data( $choice_data, $product, $quantity, $cart_item ) {
		$formatted_strings = [];

		foreach ( $choice_data as $choice ) {
			if ( ! isset( $choice['pricing'] ) ) {
				$formatted_string = $choice['label'];
			} else {
				if ( isset( $cart_item['wholesale_pro']['is_wholesale_price'] ) && $cart_item['wholesale_pro']['is_wholesale_price'] === true ) {
					$product_price = $cart_item['wholesale_pro']['wholesale_price'];
				} else {
					$product_price = $product->is_on_sale() ? $product->get_sale_price() : $product->get_regular_price();
				}

				$formatted_price  = Price_Util::get_price_html( Price_Util::calculate_option_display_price( $choice['pricing'], $product, $quantity, 'cart', $product_price ) );
				$formatted_string = $choice['pricing']['amount'] === 0 ? $choice['label'] : sprintf( '%s <strong>%s</strong>', $choice['label'], $formatted_price );
			}

			$formatted_strings[] = $formatted_string;
		}

		/**
		 * Filter the formatted item data string.
		 *
		 * Used in the cart, checkout, orders, and emails. Default ' | ' separator.
		 *
		 * @param string $seperator
		 */
		$seperator = apply_filters( 'wc_product_options_multiple_cart_item_data_seperator', ' | ' );

		return implode( $seperator, $formatted_strings );
	}

	/**
	 * Add product options data to cart item when ordering again.
	 *
	 * @param array $cart_item_data
	 * @param WC_Order_Item_Product $item
	 * @param WC_Order $order
	 * @return array $cart_item_data
	 */
	public function order_again_cart_item_data( $cart_item_data, $item, $order ) {
		$options = $item->get_meta( '_wpo_options' );

		if ( empty( $options ) ) {
			return $cart_item_data;
		}

		/**
		 * Whether to add product options data to cart item when ordering again.
		 *
		 * Note that this filter is used for WC Subscriptions to determine whether to prevent recalculating the renewals.
		 *
		 * @param bool $enabled
		 * @param WC_Order_Item_Product $item
		 * @param WC_Order $order
		 */
		$is_add_order_again_item_data_enabled = apply_filters( 'wc_product_options_add_order_again_item_data', true, $item, $order );

		if ( ! $is_add_order_again_item_data_enabled ) {
			return $cart_item_data;
		}

		foreach ( $options as $option_data ) {
			try {
				$option = Option_Model::findOrFail( $option_data['option_id'] );
			} catch ( ModelNotFoundException $exception ) {
				continue;
			}

			$field_class  = Util::get_field_class( $option->type );
			$field_object = new $field_class( $option, $item->get_product() );

			$item_data = $field_object->get_cart_item_data( $option_data['value'], $item->get_product(), $item->get_quantity(), $options );

			if ( $item_data ) {
				$cart_item_data['wpo_options'][ $option->id ] = $item_data;
			}
		}

		return $cart_item_data;
	}
}
