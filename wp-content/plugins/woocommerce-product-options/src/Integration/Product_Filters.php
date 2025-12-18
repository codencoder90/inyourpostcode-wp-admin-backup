<?php
namespace Barn2\Plugin\WC_Product_Options\Integration;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Util as Lib_Util;
use Barn2\Plugin\WC_Wholesale_Pro\Util as Wholesale_Util;
use Barn2\Plugin\WC_Wholesale_Pro\Controller\Wholesale_Role;
use Exception;

/**
 * Handles the Product Filters integration.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Product_Filters implements Registerable, Standard_Service {

	/**
	 * {@inheritdoc}
	 */
	public function register() {

		add_filter( 'wc_product_options_settings_app_params', [ $this, 'add_product_filters_settings' ], 10, 1 );
		add_filter( 'wc_product_options_external_conditions', [ $this, 'add_product_filters_attribute_extras' ], 10, 1 );
	}

	/**
	 * Add the Product Filters settings to the app params.
	 *
	 * @param array $params
	 * @return array
	 */
	public function add_product_filters_settings( $params ) {
		if ( ! Lib_Util::is_barn2_plugin_active( '\Barn2\Plugin\WC_Filters\wcf' ) ) {
			return array_merge( $params, [ 'isProductFiltersActive' => false ] );
		}

		return array_merge( $params, [ 'isProductFiltersActive' => true ] );
	}

	/**
	 * Adds the Product Filters attribute extras to the product options.
	 *
	 * @param array $params
	 * @return array $params
	 */
	public function add_product_filters_attribute_extras( $params ) {
		if ( ! Lib_Util::is_barn2_plugin_active( '\Barn2\Plugin\WC_Filters\wcf' ) ) {
			return $params;
		}

		if ( ! isset( $params['productAttributes']['options'] ) || empty( $params['productAttributes']['options'] ) ) {
			return $params;
		}

		$attributes = $params['productAttributes']['options'];

		$attributes = array_map(
			function ( $attribute ) {
				return array_merge(
					$attribute,
					[
						'choices' => array_map(
							function ( $attribute_term ) use ( $attribute ) {
								$term = get_term_by( 'slug', $attribute_term['id'], $attribute['id'] );

								return array_merge(
									$attribute_term,
									[
										'wfpColor' => get_term_meta( $term->term_id, 'wcf_term_color', true ),
										'wfpImage' => get_term_meta( $term->term_id, 'thumbnail_id', true ),
									]
								);
							},
							$attribute['choices']
						),
					]
				);
			},
			$attributes
		);

		$params['productAttributes']['options'] = $attributes;

		return $params;
	}
}
