<?php

namespace Barn2\Plugin\WC_Product_Options;

use Barn2\Plugin\WC_Product_Options\Admin\Wizard\Setup_Wizard;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Plugin\Premium_Plugin;

/**
 * The main plugin class. Responsible for setting up to core plugin services.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Plugin extends Premium_Plugin {
	const NAME        = 'WooCommerce Product Options';
	const ITEM_ID     = 461766;
	const META_PREFIX = 'wpo_';

	/**
	 * Constructs and initalizes the main plugin class.
	 *
	 * @param string $file    The root plugin __FILE__
	 * @param string $version The current plugin version
	 */
	public function __construct( $file = null, $version = '1.0' ) {
		parent::__construct(
			[
				'name'               => self::NAME,
				'item_id'            => self::ITEM_ID,
				'version'            => $version,
				'file'               => $file,
				'is_woocommerce'     => true,
				'settings_path'      => 'edit.php?post_type=product&page=wpo_options',
				'documentation_path' => 'kb-categories/product-options-kb/',
			]
		);
	}

	/**
	 * Setup the plugin services
	 */
	public function add_services() {
		$this->add_service( 'plugin_setup', new Plugin_Setup( $this->get_file(), $this ), true );
		$this->add_service( 'setup_wizard', new Setup_Wizard( $this ) );
		$this->add_service( 'admin_controller', new Admin\Admin_Controller( $this ) );
		$this->add_service( 'rest_controller', new Rest\Rest_Controller() );
		$this->add_service( 'db', new DB( $this ) );

		if ( $this->get_license()->is_valid() ) {
			$this->add_service( 'frontend_scripts', new Frontend_Scripts( $this ) );
			$this->add_service( 'upload_directory', new Upload_Directory() );
			$this->add_service( 'file_cleanup', new File_Cleanup( $this ) );
			$this->add_service( 'handlers/single_product', new Handlers\Single_Product() );
			$this->add_service( 'handlers/add_to_cart', new Handlers\Add_To_Cart() );
			$this->add_service( 'handlers/item_data', new Handlers\Item_Data() );
			$this->add_service( 'handlers/cart', new Handlers\Cart() );
			$this->add_service( 'integration/wro', new Integration\Restaurant_Ordering() );
			$this->add_service( 'integration/wpt', new Integration\Product_Table() );
			$this->add_service( 'integration/wqv', new Integration\Quick_View_Pro() );
			$this->add_service( 'integration/wbv', new Integration\Bulk_Variations() );
			$this->add_service( 'integration/wwp', new Integration\Wholesale_Pro() );
			$this->add_service( 'integration/wcf', new Integration\Product_Filters() );
			$this->add_service( 'integration/aelia', new Integration\Aelia_Currency_Switcher() );
			$this->add_service( 'integration/wpml', new Integration\WPML( $this ) );
			$this->add_service( 'integration/wc_wpml', new Integration\WooCommerce_Multilingual() );
			$this->add_service( 'integration/wc_subscriptions', new Integration\WooCommerce_Subscriptions() );
			$this->add_service( 'integration/theme_compat', new Integration\Theme_Compat() );
		}
	}
}
