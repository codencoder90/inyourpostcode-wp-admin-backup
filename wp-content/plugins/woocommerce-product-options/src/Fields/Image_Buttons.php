<?php
namespace Barn2\Plugin\WC_Product_Options\Fields;

use WC_Product;

/**
 * Radios field class.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Image_Buttons extends Checkboxes {

	protected $type        = 'image_buttons';
	private $default_width = 118;

	/**
	 * Whether the field supports multiple values (e.g checkboxes).
	 *
	 * @var bool
	 */
	protected $stores_multiple_values = true;

	protected $used_settings = [
		'label_position',
		'display_label',
		'button_width',
		'show_in_product_gallery',
	];

	protected $label_position;
	protected $display_label;
	protected $is_any_image_missing;
	protected $button_width;

	/**
	 * Render the HTML for the field.
	 */
	public function render(): void {
		if ( ! $this->has_display_prerequisites() ) {
			return;
		}

		$this->render_field_wrap_open();

		$this->render_option_name();
		$this->render_image_buttons();
		$this->render_description();

		$this->render_field_wrap_close();
	}

	/**
	 * {@inheritDoc}
	 */
	protected function render_field_wrap_close(): void {
		printf(
			'<style>div[data-group-id="%1$d"][data-option-id="%2$d"] .wpo-image-buttons{--wpo-image-buttons-width: %3$dpx;}</style></div>',
			esc_attr( $this->option->group_id ),
			esc_attr( $this->option->id ),
			esc_attr( $this->get_button_width() )
		);
	}


	/**
	 * Render the HTML for the field checkboxes.
	 */
	private function render_image_buttons(): void {
		$this->is_any_image_missing = array_reduce(
			$this->get_choices(),
			function ( $carry, $choice ) {
				return $carry || ! isset( $choice['media'] );
			},
			false
		);

		if ( $this->is_any_image_missing && ! $this->display_label ) {
			$this->label_position = 'below';
		}

		if ( ! $this->display_label ) {
			$this->label_position = 'below';
		}

		$html = sprintf(
			'<div class="wpo-image-buttons %s">',
			sprintf(
				'wpo-image-buttons-%s',
				$this->label_position ?? 'full'
			)
		);

		foreach ( $this->get_choices() as $index => $choice ) {

			if ( ! isset( $choice['media'] ) ) {
				$choice['media'] = get_option( 'woocommerce_placeholder_image', 0 );
			}

			$caption = $this->get_figcaption( $index );

			$choice['index'] = $index;
			$html           .= sprintf(
				'<label class="wpo-image-button" title="%6$s" aria-label="%14$s" %12$s>
					<input type="checkbox" id="%1$s" name="%2$s[]" value="%3$s" %4$s %7$s data-formula-value="%15$s">
					<figure class="%9$s">
						<div class="wpo-image-active">%8$s</div>
						<img src="%5$s" srcset="%10$s" sizes="%11$s" loading="lazy" alt="" />
						%13$s
					</figure>
				</label>',
				esc_attr( sprintf( '%1$s-%2$s', $this->get_input_id(), $index ) ),
				esc_attr( $this->get_input_name() ),
				esc_attr( $choice['id'] ),
				checked( $this->is_choice_preselected( $choice ), true, false ),
				$this->get_image_thumbnail_url( $choice['media'], 'thumbnail' ),
				preg_replace( '/\s+/', ' ', wp_strip_all_tags( $caption ) ),
				$this->get_choice_pricing_attributes( $choice ),
				$this->get_deselect_svg(),
				$this->get_image_wrap_class( $choice ),
				$this->get_image_srcset( $choice['media'], [ 118, 118 ] ),
				$this->get_attachment_image_sizes( $choice['media'], $this->get_button_width() ),
				$this->get_image_data( $choice['media'] ),
				$caption,
				esc_attr( $this->get_label( $index, true ) ),
				esc_attr( $this->get_choice_formula_value( $index ) )
			);
		}

		$html .= '</div>';

		// phpcs:reason This is escaped above.
        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $html;
	}

	/**
	 * Return the HTML markup of the figcaption element for the image button.
	 *
	 * @param  string $index
	 * @return string
	 */
	private function get_figcaption( $index ) {
		$empty_placeholder = '&nbsp;';
		$display_label     = $this->display_label || $this->is_any_image_missing;

		if ( ! $display_label && $this->label_position === 'below' ) {
			$empty_placeholder = '';
		}

		$choice = $this->option->choices[ $index ];
		$label  = $display_label || $this->is_any_image_missing ? esc_attr( $this->get_label( $index ) ) : '';
		$label  = $label ? sprintf( '<span class="wpo-image-label">%1$s</span>', esc_html( $label ) ) : $empty_placeholder;
		$price  = $this->get_choice_pricing_string( $choice, ! $display_label ) ?: $empty_placeholder;

		return sprintf(
			'<figcaption class="wpo-image-text">
				%1$s
				%2$s
			</figcaption>',
			$label,
			$this->equal_pricing ? '' : $price
		);
	}

	/**
	 * Get the class for the image wrap.
	 *
	 * @param array $choice The choice.
	 * @return string The class.
	 */
	private function get_image_wrap_class( $choice ): string {
		$class         = 'wpo-image-wrap';
		$display_label = $this->display_label || $this->is_any_image_missing;

		if ( isset( $choice['media'] ) && empty( $display_label ) && empty( $choice['pricing'] ) ) {
			$class .= ' no-label';
		}

		return esc_attr( $class );
	}

	/**
	 * SVG for deselecting an image button.
	 *
	 * @return string
	 */
	private function get_deselect_svg(): string {
		return '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M382-221.91 135.91-468l75.66-75.65L382-373.22l366.43-366.43L824.09-664 382-221.91Z"/></svg>';
	}

	/**
	 * Retreives the 'full' size image from WordPress.
	 *
	 * @param int $image_id
	 * @param string $size
	 *
	 * @return string
	 */
	private function get_image_thumbnail_url( $image_id, $size = 'full' ): string {
		if ( ! is_numeric( $image_id ) ) {
			return apply_filters( 'woocommerce_placeholder_image', wc_placeholder_img_src(), 'thumbnail' );
		}

		$image = wp_get_attachment_image_src( $image_id, $size );

		return $image[0] ?? apply_filters( 'woocommerce_placeholder_image', wc_placeholder_img_src(), 'thumbnail' );
	}

	/**
	 * Retreives the thumbnail used in the Woo gallery.
	 *
	 * @param int $image_id
	 * @return string
	 */
	private function get_woo_gallery_thumbnail_url( $image_id ): string {
		if ( ! is_numeric( $image_id ) ) {
			return '';
		}

		if ( ! $this->is_update_main_image_enable() ) {
			return '';
		}

		$gallery_thumbnail      = wc_get_image_size( 'gallery_thumbnail' );
		$gallery_thumbnail_size = apply_filters( 'woocommerce_gallery_thumbnail_size', [ $gallery_thumbnail['width'], $gallery_thumbnail['height'] ] );
		$image                  = wp_get_attachment_image_src( $image_id, $gallery_thumbnail_size );

		return $image[0];
	}

	/**
	 * Get the width of the image buttons.
	 *
	 * @since 1.6.4
	 * @return string
	 */
	private function get_button_width() {
		return esc_attr( $this->button_width ?: $this->default_width );
	}
}
