<?php

namespace Barn2\Plugin\WC_Product_Options\Admin;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Conditional;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Plugin\Licensed_Plugin;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Util as Lib_Util;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;
use Barn2\Plugin\WC_Product_Options\Model\Option as Option_Model;

/**
 * Handles notices on the attribute term page.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Attribute_Term implements Standard_Service, Registerable, Conditional {

	/**
	 * Plugin handling the page.
	 *
	 * @var Licensed_Plugin
	 */
	public $plugin;

	/**
	 * Constructor.
	 *
	 * @param Licensed_Plugin $plugin
	 */
	public function __construct( Licensed_Plugin $plugin ) {
		$this->plugin = $plugin;
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
		add_action( 'current_screen', [ $this, 'add_notices' ] );
	}

	/**
	 * Add notice when an attribute term does has an attribute option setup, but no choice set for this term.
	 */
	public function add_notices() {
		$screen = get_current_screen();

		if ( ! $screen || $screen->base !== 'term' || strpos( $screen->taxonomy, 'pa_' ) !== 0 ) {
			return;
		}

		$attribute = $screen->taxonomy;
		$term_id   = filter_input( INPUT_GET, 'tag_ID', FILTER_SANITIZE_NUMBER_INT );

		if ( ! $term_id ) {
			return;
		}

		$attribute_options = Option_Model::get_missing_attribute_options( $attribute, $term_id );

		if ( empty( $attribute_options ) ) {
			return;
		}

		$edit_links = [];

		foreach ( $attribute_options as $option ) {
			$edit_link = sprintf(
				admin_url( 'admin.php?post_type=products&page=wpo_options#edit/%d/%d' ),
				$option->group_id,
				$option->id
			);

			$edit_links[] = [
				'url'    => esc_url( $edit_link ),
				'option' => $option->name,
			];
		}

		// create list of to display in notice
		$edit_links = array_map(
			function ( $edit_link ) {
				return sprintf(
					'<a href="%s">%s</a>',
					$edit_link['url'],
					$edit_link['option']
				);
			},
			$edit_links
		);

		$this->plugin->notices()->add_warning_notice(
			'attribute_options_config_warning',
			'',
			sprintf(
				__( 'The attribute has associated attribute based options in <strong>WooCommerce Product Options</strong>, however this term is not configured. Please configure the term in the following options: <br/><br/> %s', 'woocommerce-product-options' ),
				implode( '<br/>', $edit_links )
			),
			[
				'screens' => [],
			]
		);
	}
}
