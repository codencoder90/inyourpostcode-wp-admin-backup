<?php
namespace Barn2\Plugin\WC_Product_Options\Integration;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;

/**
 * Handles integration with WooCommerce Subscriptions.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class WooCommerce_Subscriptions implements Registerable, Standard_Service {

	/**
	 * {@inheritdoc}
	 */
	public function register() {

		if ( ! class_exists( 'WC_Subscriptions_Product' ) ) {
			return;
		}

		add_filter( 'wc_product_options_add_order_again_item_data', [ $this, 'disable_order_again_recalculation' ], 10, 3 );
	}

	/**
	 * Disable order again recalculation for WC Subscription renewals.
	 *
	 * @param bool $enabled
	 * @param WC_Order_Item_Product $item
	 * @param WC_Order $order
	 * @return bool
	 */
	public function disable_order_again_recalculation( $enabled, $item, $order ): bool {
		if ( $order->has_status( 'completed' ) ) {
			return $enabled;
		}

		if ( \WC_Subscriptions_Product::is_subscription( $item->get_product() ) ) {
			return false;
		}

		return $enabled;
	}

}
