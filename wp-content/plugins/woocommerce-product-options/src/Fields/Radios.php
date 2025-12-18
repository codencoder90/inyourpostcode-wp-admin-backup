<?php
namespace Barn2\Plugin\WC_Product_Options\Fields;

/**
 * Radios field class.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Radios extends Abstract_Field {

	protected $type = 'radio';

	/**
	 * Render the HTML for the field.
	 */
	public function render(): void {
		if ( ! $this->has_display_prerequisites() ) {
			return;
		}

		$this->render_field_wrap_open();

		$this->render_option_name();
		$this->render_radios();
		$this->render_description();

		$this->render_field_wrap_close();
	}

	/**
	 * Render the HTML for the field checkboxes.
	 */
	private function render_radios(): void {
		$html = sprintf( '<div class="%s">', $this->get_radio_group_class() );

		foreach ( $this->get_choices() as $index => $choice ) {
			$choice['index'] = $index;
			$html           .= sprintf(
				'<label class="wpo-radio" aria-label="%8$s" %10$s>
					<input type="radio" id="%1$s" name="%2$s" value="%3$s" %4$s %7$s data-formula-value="%9$s">
					<span class="wpo-radio-inner">
						<span class="wpo-radio-dot"></span>
					</span>
					%11$s
					<div>%5$s%6$s</div>
				</label>',
				esc_attr( sprintf( '%1$s-%2$s', $this->get_input_id(), $index ) ),
				esc_attr( $this->get_input_name() ),
				esc_attr( $choice['id'] ),
				checked( $this->is_choice_preselected( $choice ), true, false ),
				esc_html( $this->get_label( $index ) ),
				$this->equal_pricing ? '' : $this->get_choice_pricing_string( $choice ),
				$this->get_choice_pricing_attributes( $choice ),
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
	 * Get the class for the radio group.
	 *
	 * @return string
	 */
	private function get_radio_group_class() {
		$classes = [ 'wpo-radios' ];

		if ( count( $this->option->choices ) <= 3 ) {
			$classes[] = 'wpo-radios-one-col';
		}

		return implode( ' ', $classes );
	}
}
