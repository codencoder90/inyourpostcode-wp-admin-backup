<?php

namespace Barn2\Plugin\WC_Product_Options\Admin;

use Barn2\Plugin\WC_Product_Options\Util\Util;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Conditional;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Plugin\License\License;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Plugin\Licensed_Plugin;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Util as Lib_Util;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Admin\Settings_Util;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;

/**
 * The settings page.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Settings_Page implements Standard_Service, Registerable, Conditional {

	/**
	 * Plugin handling the page.
	 *
	 * @var Licensed_Plugin
	 */
	public $plugin;

	/**
	 * License handler.
	 *
	 * @var License
	 */
	public $license;

	/**
	 * List of settings.
	 *
	 * @var array
	 */
	public $registered_settings = [];

	/**
	 * Constructor.
	 *
	 * @param Licensed_Plugin $plugin
	 */
	public function __construct( Licensed_Plugin $plugin ) {
		$this->plugin              = $plugin;
		$this->license             = $plugin->get_license();
		$this->registered_settings = $this->get_settings_tabs();
	}

	/**
	 * {@inheritdoc}
	 */
	public function is_required() {
		return Lib_Util::is_admin();
	}

	/**
	 * {@inheritdoc}
	 */
	public function register() {
		$this->register_settings_tabs();

		add_action( 'admin_menu', [ $this, 'add_settings_page' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_action( 'admin_init', [ $this, 'add_notices' ] );
	}

	/**
	 * Add notices to the admin area.
	 */
	public function add_notices() {
		if ( ! extension_loaded( 'intl' ) ) {
			$this->plugin->notices()->add_warning_notice(
				'missing_intl',
				__( 'PHP Intl extension required', 'woocommerce-product-options' ),
				__( 'The PHP Intl extension is required for the WooCommerce Product Options plugin to work correctly. Please ask your hosting provider to enable this extension.', 'woocommerce-product-options' ),
				[
					'screens' => [ 'product_page_wpo_options' ],
				]
			);
		}

		if ( ! Util::is_live_preview_installed() && Util::is_live_preview_included( $this->plugin->get_license() ) ) {
			$this->plugin->notices()->add_info_notice(
				'missing_wlp',
				__( 'Install WooCommerce Live Preview', 'woocommerce-product-options' ),
				sprintf(
					// translators: %s: Link to install the bonus plugin.
					__( 'Thanks for adding the Live Preview add-on to WooCommerce Product Options. Please install it and then enable it on the product options that you wish to use it for. %s', 'woocommerce-product-options' ),
					sprintf(
						'<br><a href="%1$s">%2$s</a>.',
						'#',
						__( 'Install WooCommerce Live Preview', 'woocommerce-product-options' )
					)
				),
				[
					'screens' => [],
				]
			);
		}
	}

	/**
	 * Retrieves the settings tab classes.
	 *
	 * @return array
	 */
	private function get_settings_tabs(): array {
		return [
			Settings_Tab\Product_Options::TAB_ID => new Settings_Tab\Product_Options( $this->plugin ),
			Settings_Tab\Import_Export::TAB_ID   => new Settings_Tab\Import_Export( $this->plugin ),
			Settings_Tab\General::TAB_ID         => new Settings_Tab\General( $this->plugin ),
		];
	}

	/**
	 * Register the settings tab classes.
	 *
	 * @return void
	 */
	private function register_settings_tabs(): void {
		array_map(
			function ( $setting_tab ) {
				if ( $setting_tab instanceof Registerable ) {
					$setting_tab->register();
				}
			},
			$this->registered_settings
		);
	}

	/**
	 * Enqueue reg for the settings page.
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		$screen = get_current_screen();

		if ( $screen->base !== 'product_page_wpo_options' ) {
			return;
		}

		wp_enqueue_media();
		wp_enqueue_script( 'wpo-settings-page' );
		wp_enqueue_style( 'wpo-settings-page' );

		wp_enqueue_script( 'wpo-import-export' );
		wp_enqueue_style( 'wpo-import-export' );
	}

	/**
	 * Register the Settings submenu page.
	 */
	public function add_settings_page() {
		add_submenu_page(
			'edit.php?post_type=product',
			__( 'Product Options', 'woocommerce-product-options' ),
			__( 'Product Options', 'woocommerce-product-options' ),
			'manage_woocommerce',
			'wpo_options',
			[ $this, 'render_settings_page' ]
		);
	}

	/**
	 * Render the Settings page.
	 */
	public function render_settings_page(): void {
		$active_tab   = filter_input( INPUT_GET, 'tab', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) ?? 'product_options';
		$setting_tabs = apply_filters( 'wc_product_options_setting_tabs', $this->registered_settings );
		?>
		<div class='woocommerce-layout__header'>
			<div class="woocommerce-layout__header-wrapper">
				<h3 class='woocommerce-layout__header-heading'>
					<?php esc_html_e( 'Product Options', 'woocommerce-product-options' ); ?>
				</h3>
				<div class="links-area">
					<?php $this->support_links(); ?>
				</div>
			</div>
		</div>

		<div class="wrap barn2-settings">

			<?php do_action( 'barn2_before_plugin_settings', $this->plugin->get_id() ); ?>

			<div class="barn2-settings-inner">

				<h2 class="nav-tab-wrapper">
					<?php
					foreach ( $setting_tabs as $setting_tab ) {
						$active_class = $active_tab === $setting_tab::TAB_ID ? ' nav-tab-active' : '';
						?>
							<a href="<?php echo esc_url( add_query_arg( 'tab', $setting_tab::TAB_ID, $this->plugin->get_settings_page_url() ) ); ?>" class="<?php echo esc_attr( sprintf( 'nav-tab%s', $active_class ) ); ?>">
								<?php echo esc_html( $setting_tab->get_title() ); ?>
							</a>
							<?php
					}
					?>
				</h2>

				<div class="barn2-inside-wrapper">
					<?php
					if ( isset( $setting_tabs[ $active_tab ] ) ) {
						$setting_tabs[ $active_tab ]->output();
					} else {
						echo esc_html__( 'This tab doesn\'t exist.', 'woocommerce-product-options' );
					}
					?>
				</div>

			</div>

			<?php do_action( 'barn2_after_plugin_settings', $this->plugin->get_id() ); ?>
		</div>
		<?php
	}

	/**
	 * Output the Barn2 Support Links.
	 */
	public function support_links(): void {
		printf(
			'<p>%s</p>',
			// phpcs:reason The output is already escaped in the Settings_Util::get_help_links() method.
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			Settings_Util::get_help_links( $this->plugin )
		);
	}
}
