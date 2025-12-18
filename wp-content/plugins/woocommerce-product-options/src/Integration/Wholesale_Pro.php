<?php
namespace Barn2\Plugin\WC_Product_Options\Integration;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Util as Lib_Util;
use Barn2\Plugin\WC_Wholesale_Pro\Util as Wholesale_Util;
use Barn2\Plugin\WC_Wholesale_Pro\Controller\Wholesale_Role;
use Exception;

/**
 * Handles the Wholesale Pro integration.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Wholesale_Pro implements Registerable, Standard_Service {

	/**
	 * {@inheritdoc}
	 */
	public function register() {
		add_filter( 'wc_product_options_settings_app_params', [ $this, 'add_wholesale_pro_settings' ], 10, 1 );
	}

	/**
	 * Add the Wholesale Pro settings to the app params.
	 * Used for the wholesale pricing component.
	 *
	 * @param array $params
	 * @return array
	 */
	public function add_wholesale_pro_settings( $params ) {

		if ( ! Lib_Util::is_barn2_plugin_active( '\Barn2\Plugin\WC_Wholesale_Pro\woocommerce_wholesale_pro' ) ) {
			return array_merge( $params, [ 'isWholesaleProActive' => false ] );
		}

		$wholesale_roles = Wholesale_Util::get_wholesale_roles( 'editable' );

		if ( empty( $wholesale_roles ) ) {
			return array_merge( $params, [ 'isWholesaleProActive' => false ] );
		}

		$formatted_roles = array_map(
			function( $role_name ) {
				try {
					$role = new Wholesale_Role( $role_name );

					return [
						'name'  => $role->get_name(),
						'label' => $role->get_display_name(),
					];
				} catch ( Exception $e ) {
					return null;
				}
			},
			$wholesale_roles
		);

		return array_merge(
			$params,
			[
				'isWholesaleProActive' => true,
				'wholesaleRoles'       => $formatted_roles
			]
		);
	}
}
