<?php

namespace Barn2\Plugin\WC_Product_Options\Admin;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Service_Container;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Plugin\Admin\Admin_Links;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Util as Lib_Util;
use Barn2\Plugin\WC_Product_Options\Plugin;
use Barn2\Plugin\WC_Product_Options\Util\Price as Price_Util;
use Barn2\Plugin\WC_Product_Options\Util\Util;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Admin\Settings_Scripts;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Admin\Plugin_Promo;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;
use Barn2\Plugin\WC_Product_Options\Dependencies\WPTRT\AdminNotices\Notice;

/**
 * General Admin Functions
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Admin_Controller implements Registerable, Standard_Service {

	use Service_Container;

	private $plugin;
	private $license_setting;

	/**
	 * Constructor.
	 *
	 * @param Plugin $plugin
	 */
	public function __construct( Plugin $plugin ) {
		$this->plugin          = $plugin;
		$this->license_setting = $plugin->get_license_setting();

		$this->add_services();
	}

	/**
	 * Get the admin services.
	 *
	 * @return void
	 */
	public function add_services() {
		$this->add_service( 'admin_links', new Admin_Links( $this->plugin ) );
		$this->add_service( 'settings_page', new Settings_Page( $this->plugin ) );
		$this->add_service( 'version_updater', new Version_Updater( $this->plugin ) );
		$this->add_service( 'attribute_term', new Attribute_Term( $this->plugin ) );
	}

	/**
	 * {@inheritdoc}
	 */
	public function register(): void {
		$this->register_services();

		// Load admin scripts.
		add_action( 'admin_enqueue_scripts', [ $this, 'register_assets' ], 5 );

		$settings_scripts = new Settings_Scripts( $this->plugin );
		$settings_scripts->register();

		if ( filter_input( INPUT_GET, 'tab' ) === 'general' ) {
			$plugin_promo = new Plugin_Promo( $this->plugin );
			$plugin_promo->register();
		}

		$this->start_all_services();

		add_action( 'wp_ajax_wpo_install_wlp', [ $this, 'ajax_install_wlp' ] );
		add_action( 'barn2_license_after_activate_' . $this->plugin->get_id(), [ $this, 'install_wlp' ], 10, 3 );
	}

	/**
	 * AJAX handler to install the WooCommerce Live Preview plugin.
	 */
	public function ajax_install_wlp(): void {
		// Check the nonce
		if ( ! check_ajax_referer( 'wpo_install_wlp', 'nonce', false ) ) {
			$error_notice = $this->get_notice(
				'wpo_install_wlp_authorization_error',
				__( 'Security error', 'woocommerce-product-options' ),
				__( 'The authorization to perform this action expired. Please reload the page and try again', 'woocommerce-product-options' ),
				[
					'type'    => 'error',
					'screens' => [],
				]
			);

			wp_send_json_error(
				[
					'notice' => $error_notice,
					'type'   => 'error',
				]
			);
		}

		$result = $this->install_wlp();

		if ( $result['type'] === 'success' ) {
			wp_send_json_success( $result );
		} else {
			wp_send_json_error( $result );
		}
	}

	/**
	 * Install the WooCommerce Live Preview plugin.
	 *
	 * @return array
	 */
	public function install_wlp( $license_key = null, $home_url = null, $license_data = null ): array {
		$child_item_id = 657851;
		// Check the user has permission
		if ( ! current_user_can( 'install_plugins' ) ) {
			$error_notice = $this->get_notice(
				'wpo_install_wlp_permission_error',
				__( 'Permission error', 'woocommerce-product-options' ),
				__( 'You do not have permission to install plugins.', 'woocommerce-product-options' ),
				[
					'type'    => 'error',
					'screens' => [],
				]
			);

			return [
				'notice' => $error_notice,
				'type'   => 'error',
			];
		}

		if ( Util::is_live_preview_installed() ) {
			$success_notice = $this->get_notice(
				'wpo_install_wlp_already_installed',
				__( 'Already installed', 'woocommerce-product-options' ),
				__( 'The WooCommerce Live Preview plugin is already installed.', 'woocommerce-product-options' ),
				[
					'type'    => 'success',
					'screens' => [],
				]
			);

			return [
				'notice' => $success_notice,
				'type'   => 'success',
			];
		}

		if ( is_null( $license_data ) ) {
			// refresh the license to get the latest bonus downloads
			$this->plugin->get_license()->refresh();
			$bonus_downloads = $this->plugin->get_license()->get_bonus_downloads();
		} else {
			$bonus_downloads = $license_data['bonus_downloads'];
		}

		$bonus_downloads = array_filter(
			$bonus_downloads ?? [],
			function ( $download ) use ( $child_item_id ) {
				return intval( $download->id ) === $child_item_id;
			}
		);

		if ( empty( $bonus_downloads ) ) {
			$error_notice = $this->get_notice(
				'wpo_install_wlp_license_error',
				__( 'License error', 'woocommerce-product-options' ),
				__( 'Your license doesn\'t include WooCommerce Live Preview. Please go to the settings page and check your license. Then try again.', 'woocommerce-product-options' ),
				[
					'type'    => 'error',
					'screens' => [],
				]
			);

			return [
				'notice' => $error_notice,
				'type'   => 'error',
			];
		}

		$results = Lib_Util::install_bonus_plugins( $bonus_downloads );

		if ( $results['WooCommerce Live Preview'] === true ) {
			$success_notice = $this->get_notice(
				'wpo_wlp_installation_success',
				__( 'Successfully installed', 'woocommerce-product-options' ),
				sprintf(
					// translators: %s is the link to the product options page
					__( 'The WooCommerce Live Preview plugin has been successfully installed. Now go to %s and enable live preview for each option that you wish to use it for.', 'woocommerce-product-options' ),
					'<a href="' . admin_url( 'edit.php?post_type=product&page=wpo_options' ) . '">' . __( 'Product Options', 'woocommerce-product-options' ) . '</a>'
				),
				[
					'type'    => 'success',
					'screens' => [],
				]
			);

			return [
				'notice' => $success_notice,
				'type'   => 'success',
			];
		} else {
			$error_notice = $this->get_notice(
				'wpo_wlp_install_error',
				__( 'Installation error', 'woocommerce-product-options' ),
				sprintf(
					// translators: %s is the error message
					sprintf(
						// translators: %s is the link to the downloads page
						__( 'An error occurred while installing or activating WooCommerce Live Preview (Error code: %1$s).<br>Please reload the page and try again. If the error persists, please go to your %2$s and try to manually install the plugin.', 'woocommerce-product-options' ),
						$results['Live Preview']->get_error_code(),
						sprintf( '<a href="https://barn2.com/account/#downloads">%s</a>', __( 'Barn2 downloads page', 'woocommerce-product-options' ) )
					)
				),
				[
					'type'    => 'error',
					'screens' => [],
				]
			);

			return [
				'notice' => $error_notice,
				'type'   => 'error',
			];
		}
	}

	/**
	 * Create a notice to return to the AJAX request.
	 *
	 * @param string $id      The ID of the notice.
	 * @param string $title   The title of the notice.
	 * @param string $message The message of the notice.
	 * @param array $options  An array of options for the notice.
	 *
	 * @return string
	 */
	private function get_notice( $id, $title, $message, $options ): string {
		$notice = new Notice(
			$id,
			$title,
			$message,
			$options
		);

		ob_start();
		$notice->the_notice();

		return ob_get_clean();
	}

	/**
	 * Load admin assets.
	 *
	 * @param string $hook
	 */
	public function register_assets( string $hook ): void {
		$this->plugin->register_script(
			'wpo-admin',
			'assets/js/admin/wpo-dashboard.js',
			Lib_Util::get_script_dependencies( $this->plugin, 'admin/wpo-dashboard.js' )['dependencies'],
			$this->plugin->get_version(),
			true
		);

		Util::add_inline_script_params(
			'wpo-admin',
			'wpoAdmin',
			/**
			 * Filters the parameters for the script of the admin page.
			 *
			 * @param array $params The array of parameters.
			 */
			apply_filters(
				'wc_product_options_settings_app_params',
				[
					'version' => $this->plugin->get_version(),
					'nonce'   => wp_create_nonce( 'wpo_install_wlp' ),
				]
			)
		);

		wp_enqueue_script( 'wpo-admin' );

		$page = filter_input( INPUT_GET, 'page' );

		if ( $page === 'wc-orders' ) {
			wp_enqueue_style(
				'wpo-orders',
				plugins_url( 'assets/css/admin/wpo-orders.css', $this->plugin->get_file() ),
				[],
				$this->plugin->get_version()
			);	
		}

		if ( $page !== 'wpo_options' ) {
			return;
		}

		$tab = filter_input( INPUT_GET, 'tab' );

		if ( $tab === 'import_export' ) {
			$this->plugin->register_script(
				'wpo-import-export',
				'assets/js/admin/wpo-import-export.js',
				array_merge(
					[ 'barn2-tiptip' ],
					Lib_Util::get_script_dependencies( $this->plugin, 'admin/wpo-import-export.js' )['dependencies']
				),
				$this->plugin->get_version(),
				true
			);

			wp_register_style(
				'wpo-import-export',
				plugins_url( 'assets/css/admin/wpo-import-export.css', $this->plugin->get_file() ),
				[ 'wp-components', 'wc-components' ],
				$this->plugin->get_version()
			);

			Util::add_inline_script_params(
				'wpo-import-export',
				'wpoExportSettings',
				/**
				 * Filters the parameters for the script of the admin page.
				 *
				 * @param array $params The array of parameters.
				 */
				apply_filters(
					'wc_product_options_settings_app_params',
					[
						'version' => $this->plugin->get_version(),
					]
				)
			);

		} else {
			$this->plugin->register_script(
				'wpo-settings-page',
				'assets/js/admin/wpo-settings-page.js',
				array_merge(
					[ 'barn2-tiptip', 'select2' ],
					Lib_Util::get_script_dependencies( $this->plugin, 'admin/wpo-settings-page.js' )['dependencies']
				),
				$this->plugin->get_version(),
				true
			);

			// register select2 style from WooCommerce
			wp_register_style(
				'select2',
				WC()->plugin_url() . '/assets/css/select2.css',
				[],
				WC_VERSION
			);

			wp_register_style(
				'wpo-settings-page',
				plugins_url( 'assets/css/admin/wpo-settings-page.css', $this->plugin->get_file() ),
				[ 'wp-components', 'wc-components', 'select2' ],
				$this->plugin->get_version()
			);

			Util::add_inline_script_params(
				'wpo-settings-page',
				'wpoSettings',
				/**
				 * Filters the parameters for the script of the admin page.
				 *
				 * @param array $params The array of parameters.
				 */
				apply_filters(
					'wc_product_options_settings_app_params',
					[
						'currency'      => Price_Util::get_currency_data(),
						'fileTypes'     => get_allowed_mime_types(),
						'start_of_week' => intval( get_option( 'start_of_week', 0 ) ),
					]
				)
			);

			Util::add_inline_script_params(
				'wpo-settings-page',
				'wpoExternalConditions',
				/**
				 * Filters the parameters for the script of the admin page.
				 *
				 * @param array $params The array of parameters.
				 */
				apply_filters(
					'wc_product_options_external_conditions',
					[
						'productAttributes'   => [
							'label'   => __( 'Product Attributes', 'woocommerce-product-options' ),
							'options' => Util::get_attribute_taxonomies(),
						],
						'inventoryProperties' => [
							'label'   => __( 'Invetory properties', 'woocommerce-product-options' ),
							'options' => Util::get_inventory_properties(),
						],
						'shippingProperties'  => [
							'label'   => __( 'Shipping properties', 'woocommerce-product-options' ),
							'options' => Util::get_shipping_properties(),
						],
					]
				)
			);

			wp_add_inline_script(
				'wpo-settings-page',
				/**
				 * Filters the custom Javascript functions.
				 *
				 * @param string $js_functions The string with the custom Javascript functions object definition.
				 */
				'var wpoCustomFunctions = ' . apply_filters( 'wc_product_options_formula_custom_js_functions', '{}' ) . ';',
				'before'
			);
		}
	}
}
