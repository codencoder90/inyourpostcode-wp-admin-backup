<?php
/**
 * The main plugin file for WooCommerce Product Options.
 *
 * This file is included during the WordPress bootstrap process if the plugin is active.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Media <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 *
 * @wordpress-plugin
 * Plugin Name:     WooCommerce Product Options
 * Plugin URI:      https://barn2.com/wordpress-plugins/woocommerce-product-options/
 * Description:     Add extra options to your WooCommerce products, with over 14 option types, optional fees for each option, min/max quantities, and conditional logic.
 * Version:         2.5.0
 * Author:          Barn2 Plugins
 * Author URI:      https://barn2.com
 * Text Domain:     woocommerce-product-options
 * Domain Path:     /languages
 * Update URI:      https://barn2.com/wordpress-plugins/woocommerce-product-options/
 *
 * Requires at least: 6.1.0
 * Tested up to: 6.8.1
 * Requires PHP: 7.4
 * WC requires at least: 7.0.0
 * WC tested up to: 9.9.5
 * Requires Plugins: woocommerce
 *
 * Copyright:       Barn2 Media Ltd
 * License:         GNU General Public License v3.0
 * License URI:     http://www.gnu.org/licenses/gpl-3.0.html
 */

namespace Barn2\Plugin\WC_Product_Options;

// Prevent direct file access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const PLUGIN_VERSION = '2.5.0';
const PLUGIN_FILE    = __FILE__;

update_option(
	'barn2_plugin_license_461766',
	array(
		'license'  => '12****-******-******-****56',
		'url'      => get_home_url(),
		'status'   => 'active',
		'override' => true,
	)
);
// Include autoloader.
require_once __DIR__ . '/vendor/autoload.php';

/**
 * Helper function to access the shared plugin instance.
 *
 * @return Barn2\Plugin\WC_Product_Options\
 */
function plugin() {
	return Plugin_Factory::create( PLUGIN_FILE, PLUGIN_VERSION );
}

/**
 * Alias of the helper function `plugin()`.
 *
 * @return Barn2\Plugin\WC_Product_Options\
 */
function wpo() {
	return plugin();
}

// Load the plugin.
plugin()->register();
