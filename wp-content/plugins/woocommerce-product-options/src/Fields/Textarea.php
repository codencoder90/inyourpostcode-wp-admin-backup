<?php
namespace Barn2\Plugin\WC_Product_Options\Fields;

use Barn2\Plugin\WC_Product_Options\Util\Util;

/**
 * Text input field class.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Textarea extends Abstract_Field {

	protected $type           = 'textarea';
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
		$this->render_textarea();
		$this->render_description();

		$this->render_field_wrap_close();
	}

	/**
	 * Render the HTML for the field input.
	 */
	private function render_textarea(): void {
		$html = sprintf(
			'<label for="%1$s" aria-label="%8$s">%5$s %6$s</label><textarea id="%1$s" name="%2$s" rows="3" %3$s %4$s %7$s></textarea>',
			esc_attr( $this->get_input_id() ),
			esc_attr( $this->get_input_name() ),
			$this->get_choice_pricing_attributes(),
			$this->get_character_limit_attributes(),
			$this->get_label(),
			$this->get_choice_pricing_string(),
			$this->is_required() ? 'required' : '',
			esc_attr( $this->get_label( 0, true ) )
		);

		// phpcs:reason This is escaped above.
        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $html;
	}

	/**
	 * Gets the character limits for the field. (Text and Textarea)
	 */
	private function get_character_limit_attributes(): string {
		$attributes  = [];
		$choice_char = $this->choice_char;
		$min         = $choice_char['min'] ?? '';
		$max         = $choice_char['max'] ?? '';

		if ( $choice_char ) {
			if ( ! empty( $min ) ) {
				$attributes['minLength'] = $min;
			}

			if ( ! empty( $max ) ) {
				$attributes['maxLength'] = $max;
			}
		}

		$attribute_string = Util::get_html_attribute_string( $attributes );

		return $attribute_string;
	}

	/**
	 * {@inheritDoc}
	 */
	public function sanitize( $value ) {
		return trim( sanitize_textarea_field( $value ) );
	}

	protected function get_field_attributes(): string {
		$field_attributes         = parent::get_field_attributes();
		$options_has_live_preview = filter_var( $this->get_setting( 'live_preview' ) ?? true, FILTER_VALIDATE_BOOLEAN );
		$default_customize_text   = apply_filters( 'wc_product_options_live_preview_default_customize_button_text', '', $this, $this->product );
		$customize_button_text    = $this->get_setting( 'live_preview_button_text' ) ?: $default_customize_text;

		if ( Util::is_live_preview_active() && $options_has_live_preview && $customize_button_text ) {
			$field_attributes .= sprintf( ' data-live-preview-button-text="%s"', esc_attr( $customize_button_text ) );
		}

		return $field_attributes;
	}
}
