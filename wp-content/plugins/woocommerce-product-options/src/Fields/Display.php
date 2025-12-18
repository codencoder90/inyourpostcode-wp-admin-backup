<?php
namespace Barn2\Plugin\WC_Product_Options\Fields;

/**
 * Display field class. Used for WYSIWYG and HTML fields.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Display extends Abstract_Field {

	protected $type = 'display';

	/**
	 * {@inheritDoc}
	 */
	protected $is_display_field = true;

	/**
	 * {@inheritDoc}
	 */
	protected $used_settings = [ 'html' ];

	/**
	 * The html setting.
	 *
	 * @var string
	 */
	protected $html;

	/**
	 * Render the HTML for the field.
	 */
	public function render(): void {
		if ( ! $this->has_display_prerequisites() ) {
			return;
		}

		$this->render_field_wrap_open();

		$this->render_html();

		$this->render_field_wrap_close();
	}

	/**
	 * Render the HTML for the field checkboxes.
	 */
	private function render_html(): void {
		if ( ! $this->html ) {
			return;
		}

		$html = apply_filters( 'wc_product_options_get_output_string', $this->convert_rgbs_hex( $this->html ), $this->option, 'option_content' );

		echo do_shortcode( html_entity_decode( wp_kses_post( $html ) ) );
	}

	/**
	 * Converts all RGB fields in a string to HEX values.
	 *
	 * The `wp_kses_post` function doesn't support RGB values for inline styles so we need to convert them to hex.
	 * https://core.trac.wordpress.org/ticket/24157
	 *
	 * @param string $html The HTML to convert.
	 * @return string $replaced_html The converted HTML.
	 */
	private function convert_rgbs_hex( string $html ): string {
		$replaced_html = preg_replace_callback(
			// Regex that matches "rgb("#,#,#");" and gets the #,#,#
			'/rgb\((.*?)\);/',
			function( $matches ) {
				// Explode the match (0,0,0 for example) into an array
				$colors = explode( ',', $matches[1] );

				// Use sprintf for the conversion
				$match = sprintf( '#%02x%02x%02x;', $colors[0], $colors[1], $colors[2] );

				return $match;
			},
			$html
		);

		return $replaced_html;
	}
}
