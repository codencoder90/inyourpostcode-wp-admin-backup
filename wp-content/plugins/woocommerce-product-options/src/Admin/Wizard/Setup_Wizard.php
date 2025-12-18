<?php

namespace Barn2\Plugin\WC_Product_Options\Admin\Wizard;

use Barn2\Plugin\WC_Product_Options\Admin\Wizard\Steps;
use Barn2\Plugin\WC_Product_Options\Dependencies\Setup_Wizard\Setup_Wizard as WPO_Setup_Wizard;
use Barn2\Plugin\WC_Product_Options\Dependencies\Setup_Wizard\Steps\Cross_Selling;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Plugin\License\EDD_Licensing;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Plugin\License\Plugin_License;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Plugin\Plugin;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Util as Lib_Util;

/**
 * Main Setup Wizard Loader
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Setup_Wizard implements Registerable, Standard_Service {

	private $plugin;
	private $wizard;

	/**
	 * Constructor.
	 *
	 * @param Licensed_Plugin $plugin
	 */
	public function __construct( Plugin $plugin ) {
		$this->plugin = $plugin;

		$steps = [
			new Steps\License_Verification(),
			new Cross_Selling(),
			new Steps\Completed(),
		];

		$wizard = new WPO_Setup_Wizard( $this->plugin, $steps );

		$wizard->configure(
			[
				'skip_url'    => admin_url( 'edit.php?post_type=product&page=wpo_options' ),
				'premium_url' => 'https://barn2.com/wordpress-plugins/woocommerce_product_options/',
				'utm_id'      => 'wpo',
			]
		);

		$wizard->set_lib_url( $this->plugin->get_dir_url() . '/dependencies/barn2/setup-wizard/' );
		$wizard->set_lib_path( $this->plugin->get_dir_path() . '/dependencies/barn2/setup-wizard/' );

		$wizard->add_edd_api( EDD_Licensing::class );
		$wizard->add_license_class( Plugin_License::class );
		$wizard->add_restart_link( 'wpo_options', '' );

		$script_dependencies = Lib_Util::get_script_dependencies( $this->plugin, 'admin/wpo-setup-wizard.js' );

		$wizard->add_custom_asset(
			$this->plugin->get_dir_url() . 'assets/js/admin/wpo-setup-wizard.js',
			$script_dependencies
		);

		$this->wizard = $wizard;
	}

	/**
	 * {@inheritdoc}
	 */
	public function register() {
		$this->wizard->boot();
	}
}
