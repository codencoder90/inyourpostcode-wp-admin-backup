<?php
/**
 * Plugin Name: Registration Form For WooCommerce
 * Description: Drag and drop WooCommerce registration form builder.
 * Version: 1.0.9
 * Requires at least: 5.5
 * Requires PHP: 7.4
 * Author: ThemeGrill
 * Author URI: https://themegrill.com/
 * Text Domain: registration-form-for-woocommerce
 * Domain Path: /languages/
 * License: GNU General Public License v3.0
 * License URI: http://www.gnu.org/licenses/gpl-3.0.html
 *
 * WC requires at least: 4.0.0
 * WC tested up to: 9.8.5
 *
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

use ThemeGrill\WooCommerceRegistrationFormBuilder\WooCommerceRegistrationFormBuilder;

/**
 * Deactivate free plugin if pro is installed.
 *
 * @since 1.0.3
 */
if ( in_array( 'custom-registration-form-fields-builder-for-woocommerce/custom-registration-form-fields-builder-for-woocommerce.php', get_option( 'active_plugins', array() ), true ) ) {
	add_action(
		'admin_init',
		function() {
			deactivate_plugins( 'registration-form-for-woocommerce/registration-form-for-woocommerce.php' );

			if ( isset( $_GET['activate'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended
				unset( $_GET['activate'] );
			}
		},
		0
	);

	return;
}

! defined( 'TGWCFB_VERSION' ) && define( 'TGWCFB_VERSION', '1.0.9' );
! defined( 'TGWCFB_PLUGIN_FILE' ) && define( 'TGWCFB_PLUGIN_FILE', __FILE__ );
! defined( 'TGWCFB_PLUGIN_DIR' ) && define( 'TGWCFB_PLUGIN_DIR', __DIR__ );
! defined( 'TGWCFB_PLUGIN_DIR_URL' ) && define( 'TGWCFB_PLUGIN_DIR_URL', plugin_dir_url( __FILE__ ) );
! defined( 'TGWCFB_ASSETS_DIR' ) && define( 'TGWCFB_ASSETS_DIR', TGWCFB_PLUGIN_DIR . '/assets' );
! defined( 'TGWCFB_ASSETS_DIR_URL' ) && define( 'TGWCFB_ASSETS_DIR_URL', TGWCFB_PLUGIN_DIR_URL . 'assets' );
! defined( 'TGWCFB_LANGUAGES' ) && define( 'TGWCFB_LANGUAGES', TGWCFB_PLUGIN_DIR . '/languages' );
! defined( 'TGWCFB_TEMPLATES' ) && define( 'TGWCFB_TEMPLATES', TGWCFB_PLUGIN_DIR . '/includes/templates/' );

// Load the autoloader.
require_once __DIR__ . '/vendor/autoload.php';

if ( ! function_exists( 'TGWCFB' ) ) {

	/**
	 * Main instance of WooCommerceRegistrationFormBuilder.
	 *
	 * @since 1.0.0
	 * @return WooCommerceRegistrationFormBuilder|null
	 */
	function TGWCFB() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid
		return WooCommerceRegistrationFormBuilder::instance();
	}

	TGWCFB();

}
