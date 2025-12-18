<?php
namespace Barn2\Plugin\WC_Product_Options\Fields;

use Barn2\Plugin\WC_Product_Options\Fields\Traits\Cart_Item_Data_Multi;
use Barn2\Plugin\WC_Product_Options\Util\Conditional_Logic as Conditional_Logic_Util;
use WP_Error;

/**
 * Checkboxes field class.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Checkboxes extends Abstract_Field {

	use Cart_Item_Data_Multi;

	protected $type = 'checkbox';

	/**
	 * Whether the field supports multiple values (e.g checkboxes).
	 *
	 * @var bool
	 */
	protected $stores_multiple_values = true;


	/**
	 * Sanitizes the field value.
	 *
	 * @param array $values The field value.
	 * @return array The sanitized field value.
	 */
	public function sanitize( $values ) {
		$sanitized_values = [];

		foreach ( $values as $value ) {
			$sanitized_values[] = sanitize_text_field( $value );
		}

		return $sanitized_values;
	}

	/**
	 * Validate the filled value.
	 *
	 * @param mixed $values
	 * @param array $option_data
	 * @return WP_Error|true
	 */
	public function validate( $values, $option_data ) {
		if ( $this->is_required() && empty( $values ) && ! Conditional_Logic_Util::is_field_hidden( $this, $option_data ) ) {
			/* translators: %s: Option name */
			return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is a required field for "%2$s".', 'woocommerce-product-options' ), $this->option->name, $this->product->get_name() ) ) );
		}

		if ( is_null( $this->option->choices ) ) {
			return true;
		}

		foreach ( $values as $choice ) {
			$key = array_search( $choice, array_column( $this->option->choices, 'id' ), true );

			if ( ! isset( $this->option->choices[ $key ] ) ) {
				/* translators: %s: Option name */
				return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( 'Invalid option choice for "%1$s" on "%2$s".', 'woocommerce-product-options' ), $this->option->name, $this->product->get_name() ) ) );
			}
		}

		$check_quantity = $this->is_required() || count( $values ) > 0;

		if ( $check_quantity ) {
			$min = $this->is_required() ? '1' : ( $this->choice_qty['min'] ?? '' );

			// TODO: min doesn't fire if no choices are selected
			if ( $min !== '' && count( $values ) < (int) $min ) {
				/* translators: %1$s: Min quantity %2$s: Option name %3$s: Product name */
				return new WP_Error(
					'wpo-validation-error',
					esc_html(
						sprintf(
							/* translators: %1$s: Min quantity %2$s: Option name %3$s: Product name */
							_n( 'You must select at least %1$d option for "%2$s" on "%3$s".', 'You must select at least %1$d options for "%2$s" on "%3$s".', $min, 'woocommerce-product-options' ),
							$min,
							$this->option->name,
							$this->product->get_name()
						)
					)
				);
			}

			$max = $this->choice_qty['max'] ?? '';

			if ( $max !== '' && count( $values ) > (int) $max ) {
				/* translators: %1$s: Max quantity %2$s: Option name %3$s: Product name */
				return new WP_Error(
					'wpo-validation-error',
					esc_html(
						sprintf(
							/* translators: %1$s: Max quantity %2$s: Option name %3$s: Product name */
							_n( 'You can only select up to %1$d option for "%2$s" on "%3$s".', 'You can only select up to %1$d options for "%2$s" on "%3$s".', $max, 'woocommerce-product-options' ),
							$max,
							$this->option->name,
							$this->product->get_name()
						)
					)
				);
			}
		}

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

		$this->render_option_name();
		$this->render_checkboxes();
		$this->render_description();

		$this->render_field_wrap_close();
	}

	/**
	 * Render the HTML for the field checkboxes.
	 */
	private function render_checkboxes(): void {
		if ( ! is_array( $this->get_choices() ) ) {
			return;
		}

		$html = sprintf( '<div class="%s">', $this->get_checkbox_group_class() );

		foreach ( $this->get_choices() as $index => $choice ) {
			$choice['index'] = $index;
			$html           .= sprintf(
				'<label class="wpo-checkbox" aria-label="%8$s" %10$s>
					<input type="checkbox" id="%1$s" name="%2$s[]" value="%3$s" %4$s %5$s data-formula-value="%9$s">
					<span class="wpo-checkbox-inner"></span>
					%11$s
					<div>%6$s%7$s</div>
				</label>',
				esc_attr( sprintf( '%1$s-%2$s', $this->get_input_id(), $index ) ),
				esc_attr( $this->get_input_name() ),
				esc_attr( $choice['id'] ),
				checked( $this->is_choice_preselected( $choice ), true, false ),
				$this->get_choice_pricing_attributes( $choice ),
				esc_html( $this->get_label( $index ) ),
				$this->equal_pricing ? '' : $this->get_choice_pricing_string( $choice ),
				esc_attr( $this->get_label( $index, true ) ),
				esc_attr( $this->get_choice_formula_value( $index ) ),
				$this->get_image_data( $this->get_choice_image( $index ) ),
				$this->get_choice_image_html( $index )
			);
		}

		$html .= '</div>';

		// phpcs:reason This is escaped above.
        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $html;
	}

	/**
	 * Get the class for the checkbox group.
	 *
	 * @return string
	 */
	private function get_checkbox_group_class() {
		$classes = [ 'wpo-checkboxes' ];

		if ( count( $this->option->choices ) <= 3 ) {
			$classes[] = 'wpo-checkboxes-one-col';
		}

		return implode( ' ', $classes );
	}
}
