<?php

namespace Barn2\Plugin\WC_Product_Options\Admin\Wizard\Steps;

use Barn2\Plugin\WC_Product_Options\Dependencies\Setup_Wizard\Steps\Welcome;

/**
 * Welcome / License Step.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class License_Verification extends Welcome {
	/**
	 * {@inheritdoc}
	 */
	public function init() {
		parent::init();
		$this->set_name( esc_html__( 'Welcome', 'woocommerce-product-options' ) );
		$this->set_title( esc_html__( 'Welcome to WooCommerce Product Options.', 'woocommerce-product-options' ) );
		$this->set_description( esc_html__( 'Use this setup wizard to activate your license key and choose any complementary plugins. After that, you’ll be ready to start creating product options!', 'woocommerce-product-options' ) );
	}
}
