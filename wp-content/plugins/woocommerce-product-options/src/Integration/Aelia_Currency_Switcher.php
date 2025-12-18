<?php
namespace Barn2\Plugin\WC_Product_Options\Integration;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;

/**
 * Handles integration with Aelia CS
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Aelia_Currency_Switcher implements Registerable, Standard_Service {

	/**
	 * {@inheritdoc}
	 */
	public function register() {
		add_filter( 'wc_product_options_cart_price', [ $this, 'convert_cart_price' ], 10, 3 );
		add_filter( 'wc_product_options_choice_label_price', [ $this, 'convert_price' ], 10, 1 );
	}

	/**
	 * Convert price for Aelia.
	 *
	 * @param string|float $price
	 * @param WC_Product $product
	 * @param array $price_data
	 * @return string|float
	 */
	public function convert_cart_price( $price, $product, $price_data ) {
		if ( ! in_array( $price_data['type'], [ 'percentage_inc', 'percentage_dec' ], true ) ) {
			return apply_filters( 'wc_aelia_cs_convert', $price, get_option( 'woocommerce_currency' ), get_woocommerce_currency() );
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
		return apply_filters( 'wc_aelia_cs_convert', $price, get_option( 'woocommerce_currency' ), get_woocommerce_currency() );
	}
}
