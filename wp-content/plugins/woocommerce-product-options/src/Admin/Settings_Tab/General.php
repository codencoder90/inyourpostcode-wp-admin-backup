<?php


namespace Barn2\Plugin\WC_Product_Options\Admin\Settings_Tab;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Plugin\Licensed_Plugin;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;

/**
 * The General settings tab.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class General implements Registerable {

	const TAB_ID       = 'general';
	const OPTION_GROUP = 'wc_product_options_settings';
	const MENU_SLUG    = 'wpo_options';

	private $license_setting;
	private $title;
	private $plugin;

	/**
	 * Get things started.
	 *
	 * @param Licensed_Plugin $plugin
	 */
	public function __construct( Licensed_Plugin $plugin ) {
		$this->plugin          = $plugin;
		$this->license_setting = $plugin->get_license_setting();
	}

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function register() {
		$this->title = __( 'Settings', 'woocommerce-product-options' );

		$active_page = filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		$active_tab  = filter_input( INPUT_GET, 'tab', FILTER_SANITIZE_FULL_SPECIAL_CHARS );

		if ( self::MENU_SLUG !== $active_page || self::TAB_ID !== $active_tab ) {
			return;
		}

		add_action( 'admin_init', [ $this, 'update_fields' ], 20 );
		add_filter( 'wc_product_options_general_settings', [ $this, 'add_uninstall_section' ], PHP_INT_MAX );
	}

	/**
	 * Register the settings.
	 */
	public function get_settings() {
		$settings = [
			[
				'title' => __( 'General', 'woocommerce-product-options' ),
				'type'  => 'title',
				'id'    => 'my_plugin_settings_section',
				'desc'  => __( 'The following options control the WooCommerce Product Options extension.', 'woocommerce-product-options' ),
			],
			$this->license_setting->get_license_key_setting(),
			$this->license_setting->get_license_override_setting(),
			[
				'type' => 'sectionend',
				'id'   => 'my_plugin_settings_section',
			],
		];

		return apply_filters( 'wc_product_options_general_settings', $settings );
	}

	/**
	 * Render the settings page.
	 *
	 * @return void
	 */
	public function output() {
		settings_errors();
		?>
		<form action="" method="post">
			<?php
			woocommerce_admin_fields( $this->get_settings() );

			submit_button();
			?>
		</form>
		<?php
	}

	/**
	 * Update the settings.
	 *
	 * @return void
	 */
	public function update_fields() {
		if ( filter_input( INPUT_POST, 'submit' ) ) {
			woocommerce_update_options( $this->get_settings() );
			add_settings_error( 'woocommerce', 'settings_updated', __( 'Settings saved.', 'woocommerce-product-options' ), 'success' );
		}
	}

	/**
	 * Add the Uninstall section to the settings.
	 *
	 * @param array $settings The current settings.
	 * @return array The updated settings.
	 */
	public function add_uninstall_section( $settings ) {
		$uninstall_section = [
			[
				'title' => __( 'Uninstall', 'woocommerce-product-options' ),
				'type'  => 'title',
				'id'    => 'wpo_uninstall_section',
				'desc'  => __( 'The following options control the uninstallation of the WooCommerce Product Options extension.', 'woocommerce-product-options' ),
			],
			[
				'type'    => 'checkbox',
				'id'      => 'wpo_settings[delete_data]',
				'title'   => __( 'Delete data', 'woocommerce-product-options' ),
				'name'    => 'wpo_settings[delete_data]',
				'default' => false,
				'desc'    => sprintf(
					// translators: %s is the plugin name.
					__( 'Permanently delete all %s settings and data when uninstalling the plugin.', 'woocommerce-product-options' ),
					$this->plugin->get_name()
				),
			],
			[
				'type' => 'sectionend',
				'id'   => 'wpo_uninstall_section',
			],
		];

		return array_merge( $settings, $uninstall_section );
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
