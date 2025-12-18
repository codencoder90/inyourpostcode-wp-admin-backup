<?php

namespace Barn2\Plugin\WC_Product_Options\Fields;

use Barn2\Plugin\WC_Product_Options\Fields\Traits\Cart_Item_Data;
use Barn2\Plugin\WC_Product_Options\Util\Price as Price_Util;
use Barn2\Plugin\WC_Product_Options\Util\Conditional_Logic as Conditional_Logic_Util;
use Barn2\Plugin\WC_Product_Options\Util\Util;
use WP_Error;
use WC_Product;
use WC_Product_Variable;

defined( 'ABSPATH' ) || exit;
/**
 * Abstract field class.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
#[\AllowDynamicProperties]
abstract class Abstract_Field {

	use Cart_Item_Data;

	protected $type;
	protected $option;
	protected $product;

	/**
	 * Whether the field has a user-defined value.
	 *
	 * @var bool
	 */
	protected $has_user_value = false;

	/**
	 * Whether the field has conditional logic.
	 *
	 * @var bool
	 */
	protected $has_conditional_logic = false;

	/**
	 * Whether the field supports multiple values (e.g checkboxes, radios, select).
	 *
	 * @var bool
	 */
	protected $supports_multiple_values = true;

	/**
	 * Whether the field can store multiple value selections (e.g checkboxes).
	 *
	 * @var bool
	 */
	protected $stores_multiple_values = false;


	/**
	 * Whether the field is for display only.
	 *
	 * @var bool
	 */
	protected $is_display_field = false;

	/**
	 * An array of settings being used by the field.
	 *
	 * @var array
	 */
	protected $used_settings = [];

	/**
	 * The choice quantity setting.
	 *
	 * @var array
	 */
	protected $choice_qty;

	/**
	 * The choice character setting.
	 *
	 * @var array
	 */
	protected $choice_char;

	/**
	 * Whether all choices have equal pricing.
	 *
	 * @var bool
	 */
	protected $equal_pricing;

	/**
	 * Constructor.
	 *
	 * @param mixed $option
	 * @param WC_Product $product
	 */
	public function __construct( $option, $product ) {
		$this->option  = $option;
		$this->product = $product;

		$used_settings = array_unique(
			array_merge(
				$this->used_settings,
				[
					'choice_qty',
					'choice_char',
				]
			)
		);

		if ( $this->option->settings ) {
			foreach ( $used_settings as $used_setting ) {
				$this->{$used_setting} = $this->get_setting( $used_setting );
			}
		}

		if ( $this->option->display_name && $this->supports_multiple_values && count( $this->option->choices ?? [] ) > 0 ) {
			$base_price_type = $this->option->choices[0]['price_type'] ?? '';
			$base_pricing    = $this->option->choices[0]['pricing'] ?? 0;

			$this->equal_pricing = array_reduce(
				$this->option->choices,
				function ( $carry, $choice ) use ( $base_price_type, $base_pricing ) {
					$choice_pricing    = $choice['pricing'] ?? 0;
					$choice_price_type = $choice['price_type'] ?? '';

					return $carry && $choice_pricing === $base_pricing && $choice_price_type === $base_price_type;
				},
				true
			);
		} else {
			$this->equal_pricing = false;
		}

		$this->init_conditional_logic();
	}

	/**
	 * The set magic method.
	 *
	 * This is defined and empty to allow the use of dynamic properties.
	 *
	 * @see https://www.php.net/manual/en/language.oop5.properties.php#language.oop5.properties.dynamic-properties
	 *
	 * @param  string $name
	 * @param  mixed $value
	 * @return void
	 */
	public function __set( $name, $value ): void {}

	/**
	 * Determine whether the field has conditional logic.
	 */
	private function init_conditional_logic() {
		$this->has_conditional_logic = ! is_null( $this->option->conditional_logic ) && ! empty( $this->option->conditional_logic['conditions'] );
	}

	/**
	 * Get the array with the field settings.
	 *
	 * @return array|null
	 */
	public function get_settings() {
		/**
		 * Filters the array with the field settings.
		 *
		 * @param array $settings The array with the field settings.
		 * @param Abstract_Field $field The field object.
		 * @param WC_Product $product The product object.
		 */
		return apply_filters( 'wc_product_options_get_settings', $this->option->settings, $this, $this->get_product() );
	}

	/**
	 * Get the value of a specific field setting.
	 *
	 * @param  string $setting_name The key of the setting to retrieve.
	 * @return string|array|null
	 */
	public function get_setting( $setting_name ) {
		$settings = $this->get_settings();

		if ( ! isset( $settings[ $setting_name ] ) ) {
			return null;
		}

		/**
		 * Filters the value of a specific field setting.
		 *
		 * @param string|array $value The value of the setting being filtered.
		 * @param string $setting_name The key of the setting being filtered.
		 * @param Abstract_Field $field The field object.
		 * @param WC_Product $product The product object.
		 */
		$value = apply_filters( 'wc_product_options_get_setting', $settings[ $setting_name ], $setting_name, $this, $this->get_product() );

		/**
		 * Filters the value of a specific field setting.
		 *
		 * The variable portion of the filter name refers to the setting name.
		 *
		 * @param string|array $value The value of the setting being filtered.
		 * @param Abstract_Field $field The field object.
		 * @param WC_Product $product The product object.
		 */
		return apply_filters( "wc_product_options_get_{$setting_name}_setting", $value, $this, $this->get_product() );
	}

	/**
	 * Validate the filed value.
	 *
	 * @param mixed $value
	 * @param array $option_data
	 * @return WP_Error|true
	 */
	public function validate( $value, $option_data ) {
		// wpt and the serializeObject plugin pass through display fields.
		if ( $this->is_display_field ) {
			return true;
		}

		if ( $this->is_required() && strlen( $value ) === 0 && ! Conditional_Logic_Util::is_field_hidden( $this, $option_data ) ) {
			/* translators: %1$s: Option name %2$s: Product name*/
			return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is a required field for "%2$s".', 'woocommerce-product-options' ), $this->option->name, $this->product->get_name() ) ) );
		}

		$values = is_array( $value ) ? $value : [ $value ];

		foreach ( $values as $choice ) {
			$key = $this->has_user_value ? 0 : array_search( $choice, array_column( $this->option->choices, 'id' ), true );

			if ( ! $this->has_user_value && ! isset( $this->option->choices[ $key ] ) ) {
				/* translators: %1$s: Option name %2$s: Product name*/
				return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( 'Invalid option choice for "%1$s" on "%2$s".', 'woocommerce-product-options' ), $this->option->name, $this->product->get_name() ) ) );
			}
		}

		return true;
	}

	/**
	 * Sanitize the field input value.
	 *
	 * @param mixed $value
	 * @return mixed
	 */
	public function sanitize( $value ) {
		return sanitize_text_field( $value );
	}

	/**
	 * Returns the valid choices for the field.
	 *
	 * @return null|array
	 */
	protected function get_choices(): ?array {
		if ( $this->is_valid_attribute_option_for_product() ) {
			return $this->get_attribute_choices();
		}

		return $this->option->choices;
	}

	/**
	 * Retrieves the valid choices for the attribute option.
	 *
	 * @return null|array
	 */
	protected function get_attribute_choices(): ?array {
		$global_attributes = $this->get_global_attributes();

		if ( empty( $global_attributes ) ) {
			return null;
		}

		if ( ! isset( $global_attributes[ $this->option->settings['selected_attribute'] ] ) ) {
			return null;
		}

		$attribute_terms = $global_attributes[ $this->option->settings['selected_attribute'] ];

		if ( empty( $attribute_terms ) ) {
			return null;
		}

		$choices = $this->option->choices;

		$choices = array_filter(
			$choices,
			function ( $choice ) use ( $attribute_terms ) {
				return in_array( $choice['term'], $attribute_terms, true );
			}
		);

		return $choices;
	}

	/**
	 * Retrieves the choice from the option DB based on the user value provided.
	 *
	 * @param mixed $value
	 * @return array|null
	 */
	protected function get_choice_for_value( $value ): ?array {
		$key = $this->has_user_value ? 0 : array_search( $value, array_column( $this->option->choices, 'id' ), true );

		if ( $key === false || ! isset( $this->option->choices[ $key ] ) ) {
			return null;
		}

		return $this->option->choices[ $key ];
	}

	/**
	 * Determines whether the option has enough data to display.
	 *
	 * @return bool
	 */
	protected function has_display_prerequisites(): bool {
		if ( $this->is_display_field ) {
			return true;
		}

		if ( $this->option->type !== 'price_formula' && is_null( $this->option->choices ) ) {
			return false;
		}

		if ( $this->is_variation_attribute_type_option() && ! $this->is_valid_attribute_option_for_product() ) {
			return false;
		}

		if ( in_array( $this->product->get_type(), [ 'simple' ], true ) && ! Conditional_Logic_Util::shall_display_field( $this ) ) {
			// Options of a simple product can be safely hidden
			// if conditions on product attributes are not met in the conditional logic.
			return false;
		}

		/**
		 * Filters whether the field should be displayed.
		 *
		 * @param bool $display True if the field should be displayed, false otherwise.
		 * @param Abstract_Field $field The current field object.
		 */
		$display = apply_filters( 'wc_product_options_field_has_display_prerequisites', true, $this );

		return $display;
	}

	/**
	 * Render the HTML for the field.
	 */
	public function render(): void {}

	/**
	 * Renders the field wrap.
	 */
	protected function render_field_wrap_open(): void {
		/**
		 * Fires before the field wrap is rendered.
		 *
		 * @param Abstract_Field $field The current field object.
		 * @param WC_Product $product The current product object.
		 */
		do_action( 'wc_product_options_before_field_wrap', $this, $this->get_product() );

		/**
		 * Fires before the field wrap is rendered.
		 *
		 * The variable part of the hook name refers to the field type (i.e. `$field->option->type`)
		 *
		 * @param Abstract_Field $field The current field object.
		 * @param WC_Product $product The current product object.
		 */
		do_action( "wc_product_options_before_{$this->option->type}_field_wrap", $this, $this->get_product() );

		// phpcs:reason All the parameters are properly escaped in the methods.
		// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
		printf(
			'<div class="%1$s" %2$s>',
			esc_attr( $this->get_field_class() ),
			$this->get_field_attributes()
		);

		if ( current_user_can( 'manage_woocommerce' ) ) {
			printf(
				'<div class="wpo-field-edit">%s</div>',
				$this->get_edit_option_link()
			);
			// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
		}

		/**
		 * Fires before the field is rendered.
		 *
		 * @param Abstract_Field $field The current field object.
		 * @param WC_Product $product The current product object.
		 */
		do_action( 'wc_product_options_before_field', $this, $this->get_product() );

		/**
		 * Fires before the field is rendered.
		 *
		 * The variable part of the hook name refers to the field type (i.e. `$field->option->type`)
		 *
		 * @param Abstract_Field $field The current field object.
		 * @param WC_Product $product The current product object.
		 */
		do_action( "wc_product_options_before_{$this->option->type}_field", $this, $this->get_product() );
	}

	/**
	 * Renders the field wrap closing tag.
	 */
	protected function render_field_wrap_close(): void {
		/**
		 * Fires after the field is rendered.
		 *
		 * @param Abstract_Field $field The current field object.
		 * @param WC_Product $product The current product object.
		 */
		do_action( 'wc_product_options_after_field', $this, $this->get_product() );

		/**
		 * Fires after the field is rendered.
		 *
		 * The variable part of the hook name refers to the field type (i.e. `$field->option->type`)
		 *
		 * @param Abstract_Field $field The current field object.
		 * @param WC_Product $product The current product object.
		 */
		do_action( "wc_product_options_after_{$this->option->type}_field", $this, $this->get_product() );

		print( '</div>' );

		/**
		 * Fires after the field wrap is rendered.
		 *
		 * @param Abstract_Field $field The current field object.
		 * @param WC_Product $product The current product object.
		 */
		do_action( 'wc_product_options_after_field_wrap', $this, $this->get_product() );

		/**
		 * Fires after the field wrap is rendered.
		 *
		 * The variable part of the hook name refers to the field type (i.e. `$field->option->type`)
		 *
		 * @param Abstract_Field $field The current field object.
		 * @param WC_Product $product The current product object.
		 */
		do_action( "wc_product_options_after_{$this->option->type}_field_wrap", $this, $this->get_product() );
	}

	/**
	 * Render the HTML for the field label.
	 */
	protected function render_option_name(): void {
		if ( $this->option->display_name ) {
			$name = apply_filters( 'wc_product_options_get_output_string', $this->option->name, $this->option, 'option_name' );

			printf(
				'<p class="wpo-option-name">%1$s%2$s%3$s</p>',
				esc_html( $name ),
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				$this->equal_pricing ? ' ' . $this->get_choice_pricing_string( [], true ) : '',
				 // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				$this->get_required_symbol()
			);
		}
	}

	/**
	 * Render the HTML for the field description.
	 */
	protected function render_description(): void {
		if ( ! empty( $this->option->description ) ) {
			$description = apply_filters( 'wc_product_options_get_output_string', $this->option->description, $this->option, 'option_description' );
			printf( '<p class="wpo-field-description">%s</p>', esc_html( $description ) );
		}
	}

	/**
	 * Gets the name attribute for the field input.
	 *
	 * @return string
	 */
	protected function get_input_name(): string {
		return sprintf( 'wpo-option[option-%d]', $this->option->id );
	}

	/**
	 * Gets the id attribute for the field input.
	 *
	 * @return string
	 */
	protected function get_input_id(): string {
		return sprintf( 'wpo-option-%d-%d-%d', $this->option->group_id, $this->option->id, $this->product->get_id() );
	}

	/**
	 * Gets the CSS class for the field.
	 *
	 * @return string
	 */
	protected function get_field_class(): string {
		$classes = [ 'wpo-field', 'wpo-field-%s' ];

		if ( $this->has_conditional_logic && $this->option->conditional_logic['visibility'] === 'show' ) {
			$classes[] = 'wpo-field-hide';
		}

		if ( $this->is_required() ) {
			$classes[] = 'wpo-field-required';
		}

		if ( ! $this->option->display_name && $this->has_user_value ) {
			$classes[] = 'wpo-label-is-option-name';
		}

		if ( $this->option->settings['show_in_product_gallery'] ?? '' ) {
			$classes[] = 'wpo-field-with-images';
		}

		if ( $this->option->settings['display_label'] ?? '' ) {
			$classes[] = 'wpo-field-with-labels';
		}

		if ( ! empty( $this->option->settings['custom_css_class'] ) ) {
			$classes[] = esc_attr( $this->option->settings['custom_css_class'] );
		}

		/**
		 * Filters the CSS classes for the field.
		 *
		 * @param string $class_string
		 * @param Abstract_Field $field
		 */
		return apply_filters( 'wc_product_options_field_css_class', sprintf( implode( ' ', $classes ), $this->option->type ), $this );
	}

	/**
	 * Gets the data attributes to handle conditional logic visibilities.
	 *
	 * @return string
	 */
	protected function get_field_attributes(): string {
		$attributes = [
			'data-type'      => $this->type,
			'data-group-id'  => $this->option->group_id,
			'data-option-id' => $this->option->id,
			'data-clogic'    => $this->has_conditional_logic ? 'true' : 'false',
		];

		if ( $this->has_conditional_logic ) {
			$attributes = array_merge(
				$attributes,
				[
					'data-clogic-relation'   => $this->option->conditional_logic['relation'],
					'data-clogic-visibility' => $this->option->conditional_logic['visibility'],
					'data-clogic-conditions' => wp_json_encode( $this->option->conditional_logic['conditions'] ),
				]
			);
		}

		if ( $this->stores_multiple_values && $this->choice_qty ) {
			$min = $this->choice_qty['min'] ?? '';

			if ( $min !== '' ) {
				$attributes['data-min-qty'] = $min;
			}

			$max = $this->choice_qty['max'] ?? '';

			if ( $max !== '' ) {
				$attributes['data-max-qty'] = $max;
			}
		}

		if ( ! $this->is_display_field ) {
			$attributes = array_merge( $attributes, $this->get_pricing_attributes() );
		}

		if ( $this->is_variation_attribute_type_option() ) {
			$attributes['data-variation-attribute'] = $this->option->settings['selected_attribute'];
		}

		$attribute_string = Util::get_html_attribute_string( $attributes );

		return $attribute_string;
	}

	/**
	 * Get the label for the field or its choices.
	 *
	 * The $index parameter is used to get the label for a specific choice.
	 * For single-choice fields, the $index can be omitted.
	 *
	 * @param int $index The index of the choice (or 0 for single-choice fields)
	 * @param bool $skip_filters
	 * @return string
	 */
	protected function get_label( $index = 0, $skip_filters = false ): string {
		if ( $this->option->choices[ $index ]['label'] === '' ) {
			return '';
		}

		$label = $this->option->choices[ $index ]['label'];

		if ( ! $skip_filters ) {
			$label = apply_filters( 'wc_product_options_get_output_string', $label, $this->option, 'choice_label', $index );
		}

		if ( ! $this->supports_multiple_values && ! $this->option->display_name ) {
			$label .= $this->get_required_symbol();
		}

		return $label;
	}

	/**
	 * Gets the required symbol for the field.
	 *
	 * @return string
	 */
	protected function get_required_symbol() {
		return $this->is_required() ? '<span class="wpo-field-required-symbol">*</span>' : '';
	}

	/**
	 * Gets the label for choice quantity limits if applicable.
	 */
	protected function render_choice_quantity_limits_label(): void {
		if ( ! $this->stores_multiple_values || ! $this->choice_qty ) {
			return;
		}

		$limits = [];

		$min = $this->choice_qty['min'] ?? '';

		if ( $min !== '' ) {
			$limits[] = sprintf( 'Minimum %d', esc_html( $min ) );
		}

		$max = $this->choice_qty['max'] ?? '';

		if ( $max !== '' ) {
			$limits[] = sprintf( 'Maximum %d', esc_html( $max ) );
		}

		if ( empty( $limits ) ) {
			return;
		}

		printf( '<span class="wpo-info-label">Quantities: %s.</span>', esc_html( implode( ', ', $limits ) ) );
	}

	/**
	 * Gets the label for choice character limits if applicable.
	 */
	protected function render_choice_character_limits_label(): void {
		if ( ! $this->has_user_value() || ! $this->choice_char ) {
			return;
		}

		$limits = [];

		$min = $this->choice_char['min'] ?? '';

		if ( $min !== '' ) {
			$limits[] = sprintf( 'Minimum %d', esc_html( $min ) );
		}

		$max = $this->choice_char['max'] ?? '';

		if ( $max !== '' ) {
			$limits[] = sprintf( 'Maximum %d', esc_html( $max ) );
		}

		if ( empty( $limits ) ) {
			return;
		}

		printf( '<span class="wpo-info-label">Characters: %s.</span>', esc_html( implode( ', ', $limits ) ) );
	}

	/**
	 * Retrieves top level pricing attributes for the field.
	 *
	 * @return array
	 */
	protected function get_pricing_attributes(): array {
		$has_pricing   = false;
		$default_price = 0;

		if ( empty( $this->option->choices ) || $this->option->type === 'product' ) {
			return [];
		}

		foreach ( $this->option->choices as $choice ) {
			$price_type = $choice['price_type'] ?? 'no_cost';

			if ( $price_type === 'no_cost' ) {
				continue;
			}

			$has_pricing = true;
			$selected    = $choice['selected'] ?? false;

			if ( $selected && $this->supports_multiple_values ) {
				$default_price += $choice['pricing'];
			}

			if ( ! $this->supports_multiple_values ) {
				$default_price += $choice['pricing'];
			}
		}

		$attributes = [
			'data-pricing'      => $has_pricing ? 'true' : 'false',
			'data-option-price' => (string) $default_price ?? '0',
		];

		return $attributes;
	}

	/**
	 * Gets the data attributes to handle JS pricing calculation.
	 *
	 * @param array $choice
	 * @return string
	 */
	protected function get_choice_pricing_attributes( array $choice = [] ): string {
		$choice     = empty( $choice ) ? $this->option->choices[0] : $choice;
		$price_type = $choice['price_type'] ?? 'no_cost';

		$attributes = [
			'data-price-type' => $price_type,
			'data-index'      => $choice['index'] ?? '',
		];

		$choice_price = Price_Util::get_user_choice_pricing( $choice );

		if ( in_array( $price_type, [ 'percentage_inc', 'percentage_dec' ], true ) ) {
			$attributes['data-price-amount'] = ! empty( $choice_price ) ? $choice_price : '0';
		} else {
			$attributes['data-price-amount'] = ! empty( $choice_price ) ? Price_Util::get_choice_display_price( $this->product, $choice_price, null ) : '0';
		}

		if ( $this->is_valid_attribute_option_for_product() ) {
			$attributes['data-attribute-term'] = $choice['term'];
		}

		$attribute_string = Util::get_html_attribute_string( $attributes );

		return $attribute_string;
	}

	/**
	 * Retrieves the pricing string for a choice
	 *
	 * @param array $choice
	 * @param bool $skip_parenthesis
	 */
	protected function get_choice_pricing_string( array $choice = [], $skip_parenthesis = true ): string {
		$currency_data = Price_Util::get_currency_data();
		$price_string  = '';
		$choice        = empty( $choice ) ? $this->option->choices[0] : $choice;
		$choice_price  = Price_Util::get_user_choice_pricing( $choice );
		$space         = str_contains( get_option( 'woocommerce_currency_pos' ), 'space' ) ? '&nbsp;' : '';

		switch ( $choice['price_type'] ?? '' ) {
			case 'no_cost':
				return '';
			case 'flat_fee':
				$price_string = sprintf( esc_html_x( '%s', 'flat fee price', 'woocommerce-product-options' ), Price_Util::get_price_html( Price_Util::get_choice_display_price( $this->product, $choice_price, null ) ) );
				break;
			case 'percentage_inc':
				/* translators: %1$s: A space or an empty string, %2$s: Option choice percentage increase */
				$price_string = sprintf( esc_html__( '+%1$s%2$s%1$s%%', 'woocommerce-product-options' ), $space, number_format( $choice_price, $currency_data['precision'], $currency_data['decimalSeparator'], $currency_data['thousandSeparator'] ) );
				break;
			case 'percentage_dec':
				/* translators: %1$s: A space or an empty string, %2$s: Option choice percentage decrease */
				$price_string = sprintf( esc_html__( '-%1$s%2$s%1$s%%', 'woocommerce-product-options' ), $space, number_format( $choice_price, $currency_data['precision'], $currency_data['decimalSeparator'], $currency_data['thousandSeparator'] ) );
				break;
			case 'quantity_based':
				$price_string = sprintf( esc_html_x( '%s', 'quantity based price', 'woocommerce-product-options' ), Price_Util::get_price_html( Price_Util::get_choice_display_price( $this->product, $choice_price, null ) ) );
				break;
			case 'char_count':
				/* translators: %s: Option choice price per character */
				$price_string = sprintf( esc_html__( '%s per character', 'woocommerce-product-options' ), Price_Util::get_price_html( Price_Util::get_choice_display_price( $this->product, $choice_price, null ) ) );
				break;
			case 'file_count':
				/* translators: %s: Option choice price per character */
				$price_string = sprintf( esc_html__( '%s per uploaded file', 'woocommerce-product-options' ), Price_Util::get_price_html( Price_Util::get_choice_display_price( $this->product, $choice_price, null ) ) );
				break;
			default:
				return '';
		}

		if ( ! empty( $price_string ) ) {
			if ( ! $skip_parenthesis ) {
				$price_string = "($price_string)";
			}

			return sprintf( '<span class="price wpo-price-container">%s</span>', $price_string );
		}
	}

	/**
	 * Get the formula value associated with a choice of the field.
	 *
	 * @param int $index The index of the choice
	 * @return string
	 */
	public function get_choice_formula_value( $index = 0 ): string {
		$formula_value = $this->option->choices[ $index ]['value'] ?? '';

		if ( ! $formula_value ) {
			return '';
		}

		return $this->option->choices[ $index ]['value'];
	}

	/**
	 * Gets the choice image for the field.
	 *
	 * @param int $index
	 * @return string
	 */
	protected function get_choice_image( $index = 0 ): string {
		$image = $this->option->choices[ $index ]['media'] ?? '';

		if ( ! $image ) {
			return '';
		}

		return $image;
	}

	/**
	 * Get the choice image HTML markup
	 *
	 * @param int $index
	 * @return string
	 */
	protected function get_choice_image_html( $index = 0 ): string {
		if ( empty( $this->option->settings['display_choice_image'] ) ) {
			return '';
		}

		$image     = $this->get_choice_image( $index );
		$image_src = wp_get_attachment_image_url( $image, 'thumbnail' );

		if ( ! $image_src ) {
			return '';
		}

		$image_srcset = wp_get_attachment_image_srcset( $image, 'thumbnail' );

		$alt = $this->option->choices[ $index ]['label'] ?? '';

		$html = sprintf(
			'<img src="%1$s" srcset="%2$s" alt="%3$s" class="wpo-choice-image" />',
			esc_url( $image_src ),
			esc_attr( $image_srcset ),
			esc_attr( $alt )
		);

		return $html;
	}

	/**
	 * Get the srcset attribute for the image.
	 *
	 * @param int $image_id
	 * @param string $size
	 * @return string
	 */
	protected function get_image_srcset( $image_id, $size ): string {
		if ( ! is_numeric( $image_id ) ) {
			return '';
		}

		return wp_get_attachment_image_srcset( $image_id, $size );
	}

	/**
	 * Return the `data-image` attribute of the image button.
	 *
	 * The attribute contains the image data in JSON format
	 * as returned by the `wc_get_product_attachment_props` function.
	 *
	 * @since 1.6.4
	 * @param  string|int $attachment_id The ID of the image attachment.
	 * @return string
	 */
	protected function get_image_data( $attachment_id ) {
		if ( ! $this->is_update_main_image_enable() ) {
			return '';
		}

		return sprintf(
			'data-image="%1$s"',
			htmlspecialchars( wp_json_encode( wc_get_product_attachment_props( $attachment_id ) ) )
		);
	}

	/**
	 * Get the `sizes` attribute for the image element.
	 *
	 * @since 1.6.4
	 * @param string|int $attachment_id The ID of the image attachment.
	 * @param int $width
	 * @return string
	 */
	protected function get_attachment_image_sizes( $attachment_id, $width ) {
		if ( ! wp_get_attachment_image_src( $attachment_id, 'full' ) ) {
			return '';
		}

		return sprintf(
			'(max-width: 480px) 480px, %1$dpx',
			$width
		);
	}

	/**
	 * Checks if the field has choice images.
	 *
	 * @return bool
	 */
	protected function has_choice_images(): bool {
		if ( ! $this->supports_multiple_values ) {
			return false;
		}

		return array_reduce(
			$this->option->choices ?? [],
			function ( $carry, $choice ) {
				return $carry || ! empty( $choice['media'] );
			},
			false
		);
	}

	/**
	 * Whether the option has the "Update main image" setting enabled.
	 *
	 * @since 1.6.4
	 * @return bool
	 */
	protected function is_update_main_image_enable() {
		if ( ! $this->has_choice_images() ) {
			return false;
		}

		$show_in_product_gallery = (bool) ( $this->option->settings['show_in_product_gallery'] ?? false );

		/**
		 * Filter whether the option has the "Update main image" setting enabled.
		 *
		 * Thanks to this filter, the "Update main image" can be forced to be enabled/disabled site-wide
		 * or on specific products without any need to manually change any of the existing options.
		 *
		 * Example:
		 * ```
		 * function my_wc_product_options_is_update_main_image_enabled( $is_enabled, $option, $product ) {
		 *     if ( $product->get_id() === 123 ) {
		 *         return true;
		 *     }
		 *
		 *     return $is_enabled;
		 * }
		 * ```
		 *
		 * @param bool          $show_in_product_gallery Whether the option has the "Update main image" setting enabled.
		 * @param Image_Buttons $option                  The current option object.
		 * @param WC_Product    $product                 The current product object.
		 */
		return apply_filters( 'wc_product_options_is_update_main_image_enabled', $show_in_product_gallery, $this, $this->get_product() );
	}


	/**
	 * Get the field conditional logic config.
	 *
	 * @return object|null
	 */
	public function get_conditional_logic_config(): ?object {
		if ( ! $this->has_conditional_logic ) {
			return null;
		}

		return (object) $this->option->conditional_logic;
	}

	/**
	 * Get the field type.
	 *
	 * @return string
	 */
	public function get_type(): string {
		return $this->option->type;
	}

	/**
	 * Get the field id.
	 *
	 * @return string
	 */
	public function get_id(): string {
		return $this->option->id;
	}

	/**
	 * Get the product for the field.
	 *
	 * @return WC_Product
	 */
	public function get_product(): WC_Product {
		return $this->product;
	}

	/**
	 * Whether the field has a user inputted value.
	 *
	 * @return bool
	 */
	public function has_user_value(): bool {
		return $this->has_user_value;
	}

	/**
	 * Whether the field has conditional logic.
	 *
	 * @return bool
	 */
	public function has_conditional_logic(): bool {
		return $this->has_conditional_logic;
	}

	/**
	 * Whether the field stores multiple values.
	 *
	 * @return bool
	 */
	public function stores_multiple_values(): bool {
		return $this->stores_multiple_values;
	}

	/**
	 * Whether the field is required.
	 *
	 * @return boolean
	 */
	public function is_required() {
		return ! empty( $this->option->required );
	}

	/**
	 * Determines whether the option is a variation attribute type option.
	 *
	 * @return boolean
	 */
	public function is_variation_attribute_type_option() {
		if ( ! isset( $this->option->settings['choice_type'] ) || ! isset( $this->option->settings['selected_attribute'] ) ) {
			return false;
		}

		return $this->option->settings['choice_type'] === 'variation_attributes' && ! empty( $this->option->settings['selected_attribute'] );
	}

	/**
	 * Determmine whether the selected attribute should be displayed in the product page.
	 *
	 * @return ?string
	 */
	public function is_valid_attribute_option_for_product() {
		if ( ! $this->is_variation_attribute_type_option() ) {
			return null;
		}

		if ( ! $this->product instanceof WC_Product_Variable ) {
			return null;
		}

		$global_attributes = $this->get_global_attributes();

		if ( empty( $global_attributes ) ) {
			return null;
		}

		$selected_attribute    = $this->option->settings['selected_attribute'];
		$global_attribute_keys = array_keys( $global_attributes );

		if ( empty( $selected_attribute ) || ! in_array( $selected_attribute, $global_attribute_keys, true ) ) {
			return null;
		}

		return $selected_attribute;
	}

	/**
	 * Retrieves the global attributes for the product variation.
	 *
	 * @return null|array
	 */
	protected function get_global_attributes(): ?array {
		if ( ! $this->is_variation_attribute_type_option() ) {
			return null;
		}

		if ( ! $this->product instanceof WC_Product_Variable ) {
			return null;
		}

		$variation_attributes = $this->product->get_variation_attributes();

		$global_attributes = array_filter(
			$variation_attributes,
			function ( $attribute_name ) {
				return strpos( $attribute_name, 'pa_' ) === 0;
			},
			ARRAY_FILTER_USE_KEY
		);

		if ( empty( $global_attributes ) ) {
			return null;
		}

		return $global_attributes;
	}

	/**
	 * Determine whether the choice is preselected.
	 *
	 * @param array $choice
	 * @return bool
	 */
	protected function is_choice_preselected( $choice ): bool {
		if ( $this->is_variation_attribute_type_option() ) {
			// the choice is a term of a product attribute, check if it is the default choice.
			$default_attributes = $this->product->get_default_attributes();
			$default_term       = $default_attributes[ $this->option->settings['selected_attribute'] ] ?? null;

			// An attribute term is preselected if it is the default term for the product
			// or if the choice is selected in the product options configuration and no default term is selected for the product.
			// The default term of a product has higher priority than the selected choice.
			// This avoids that an attributes has two selected choices, which is not allowed.
			return ( ! $default_term && (bool) $choice['selected'] ) || $choice['term'] === $default_term;
		}

		// if choices are from product attributes, check if the term is a default choice.
		return (bool) $choice['selected'] ?? false;
	}

	/**
	 * Gets the edit option link for the field.
	 *
	 * @return string
	 */
	private function get_edit_option_link() {
		$edit_link = sprintf(
			admin_url( 'admin.php?post_type=products&page=wpo_options#edit/%d/%d' ),
			$this->option->group_id,
			$this->option->id
		);

		return sprintf(
			'<a href="%s" class="wpo-edit-option-link" rel="noopener noreferrer">%s</a>',
			esc_url( $edit_link ),
			'<span class="dashicons dashicons-edit" aria-label="Edit this option"></span> Edit'
		);
	}
}
