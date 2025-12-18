<?php
namespace Barn2\Plugin\WC_Product_Options\Integration;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;

/**
 * Handles integration with WooCommerce Multilingual
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class WooCommerce_Multilingual implements Registerable, Standard_Service {

	/**
	 * {@inheritdoc}
	 */
	public function register() {
		add_filter( 'wc_product_options_cart_price', [ $this, 'convert_cart_price' ], 10, 3 );
		add_filter( 'wc_product_options_choice_label_price', [ $this, 'convert_price' ], 10, 1 );
		// add_filter( 'wc_product_options_group_categories', [ $this, 'translate_group_categories' ] );
	}

	/**
	 * Convert cart price.
	 *
	 * @param string|float $price
	 * @param WC_Product $product
	 * @param array $price_data
	 * @return string|float
	 */
	public function convert_cart_price( $price, $product, $price_data ) {
		if ( empty( $price ) ) {
			return $price;
		}

		if ( ! in_array( $price_data['type'], [ 'percentage_inc', 'percentage_dec' ], true ) ) {
			return apply_filters( 'wcml_raw_price_amount', $price );
		}

		return $price;
	}

	/**
	 * Convert price.
	 *
	 * @param string|float $price
	 * @return string|float
	 */
	public function convert_price( $price ) {
		if ( empty( $price ) ) {
			return $price;
		}

		return apply_filters( 'wcml_raw_price_amount', $price );
	}

	// public function translate_group_categories( $term_ids ) {
	// 	global $woocommerce_wpml, $wpml_term_translations, $sitepress;
	// 	$wmpl_response_handler = new ProductTerms( $sitepress, $wpml_term_translations, $woocommerce_wpml->terms );

	// 	$new_term_ids = $term_ids;

	// 	foreach ( $term_ids as $term_id ) {
	// 		$translations = new \stdClass();
	// 		$term         = get_term( $term_id );

	// 		$wmpl_response_handler->prepare( $translations, $term, null );

	// 		if ( isset( $translations->data['translations'] ) ) {
	// 			$new_term_ids = array_merge( $new_term_ids, array_values( $translations->data['translations'] ) );
	// 		}
	// 	}

	// 	$term_ids = array_intersect( $new_term_ids, $term_ids );

	// 	return $term_ids;
	// }
}
