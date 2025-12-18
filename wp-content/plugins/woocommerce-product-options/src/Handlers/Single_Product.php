<?php
namespace Barn2\Plugin\WC_Product_Options\Handlers;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;
use Barn2\Plugin\WC_Product_Options\Model\Group as Group_Model;
use Barn2\Plugin\WC_Product_Options\Model\Option as Option_Model;
use Barn2\Plugin\WC_Product_Options\Util\Util;
use Barn2\Plugin\WC_Product_Options\Util\Display as Display_Util;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use WC_Product_Variable;

/**
 * Class to display the product options on the single product page.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Single_Product implements Registerable, Standard_Service {

	/**
	 * The groups attached to the current product.
	 *
	 * @var array
	 */
	private $groups;

	/**
	 * {@inheritdoc}
	 */
	public function register() {
		add_action( 'woocommerce_before_add_to_cart_button', [ $this, 'output_options' ], 30 );
		add_action( 'woocommerce_before_add_to_cart_quantity', [ $this, 'output_totals_container' ], 90 );

		add_filter( 'woocommerce_get_price_html', [ $this, 'add_suffix_to_price_html' ], 1000, 2 );

		add_filter( 'body_class', [ $this, 'add_body_class' ] );

		// image button gallery integration
		add_filter( 'woocommerce_product_get_gallery_image_ids', [ $this, 'add_image_button_images' ], 10, 2 );

		// variation attribute integration
		add_filter( 'woocommerce_before_variations_form', [ $this, 'output_attribute_options' ], 10, 1 );
	}

	/**
	 * Return the groups assigned to the current product.
	 *
	 * @return array
	 */
	public function get_groups() {
		return $this->groups;
	}

	/**
	 * Return the option types assigned to the current product.
	 *
	 * @return array
	 */
	public function get_option_types() {
		$option_types = [];

		if ( is_array( $this->groups ) ) {
			$group_ids = array_map(
				function ( $group ) {
					return $group->id;
				},
				$this->groups
			);
		} else {
			$group_ids = [ $this->groups->id ?? 0 ];
		}

		$options = Option_Model::whereIn( 'group_id', $group_ids )->get();

		foreach ( $options as $option ) {
			$option_types[] = $option->type;
		}

		return array_values( array_unique( $option_types ) );
	}

	/**
	 * Adds image button images to the product gallery.
	 *
	 * @param array $image_ids
	 * @param \WC_Product $product
	 */
	public function add_image_button_images( $image_ids, $product ) {
		$option_image_ids = Option_Model::get_image_options_for_gallery( $product );

		if ( empty( $option_image_ids ) ) {
			return $image_ids;
		}

		$image_ids = array_values( array_filter( array_unique( array_merge( $image_ids, $option_image_ids ) ) ) );

		return $image_ids;
	}

	/**
	 * Options price totals container.
	 */
	public function output_totals_container() {
		$product = wc_get_product();

		if ( ! $product ) {
			return;
		}

		if ( ! Util::is_allowed_product_type( $product->get_type() ) ) {
			return;
		}

		$groups = Group_Model::get_groups_by_product( $product );

		if ( empty( $groups ) ) {
			return;
		}

		if ( ! Util::groups_have_options( $groups ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo Display_Util::get_totals_container_html( $product );
	}

	/**
	 * Outputs the options on the single product page.
	 */
	public function output_options() {
		$product = wc_get_product();

		if ( ! $product ) {
			return;
		}

		// we handle this in the `output_attribute_options` method hooked to the `woocommerce_before_variations_form` action.
		if ( $product instanceof WC_Product_Variable && ! empty( Option_Model::get_product_custom_attribute_options( $product ) ) ) {
			return;
		}

		$groups = Group_Model::get_groups_by_product( $product );

		if ( empty( $groups ) ) {
			return;
		}

		$this->groups = $groups;

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo Display_Util::get_groups_html( $groups, $product );
	}

	/**
	 * Filters the price HTML to add the per product suffix if it exists.
	 *
	 * @param string $price_html The price HTML.
	 * @param \WC_Product $product The product.
	 * @return string The filtered price HTML.
	 */
	public function add_suffix_to_price_html( $price_html, $product ) {
		if ( is_admin() ) {
			return $price_html;
		}

		$price_suffix = Option_Model::get_price_suffixes_by_product( $product );

		if ( ! $price_suffix ) {
			return $price_html;
		}

		$suffix_html = sprintf( '<small class="wpo-price-suffix"> %s</small>', esc_html( $price_suffix ) );

		if ( '' === $product->get_price() ) {
			$price_html = apply_filters( 'woocommerce_empty_price_html', '', $product );
		} elseif ( $product->is_on_sale() ) {
			$price_html = wc_format_sale_price( wc_get_price_to_display( $product, [ 'price' => $product->get_regular_price() ] ), wc_get_price_to_display( $product ) ) . $suffix_html . $product->get_price_suffix();
		} else {
			$price_html = wc_price( wc_get_price_to_display( $product ) ) . $suffix_html . $product->get_price_suffix();
		}

		return $price_html;
	}

	/**
	 * Adds a body class to the single product page if there are fields.
	 *
	 * @param array $classes
	 * @return array
	 */
	public function add_body_class( $classes ) {

		if ( ! is_product() ) {
			return $classes;
		}

		$product = wc_get_product();

		$groups = Group_Model::get_groups_by_product( $product );

		if ( empty( $groups ) ) {
			return $classes;
		}

		$classes[] = 'wpo-has-fields';

		return $classes;
	}

	/**
	 * H the variation attribute options dropdowns if we have custom WPO based attribute option.
	 *
	 * @return string
	 */
	public function output_attribute_options() {
		$product = wc_get_product();

		if ( ! $product || ! $product instanceof WC_Product_Variable ) {
			return;
		}

		$attribute_options = Option_Model::get_product_custom_attribute_options( $product );

		if ( empty( $attribute_options ) ) {
			return;
		}

		$groups = Group_Model::get_groups_by_product( $product );

		if ( empty( $groups ) ) {
			return;
		}

		$this->groups = $groups;

		$css = sprintf(
			'<style>%s</style>',
			implode(
				'',
				array_map(
					function ( $attr ) {
						return <<<CSS
							/* Always hide the select element */
							select#$attr {display:none!important;}
							span.select-parent:has(select[name=\"attribute_$attr\"]){display:none!important;}
							/* Hide th and select in rows with additional elements */
							tr:has(select#$attr) th {display:none!important;}
							/* Remove margin from reset button in these rows */
							tr:has(select#$attr) .reset_variations {margin-left:0!important;}
							/* Only hide the entire row if select is alone */
							tr:has(select#$attr):has(td.value:not(:has(> :not(select)))){display:none!important;}
						CSS;
					},
					$attribute_options
				)
			)
		);

		// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $css;
		echo Display_Util::get_groups_html( $groups, $product );
		// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}
