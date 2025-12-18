<?php

namespace Barn2\Plugin\WC_Product_Options\Integration;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;
use WC_Shortcode_Cart;

/**
 * Handles the integration with all the uspported themes.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Theme_Compat implements Standard_Service, Registerable {
	public function register() {
		add_filter( 'et_pb_module_content', [ $this, 'set_cart_for_divi_modules' ], 10, 4 );
	}

	/**
	 * Set the cart environment for DIVI modules.
	 *
	 * The DIVI Cart modules do not set the cart environment, actions and filters correctly
	 * so we need to do it manually before the cart output is generated.
	 *
	 * @param  mixed $content
	 * @param  mixed $props
	 * @param  mixed $attrs
	 * @param  mixed $render_slug
	 * @return void
	 */
	public function set_cart_for_divi_modules( $content, $props, $attrs, $render_slug ) {
		if ( in_array( $render_slug, [ 'et_pb_wc_cart_products' ], true ) ) {
			ob_start();
			WC_Shortcode_Cart::output( [] );
			ob_clean();
		}

		return $content;
	}
}
