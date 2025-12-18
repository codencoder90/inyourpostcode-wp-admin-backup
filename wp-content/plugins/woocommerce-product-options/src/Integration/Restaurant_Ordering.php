<?php

namespace Barn2\Plugin\WC_Product_Options\Integration;

use Barn2\Plugin\WC_Restaurant_Ordering\Menu\Menu_Options;
use Barn2\Plugin\WC_Product_Options\Model\Group as Group_Model;
use Barn2\Plugin\WC_Product_Options\Util\Util;
use Barn2\Plugin\WC_Product_Options\Util\Display as Display_Util;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Util as Lib_Util;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;
use WC_Product;

/**
 * Handles the WooCommerce Restaurant Ordering integration.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Restaurant_Ordering implements Standard_Service, Registerable {

	/**
	 * Register the integrations points for WRO.
	 */
	public function register() {
		if ( ! Lib_Util::is_barn2_plugin_active( '\Barn2\Plugin\WC_Restaurant_Ordering\wro' ) ) {
			return;
		}

		add_action( 'wc_restaurant_ordering_load_scripts', [ $this, 'load_scripts' ] );
		add_filter( 'wc_restaurant_ordering_product_order_type', [ $this, 'set_order_type' ], 10, 2 );
		add_filter( 'wc_restaurant_ordering_product_order_type_checked', [ $this, 'set_checked_order_type' ], 10, 2 );
		add_filter( 'wc_restaurant_ordering_modal_data', [ $this, 'add_modal_data' ], 10, 2 );
	}

	/**
	 * Load the scripts required for WPO
	 */
	public function load_scripts() {
		wp_enqueue_script( 'wpo-restaurant-order' );
		wp_enqueue_style( 'wpo-frontend-fields' );
	}

	/**
	 * If using WooCommerce Product Options we don't know at this stage whether there are options for the product, so we return 'check'.
	 * If this product is ordered, we then perform the full check on the product and either add the product (if there are no addons) or show the
	 * modal if there are.
	 *
	 * @param string $order_type    The order type before this filter ran
	 * @param WC_Product $product   The product
	 * @return string The order type - OT_QUICK, OT_LIGHTBOX, or OT_CHECK
	 */
	public function set_order_type( $order_type, WC_Product $product ) {
		if ( Menu_Options::OT_QUICK === $order_type ) {
			// Set to 'check' option if WPO is active - the product may or may not have addons.
			$order_type = Menu_Options::OT_CHECK;
		}

		return $order_type;
	}

	/**
	 * Sets the order type during the REST request, if 'OT_CHECK' was used for the product.
	 *
	 * @param string $order_type  The order type before this filter ran
	 * @param WC_Product $product The product
	 * @return string The order type - OT_QUICK or OT_LIGHTBOX
	 */
	public function set_checked_order_type( $order_type, WC_Product $product ) {
		if ( Menu_Options::OT_QUICK !== $order_type ) {
			return $order_type;
		}

		$groups = Group_Model::get_groups_by_product( $product );

		if ( empty( $groups ) ) {
			return $order_type;
		}

		// Products with options should always open in the lightbox.
		$order_type = Menu_Options::OT_LIGHTBOX;

		return $order_type;
	}

	/**
	 * Add the HTML for the options to the lightbox.
	 *
	 * @param array $data         The modal data before this filter ran
	 * @param WC_Product $product The product
	 * @return array The updated modal data
	 */
	public function add_modal_data( $data, WC_Product $product ) {
		if ( ! Util::is_allowed_product_type( $product->get_type() ) ) {
			return $data;
		}

		$groups = Group_Model::get_groups_by_product( $product );

		if ( empty( $groups ) ) {
			return $data;
		}

		$data['options'] .= Display_Util::get_groups_html( $groups, $product );
		$data['options'] .= Display_Util::get_totals_container_html( $product );

		return $data;
	}

}
