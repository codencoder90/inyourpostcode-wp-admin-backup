<?php
namespace Barn2\Plugin\WC_Product_Options\Fields;

use Barn2\Plugin\WC_Product_Options\Fields\Traits\Cart_Item_Data_Formula;
use Barn2\Plugin\WC_Product_Options\Formula;
use WP_Error;

/**
 * Price Formula field.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Price_Formula extends Abstract_Field {

	use Cart_Item_Data_Formula;

	protected $type = 'price_formula';
	protected $formula;

	/**
	 * Constructor.
	 *
	 * @param Option $option
	 * @param WC_Product $product
	 */
	public function __construct( $option, $product ) {
		parent::__construct( $option, $product );

		$this->formula = new Formula( $option );
	}

	/**
	 * Always pass through the field as it contains no data. The formula will be validated in the cart.
	 *
	 * @param mixed $value
	 * @param array $option_data
	 * @return WP_Error|true;
	 */
	public function validate( $value, $option_data ) {
		return true;
	}

	/**
	 * Render the HTML for the field.
	 */
	public function render(): void {
		if ( ! $this->has_display_prerequisites() ) {
			return;
		}

		$this->render_field_wrap_open();

		$this->render_hidden_input();

		$this->render_field_wrap_close();
	}

	/**
	 * Render the HTML for the field.
	 */
	private function render_hidden_input(): void {
		$html = sprintf(
			'<input type="hidden" id="%1$s" name="%2$s" value="0" %3$s>',
			esc_attr( $this->get_input_id() ),
			esc_attr( $this->get_input_name() ),
			$this->get_choice_pricing_attributes()
		);

		// phpcs:reason This is escaped above.
        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $html;
	}

	/**
	 * Retrieves top level pricing attributes for the field.
	 *
	 * @return array
	 */
	public function get_pricing_attributes(): array {
		$attributes = [
			'data-pricing'      => 'true',
			'data-option-price' => '0',
		];

		return $attributes;
	}

	/**
	 * Gets the data attributes to handle JS pricing calculation.
	 *
	 * @param array $choice
	 * @return string
	 */
	public function get_choice_pricing_attributes( array $choice = [] ): string {
		$attributes = [
			'data-price-type'               => 'price_formula',
			'data-price-formula-variables'  => esc_attr( wp_json_encode( $this->formula->get_variables() ) ),
			'data-custom-formula-variables' => esc_attr( wp_json_encode( $this->formula->get_custom_variables() ) ),
			'data-price-formula-valid'      => $this->formula->check_validity() ? 'true' : 'false',
		];

		$formatted_attributes = array_map(
			function ( $name, $value ) {
				return sprintf( '%1$s="%2$s"', $name, $value );
			},
			array_keys( $attributes ),
			array_values( $attributes )
		);

		$formatted_attributes[] = sprintf( '%1$s="%2$s"', 'data-price-formula', esc_attr( $this->formula->get_formula() ) );

		$attribute_string = implode( ' ', $formatted_attributes );

		return $attribute_string;
	}
}
