<?php
namespace Barn2\Plugin\WC_Product_Options\Integration;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Util as Lib_Util;

/**
 * Handles the WooCommerce Quick View Pro integration.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Quick_View_Pro implements Registerable, Standard_Service {

	/**
	 * {@inheritdoc}
	 */
	public function register() {
		if ( ! Lib_Util::is_barn2_plugin_active( '\Barn2\Plugin\WC_Quick_View_Pro\wqv' ) ) {
			return;
		}

		add_action( 'wc_quick_view_pro_load_scripts', [ $this, 'load_scripts' ] );
	}

	/**
	 * Load frontend scripts.
	 */
	public function load_scripts() {
		wp_enqueue_script( 'wpo-quick-view' );
		wp_enqueue_style( 'wpo-frontend-fields' );
	}

}
