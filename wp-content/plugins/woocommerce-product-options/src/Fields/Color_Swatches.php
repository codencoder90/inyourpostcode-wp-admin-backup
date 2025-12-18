<?php
namespace Barn2\Plugin\WC_Product_Options\Fields;

use Barn2\Plugin\WC_Product_Options\Util\Util;

/**
 * Color swatches field class.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Color_Swatches extends Abstract_Field {

	protected $type = 'color_swatches';

	protected $used_settings = [
		'display_label',
	];

	protected $display_label;

	/**
	 * Render the HTML for the field.
	 */
	public function render(): void {
		if ( ! $this->has_display_prerequisites() ) {
			return;
		}

		$this->render_field_wrap_open();

		$this->render_option_name();
		$this->render_swatches();
		$this->render_description();

		$this->render_field_wrap_close();
	}

	/**
	 * Render the HTML for the field checkboxes.
	 */
	private function render_swatches(): void {
		$html = '<div class="wpo-color-checkboxes">';

		foreach ( $this->get_choices() as $index => $choice ) {
			$choice['index'] = $index;
			$html           .= sprintf(
				'<div class="%9$s">
					<label aria-label="%10$s">
						<input type="radio" id="%1$s" name="%2$s" value="%3$s" %4$s %8$s data-formula-value="%11$s" %12$s data-color="%5$s">
						<span class="wpo-swatch-inner" style="background-color: %5$s"></span>
						%13$s
						<div>%6$s%7$s</div>
					</label>
				</div>',
				esc_attr( sprintf( '%1$s-%2$s', $this->get_input_id(), $index ) ),
				esc_attr( $this->get_input_name() ),
				esc_attr( $choice['id'] ),
				checked( $this->is_choice_preselected( $choice ), true, false ),
				esc_attr( $choice['color'] ?? '#000' ),
				$this->display_label ? esc_attr( $this->get_label( $index ) ) : '',
				$this->equal_pricing ? '' : $this->get_choice_pricing_string( $choice ),
				$this->get_choice_pricing_attributes( $choice ),
				$this->get_choice_class( $choice ),
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
	 * {@inheritdoc}
	 */
	protected function get_label( $index = 0, $skip_filters = false ): string {
		if ( $this->display_label ) {
			return parent::get_label( $index );
		}

		return '';
	}

	/**
	 * Get the class for the color box.
	 *
	 * @param array $choice The choice.
	 * @return string
	 */
	private function get_choice_class( $choice ) {
		$classes = [ 'wpo-color-checkbox' ];

		$choice_color = $choice['color'] ?? '#000';
		$color        = str_replace( '#', '', $choice_color );

		if ( $color && Util::is_color_bright( $color ) ) {
			$classes[] = 'is-bright';
		}

		return implode( ' ', $classes );
	}
}
