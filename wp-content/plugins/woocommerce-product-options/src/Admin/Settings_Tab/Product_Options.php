<?php


namespace Barn2\Plugin\WC_Product_Options\Admin\Settings_Tab;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Plugin\Licensed_Plugin;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;

/**
 * The Product_Options settings tab.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Product_Options implements Registerable, Standard_Service {

	const TAB_ID    = 'product_options';
	const MENU_SLUG = 'wpo_options';

	private $title;
	private $plugin;

	/**
	 * Get things started.
	 *
	 * @param Licensed_Plugin $plugin
	 */
	public function __construct( Licensed_Plugin $plugin ) {
		$this->plugin = $plugin;
	}

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function register() {
		$this->title = __( 'Product Options', 'woocommerce-product-options' );
	}

	/**
	 * Register the settings.
	 */
	public function output() {
		print( '<div id="barn2-wpo-settings-root"></div>' );
	}

	/**
	 * Get the tab title.
	 *
	 * @return string
	 */
	public function get_title() {
		return $this->title;
	}

}
