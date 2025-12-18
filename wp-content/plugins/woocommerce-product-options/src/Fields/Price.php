<?php
namespace Barn2\Plugin\WC_Product_Options\Fields;

/**
 * Text input field class.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Price extends Abstract_Field {

	protected $type           = 'customer_price';
	protected $has_user_value = true;

	/**
	 * Supports multiple values (e.g checkboxes, radios).
	 *
	 * @var bool
	 */
	protected $supports_multiple_values = false;

	/**
	 * Render the HTML for the field.
	 */
	public function render(): void {
		if ( ! $this->has_display_prerequisites() ) {
			return;
		}

		$this->render_field_wrap_open();

		$this->render_option_name();
		$this->render_input();
		$this->render_description();

		$this->render_field_wrap_close();
	}

	/**
	 * Render the HTML for the field input.
	 */
	private function render_input() {
		$html = sprintf(
			'<label for="%1$s" aria-label="%7$s">%4$s</label>
			<div class="wpo-customer-price">
				<span class="wpo-customer-price-currency">%6$s</span>
				<input type="number" min="0" step="0.01" id="%1$s" name="%2$s" %3$s %5$s>
				<div class="wpo-customer-price-backdrop"></div>
			</div>',
			esc_attr( $this->get_input_id() ),
			esc_attr( $this->get_input_name() ),
			$this->get_choice_pricing_attributes(),
			$this->get_label(),
			$this->is_required() ? 'required' : '',
			get_woocommerce_currency_symbol(),
			esc_attr( $this->get_label( 0, true ) )
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
			'data-option-price' => '0'
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
			'data-price-type' => 'flat_fee',
		];

		$formatted_attributes = array_map(
			function ( $name, $value ) {
				return esc_attr( sprintf( '%1$s=%2$s', $name, $value ) );
			},
			array_keys( $attributes ),
			array_values( $attributes )
		);

		$attribute_string = implode( ' ', $formatted_attributes );

		return $attribute_string;
	}
}
