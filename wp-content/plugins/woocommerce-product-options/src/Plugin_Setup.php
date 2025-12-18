<?php
namespace Barn2\Plugin\WC_Product_Options;

use Barn2\Plugin\WC_Product_Options\Dependencies\Setup_Wizard\Starter;
use Barn2\Plugin\WC_Product_Options\Schema\Groups;
use Barn2\Plugin\WC_Product_Options\Schema\Options;
use Barn2\Plugin\WC_Product_Options\Model\Group as Group_Model;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Plugin\Licensed_Plugin;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Plugin\Plugin_Activation_Listener;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;

/**
 * Hook into the plugin activation process.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Plugin_Setup implements Plugin_Activation_Listener, Registerable, Standard_Service {

	/**
	 * Plugin's entry file
	 *
	 * @var string
	 */
	private $file;

	/**
	 * Plugin instance
	 *
	 * @var Plugin
	 */
	private $plugin;

	/**
	 * Wizard starter
	 *
	 * @var Starter
	 */
	private $starter;

	/**
	 * Get things started
	 *
	 * @param string $file
	 * @param Licensed_Plugin $plugin
	 */
	public function __construct( $file, Licensed_Plugin $plugin ) {
		$this->file    = $file;
		$this->plugin  = $plugin;
		$this->starter = new Starter( $this->plugin );
	}

	/**
	 * Register the service
	 *
	 * @return void
	 */
	public function register(): void {
		register_activation_hook( $this->plugin->get_basename(), [ $this, 'on_activate' ] );
		add_action( 'admin_init', [ $this, 'after_plugin_activation' ] );
	}

	/**
	 * On plugin activation
	 *
	 * @return void
	 */
	public function on_activate( $network_wide ): void {
		$options_table = new Options();
		$groups_table  = new Groups();

		$options_table->register();
		$groups_table->register();

		$this->install_default_data();

		if ( $this->starter->should_start() ) {
			$this->starter->create_transient();
		}
	}

	/**
	 * Do nothing.
	 *
	 * @return void
	 */
	public function on_deactivate( $network_wide ): void {}

	/**
	 * Detect the transient and redirect to wizard.
	 *
	 * @return void
	 */
	public function after_plugin_activation(): void {
		if ( ! $this->starter->detected() ) {
			return;
		}

		$this->starter->delete_transient();
		$this->starter->redirect();
	}

	/**
	 * Create the default filters group and filters
	 * only when the groups database table is empty.
	 *
	 * @return void
	 */
	private function install_default_data(): void {
		$db = wpo()->get_service( 'db' );

		if ( ! empty( $db->table( 'wpo_groups' )->count() ) || $db->table( 'wpo_groups' )->count() === 0 ) {
			return;
		}

		Group_Model::create(
			[
				'name'       => __( 'Product Options', 'woocommerce-product-options' ),
				'menu_order' => 0,
				'visibility' => 'global',
			]
		);
	}
}
