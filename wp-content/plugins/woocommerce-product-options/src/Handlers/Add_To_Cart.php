<?php

namespace Barn2\Plugin\WC_Product_Options\Handlers;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;
use Barn2\Plugin\WC_Product_Options\Util\Util;
use Barn2\Plugin\WC_Product_Options\Util\Cart as Cart_Util;
use Barn2\Plugin\WC_Product_Options\Model\Group as Group_Model;
use WC_Product;

/**
 * Add to Cart Handler
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Add_To_Cart implements Registerable, Standard_Service {

	/**
	 * {@inheritdoc}
	 */
	public function register(): void {
		add_filter( 'woocommerce_add_to_cart_validation', [ $this, 'handle_validation' ], 10, 5 );

		add_filter( 'woocommerce_product_add_to_cart_url', [ $this, 'loop_add_to_cart_url' ], 20, 2 );
		add_filter( 'woocommerce_product_add_to_cart_text', [ $this, 'loop_add_to_cart_text' ], 20, 2 );
		add_filter( 'woocommerce_product_add_to_cart_aria_describedby', [ $this, 'loop_add_to_cart_text' ], 20, 2 );
		add_filter( 'woocommerce_product_add_to_cart_description', [ $this, 'loop_add_to_cart_text' ], 20, 2 );
		add_filter( 'woocommerce_product_supports', [ $this, 'loop_ajax_add_to_cart_support' ], 20, 3 );

		add_filter( 'wc_add_to_cart_message_html', [ $this, 'add_to_cart_message_html' ], 10, 3 );
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
	public function handle_validation( $passed, $product_id, $quantity, $variation_id = null, $variation = null ): bool {
		return Cart_Util::handle_validation( $passed, $product_id, $quantity, $variation_id, $variation );
	}

	/**
	 * Add to cart URL.
	 *
	 * @param string $url URL.
	 * @param WC_Product $product Product.
	 * @return string
	 */
	public function loop_add_to_cart_url( string $url, WC_Product $product ): string {
		if ( ! Util::is_allowed_product_type( $product->get_type() ) ) {
			return $url;
		}

		$groups = Group_Model::get_groups_by_product( $product );

		if ( empty( $groups ) ) {
			return $url;
		}

		$product_id = $product->is_type( 'variation' ) ? $product->get_parent_id() : $product->get_id();

		return get_permalink( $product_id );
	}

	/**
	 * Add to cart text.
	 *
	 * @param string $text Text.
	 * @param WC_Product $product Product.
	 * @return string
	 */
	public function loop_add_to_cart_text( string $text, WC_Product $product ): string {
		if ( ! Util::is_allowed_product_type( $product->get_type() ) || ! $product->is_purchasable() ) {
			return $text;
		}

		$groups = Group_Model::get_groups_by_product( $product );

		if ( empty( $groups ) ) {
			return $text;
		}

		switch ( true ) {
			case doing_filter( 'woocommerce_product_add_to_cart_text' ):
				return esc_html__( 'Select options', 'woocommerce-product-options' );
			case doing_filter( 'woocommerce_product_add_to_cart_aria_describedby' ):
				return __( 'This product has options that may be chosen on the product page', 'woocommerce-product-options' );
			case doing_filter( 'woocommerce_product_add_to_cart_description' ):
				// translators: %s: product name
				return sprintf( __( 'Select options for &ldquo;%s&rdquo;', 'woocommerce' ), $product->get_name() );
		}

		return esc_html__( 'Select options', 'woocommerce-product-options' );
	}

	/**
	 * Remove AJAX add to cart support if the product has options.
	 *
	 * @param bool $supported
	 * @param string $feature
	 * @param WC_Product $product
	 * @return bool
	 */
	public function loop_ajax_add_to_cart_support( bool $supported, string $feature, WC_Product $product ): bool {
		if ( 'ajax_add_to_cart' !== $feature ) {
			return $supported;
		}

		if ( $supported === false ) {
			return $supported;
		}

		$groups = Group_Model::get_groups_by_product( $product );

		if ( ! empty( $groups ) ) {
			$supported = false;
		}

		return $supported;
	}

	/**
	 * Filter the add to cart message to include the additional products from all the Products option type fields.
	 *
	 * @param  string $message
	 * @param  array $products
	 * @param  bool $show_qty
	 * @return string
	 */
	public function add_to_cart_message_html( $message, $products, $show_qty ) {
		$new_message = '';

		foreach ( $products as $product_id => $qty ) {
			$addon_list = [];

			if ( isset( $_POST['cart_data'] ) && isset( $_POST['cart_data'][ 'p' . $product_id ] ) ) {
				$product_type_options = $_POST['cart_data'][ 'p' . $product_id ]['wpo-option'] ?? [];
				$list_template        = '<br><span>%s</span><br><br>';
				$list_separator       = ',<br></span><span>';
			} else {
				$product_type_options = $_POST['wpo-option'] ?? [];
				$list_template        = '<ul><li>%s</li></ul>';
				$list_separator       = '</li><li>';
			}

			$product_type_options = array_filter(
				$product_type_options,
				function ( $option ) {
					return isset( $option['product_ids'] );
				}
			);

			foreach ( $product_type_options as $value ) {
				if ( is_string( $value['product_ids'] ) ) {
					// the data comes from a dropdown, so we need to explode it
					// to get the product and, possibly, variation IDs
					$new_product       = explode( ',', $value['product_ids'] );
					$value['product_ids'] = [
						$new_product[0] => [ $new_product[1] ?? 0 ],
					];
				}

				foreach ( $value['product_ids'] as $addon_product_id => $variations ) {
					$addon_product = wc_get_product( $addon_product_id );

					if ( is_string( $variations ) ) {
						$variations = explode( ',', $variations );
					}

					if ( ! empty( $variations ) ) {
						foreach ( $variations as $addon_variation_id ) {
							$addon_variation = wc_get_product( $addon_variation_id );

							if ( ! $addon_variation && ! $addon_product ) {
								continue;
							}

							if ( ! $addon_product ) {
								$addon_product_id = $addon_variation->get_parent_id();
								$addon_product    = wc_get_product( $addon_product_id );
							}

							$addon = $addon_variation ?: $addon_product;

							$addon_list[] = $addon->get_name();
						}
					} else {
						if ( ! $addon_product ) {
							continue;
						}

						$addon_list[] = $addon_product->get_name();
					}
				}
			}

			if ( ! empty( $addon_list ) ) {
				$addon_list = array_count_values( $addon_list );
				$addon_list = array_map(
					function ( $count, $name ) {
						return sprintf( __( '%1$s &times; %2$s', 'woocommerce-product-options' ), $count, $name );
					},
					$addon_list,
					array_keys( $addon_list )
				);

				$addon_list = empty( $addon_list )
					? ''
					: sprintf( $list_template, implode( $list_separator, $addon_list ) );
			}

			if ( ! empty( $addon_list ) ) {
				$product_title = apply_filters( 'woocommerce_add_to_cart_qty_html', ( $qty > 1 ? absint( $qty ) . ' &times; ' : '' ), $product_id ) . apply_filters( 'woocommerce_add_to_cart_item_name_in_quotes', sprintf( _x( '&ldquo;%s&rdquo;', 'Item name in quotes', 'woocommerce-product-options' ), wp_strip_all_tags( get_the_title( $product_id ) ) ), $product_id );

				$new_message .= sprintf(
					// translators: %1$s: link to the shop/cart, %2$s: product title, %3$s: list of additional products
					__( '%1$s has been added to your cart, together with the following additional products: %2$s', 'woocommerce-product-options' ),
					$product_title,
					$addon_list
				);
			}
		}

		if ( $new_message ) {
			// get the link in the cart message...
			$message_link = preg_replace( '/<\\/a>(.*)$/', '</a>', $message );

			// ...and add it back with the products from the Products option type
			$message = sprintf( '%1$s%2$s', $message_link, $new_message );
		}

		return $message;
	}
}
