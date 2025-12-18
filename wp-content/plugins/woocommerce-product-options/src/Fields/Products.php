<?php
/**
 * Product field class.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @copyright Barn2 Media Ltd
 * @license   GPL-3.0
 */

namespace Barn2\Plugin\WC_Product_Options\Fields;

use WP_Error;
use Barn2\Plugin\WC_Product_Options\Util\Util;
use Barn2\Plugin\WC_Product_Options\Util\Conditional_Logic as Conditional_Logic_Util;

use function Barn2\Plugin\WC_Product_Options\wpo;

class Products extends Abstract_Field {

	protected $type        = 'product';
	private $default_width = 118;

	protected $used_settings = [
		'product_display_style',
		'display_label',
		'product_selection',
		'dynamic_products',
		'manual_products',
		'label_position',
		'button_width',
		'show_in_product_gallery',
	];

	protected $product_display_style = 'product';
	protected $display_label;
	protected $product_selection;
	protected $dynamic_products;
	protected $manual_products;
	protected $label_position;
	protected $button_width;
	protected $show_in_product_gallery;

	private $products = [];

	/**
	 * Render the HTML for the field.
	 */
	public function render(): void {
		add_action( "wc_product_options_after_{$this->option->type}_field", [ $this, 'add_button_width_css_variable' ] );

		$args = $this->get_product_type_args();

		// get the products object
		$this->products = wc_get_products( $args );

		if ( empty( $this->products ) ) {
			return;
		}

		$this->render_field_wrap_open();

		$this->render_option_name();
		$this->render_products();
		$this->render_description();

		$this->render_field_wrap_close();
	}

	/**
	 * {@inheritDoc}
	 */
	protected function render_option_name(): void {
		if ( $this->option->display_name ) {
			$name = apply_filters( 'wc_product_options_get_output_string', $this->option->name, $this->option, 'option_name' );

			printf(
				'<p class="wpo-option-name">%1$s%2$s</p>',
				esc_html( $name ),
				 // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				$this->get_required_symbol()
			);
		}
	}


	/**
	 * Add a style element with the CSS variable for the button width right after the field.
	 */
	public function add_button_width_css_variable(): void {
		if ( $this->product_display_style !== 'image_buttons' ) {
			return;
		}

		printf(
			'<style>div[data-group-id="%1$d"][data-option-id="%2$d"] .wpo-image-buttons{--wpo-image-buttons-width: %3$dpx;}</style>',
			esc_attr( $this->option->group_id ),
			esc_attr( $this->option->id ),
			esc_attr( $this->get_button_width() )
		);
	}

	/**
	 * Gets the data attributes to handle conditional logic visibilities.
	 *
	 * @return string
	 */
	protected function get_field_attributes(): string {
		$attributes = [
			'data-parent-type' => $this->type,
			'data-type'        => $this->product_display_style,
			'data-group-id'    => $this->option->group_id,
			'data-option-id'   => $this->option->id,
			'data-clogic'      => $this->has_conditional_logic ? 'true' : 'false',
			'data-pricing'     => 'true',
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

		if ( $this->stores_multiple_values() && $this->choice_qty ) {
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

		$attribute_string = Util::get_html_attribute_string( $attributes );

		return $attribute_string;
	}

	/**
	 * Render the HTML for the field input.
	 */
	private function render_products() {
		$single_product_service = wpo()->get_service( 'handlers/single_product' );

		if ( $single_product_service instanceof \Barn2\Plugin\WC_Product_Options\Handlers\Single_Product ) {
			remove_filter( 'woocommerce_get_price_html', [ $single_product_service, 'add_suffix_to_price_html' ], 1000 );
		}

		$this->render_products_html_based_on_style();

		if ( $single_product_service instanceof \Barn2\Plugin\WC_Product_Options\Handlers\Single_Product ) {
			add_filter( 'woocommerce_get_price_html', [ $single_product_service, 'add_suffix_to_price_html' ], 1000, 2 );
		}
	}

	/**
	 * Render the HTML for products based on the style.
	 */
	protected function render_products_html_based_on_style() {
		switch ( $this->product_display_style ) {
			case 'product':
				$this->render_product_style_html();
				break;
			case 'checkbox':
				$this->render_checkboxes_style_html();
				break;
			case 'radio':
				$this->render_radios_style_html();
				break;
			case 'dropdown':
				$this->render_dropdowns_style_html();
				break;
			case 'image_buttons':
				$this->render_image_buttons_style_html();
				break;
			default:
				$this->render_product_style_html();
				break;
		}
	}

	/**
	 * Render the HTML for the product style.
	 */
	protected function render_product_style_html() {
		$hide_out_of_stock_products = get_option( 'woocommerce_hide_out_of_stock_items' );

		$html  = '<div class="wpo-option-products">';
		$html .= sprintf(
			'<table id="%1$s" class="%2$s">',
			esc_attr( $this->get_input_id() ),
			'wpo-products-list'
		);

		// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped

		ob_start();

		foreach ( $this->products as $product ) {
			// if product out of stock then return
			if ( ! $product->is_in_stock() && $hide_out_of_stock_products === 'yes' ) {
				continue;
			}

			// For variable products
			if ( $product->is_type( 'variable' ) ) {
				// display variable product
				echo $this->get_variable_product_style_product( $product );
			} else {
				// display simple products
				?>
			<tr class="wpo-product-option__list-product <?php echo ! $product->is_in_stock() ? 'wpo-product-out-of-stock' : ''; ?>">
			<!-- product thumbnail -->
				<td class="wpo-product-thumbnail">
					<a href="<?php echo get_permalink( $product->get_id() ); ?>" tabindex="0">
						<?php echo $product->get_image(); ?> 
					</a>
				</td>       
				<!-- product title -->
				<td class="wpo-product-name" data-title="Product">
					<a href="<?php echo get_permalink( $product->get_id() ); ?>" tabindex="0">
						<?php echo $product->get_title(); ?>
					</a>
				</td>
				<!-- product price -->
				<td class="wpo-product-price" data-title="Price"><?php echo $product->get_price_html(); ?></td>
				<td class="wpo-cart-button">
					<?php
						/**
						 * Filter the add to cart button text.
						 *
						 * @param string $add_to_cart_button_text The add to cart button text.
						 */
						$add_to_cart_button_text = \apply_filters( 'wpo_product_add_to_cart_url', __( 'Add to cart', 'woocommerce-product-options' ) );
						// Display the add to cart button
						printf(
							'<a href="%s" data-quantity="1" class="button product_type_simple single_add_to_cart_button add_to_cart_button ajax_add_to_cart wp-element-button">%s</a>',
							'?add-to-cart=' . $product->get_id(), // The add to cart url
							esc_html( $add_to_cart_button_text ) // The add to cart text for the product
						);
					?>
				</td>
			</tr>
				<?php
			}
		}

		// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped

		$html .= ob_get_clean();
		$html .= '</table>';
		$html .= '</div>';

		// phpcs:reason This is escaped above.
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped/
		echo $html;
	}

	/**
	 * Render products in checkbox styles
	 */
	protected function render_checkboxes_style_html() {
		$hide_out_of_stock_products = get_option( 'woocommerce_hide_out_of_stock_items' );

		$html = '<div class="wpo-checkboxes wpo-checkboxes-one-col">';
		foreach ( $this->products as $index => $product ) {
			if ( ! $product->is_in_stock() && $hide_out_of_stock_products == 'yes' ) {
				continue;
			}
			if ( $product->is_type( 'variable' ) ) {
				// display variable product
				$html .= $this->get_variable_product_style_checkbox( $product, $index );
			} else {
				$html .= sprintf(
					'<label class="wpo-checkbox" %7$s>
						<input type="checkbox" id="%1$s" name="%2$s[%3$s][]" value="%3$s" %8$s data-price-amount="%4$s" data-price-type="flat_fee" />
						<span class="wpo-checkbox-inner"></span>
						<div>
							%5$s
							%6$s
						</div>
					</label>',
					esc_attr( sprintf( '%1$s-%2$s', $this->get_input_id(), $index ) ),
					esc_attr( $this->get_input_name() ),
					esc_attr( $product->get_id() ),
					$product->get_price(),
					esc_html( $product->get_title() ),
					$product->get_price() ? sprintf( '<span class="wpo-price-container">(%s)</span>', $product->get_price_html() ) : '',
					! $product->is_in_stock() ? 'data-stock-out="true"' : '',
					disabled( ! $product->is_in_stock(), true, false )
				);
			}
		}

		$html .= '</div>';

		// phpcs:reason This is escaped above.
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped/
		echo $html;
	}

	/**
	 * Render products in radio styles
	 */
	protected function render_radios_style_html() {
		$hide_out_of_stock_products = get_option( 'woocommerce_hide_out_of_stock_items' );

		$html = '<div class="wpo-radios wpo-radios-one-col">';

		foreach ( $this->products as $index => $product ) {
			if ( ! $product->is_in_stock() && $hide_out_of_stock_products == 'yes' ) {
				continue;
			}
			if ( $product->is_type( 'variable' ) ) {
				// display variable product
				$html .= $this->get_variable_product_style_radio( $product, $index );
			} else {
				$html .= sprintf(
					'<label class="wpo-radio" %7$s>
						<input type="radio" id="%1$s" name="%2$s[%3$s][]" value="%3$s" %8$s data-price-amount="%4$s" data-price-type="flat_fee"/>
						<span class="wpo-radio-inner">
							<span class="wpo-radio-dot"></span>
						</span>
						<div>
							%5$s
							%6$s
						</div>
					</label>',
					esc_attr( sprintf( '%1$s-%2$s', $this->get_input_id(), $index ) ),
					esc_attr( $this->get_input_name() ),
					esc_attr( $product->get_id() ),
					$product->get_price(),
					esc_html( $product->get_title() ),
					$product->get_price() ? sprintf( '<span class="wpo-price-container">(%s)</span>', $product->get_price_html() ) : '',
					! $product->is_in_stock() ? 'data-stock-out="true"' : '',
					disabled( ! $product->is_in_stock(), true, false )
				);
			}
			?>
			<?php
		}

		$html .= '</div>';

		// phpcs:reason This is escaped above.
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped/
		echo $html;
	}

	/**
	 * Render products in dropdown styles
	 */
	protected function render_dropdowns_style_html() {
		$hide_out_of_stock_products = get_option( 'woocommerce_hide_out_of_stock_items' );

		$html  = '<div class="wpo-field-dropdown">';
		$html .= sprintf(
			'<select id="%1$s" name="%2$s" placeholder="%3$s">',
			esc_attr( $this->get_input_id() ),
			esc_attr( $this->get_input_name() ),
			esc_attr__( 'Select a product', 'woocommerce-product-options' )
		);

		$html .= sprintf( '<option value="">%s</option>', esc_html__( 'Select a product', 'woocommerce-product-options' ) );

		foreach ( $this->products as $index => $product ) {
			if ( ! $product->is_in_stock() && $hide_out_of_stock_products == 'yes' ) {
				continue;
			}
			if ( $product->is_type( 'variable' ) ) {
				$variations                         = $product->get_children();
				$manual_selected_product_variations = $this->get_manually_selected_product_variations( $product->get_id() );
				foreach ( $variations as $variation_id ) :
					if ( ! in_array( $variation_id, $manual_selected_product_variations, true ) ) {
						continue;
					}

					$variation = wc_get_product( $variation_id );
					$choice    = [
						'pricing'    => $variation->get_price(),
						'price_type' => 'flat_fee',
					];

					$variation_name = sprintf( '%1$s <span class="description">%2$s</span>', $variation->get_name(), wc_get_formatted_variation( $variation, true, false, true ) );
					$pricing        = $variation_name . ( $variation->get_price() ? sprintf( ' <span class="wpo-price-container">(%s)</span>', $variation->get_price_html() ) : '' );
					$data_display   = $pricing !== wp_strip_all_tags( $pricing ) ? 'data-display="' . esc_attr( $pricing ) . '"' : '';		

					$html .= sprintf(
						'<option value="%1$s" %4$s %5$s data-product_id="%6$s" data-variation_id="%7$s" %8$s>%2$s%3$s</option>',
						esc_attr( $product->get_id() . ',' . $variation_id ),
						$variation_name,
						$variation->get_price() ? sprintf( ' (%s)', $variation->get_price_html() ) : '',
						disabled( ! $variation->is_in_stock(), true, false ),
						$this->get_choice_pricing_attributes( $choice ),
						$product->get_id(),
						$variation_id,
						$data_display
					);
				endforeach;
			} else {
				$choice = [
					'pricing'    => $product->get_price(),
					'price_type' => 'flat_fee',
				];

				$pricing      = $product->get_name() . ( $product->get_price() ? sprintf( ' <span class="wpo-price-container">(%s)</span>', $product->get_price_html() ) : '' );
				$data_display = $pricing !== wp_strip_all_tags( $pricing ) ? 'data-display="' . esc_attr( $pricing ) . '"' : '';

				$html .= sprintf(
					'<option value="%1$s" %4$s %5$s %6$s>%2$s%3$s</option>',
					esc_attr( $product->get_id() . ',' . $product->get_id() ),
					esc_html( $product->get_title() ),
					$product->get_price() ? sprintf( ' (%s)', $product->get_price_html() ) : '',
					disabled( ! $product->is_in_stock(), true, false ),
					$this->get_choice_pricing_attributes( $choice ),
					$data_display
				);
			}
		}

		$html .= '</select>';
		$html .= '</div>';

		// phpcs:reason This is escaped above.
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped/
		echo $html;
	}

	/**
	 * Render products in image buttons styles
	 */
	protected function render_image_buttons_style_html() {
		$hide_out_of_stock_products = get_option( 'woocommerce_hide_out_of_stock_items' );

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

		foreach ( $this->products as $product ) {
			if ( ! $product->is_in_stock() && $hide_out_of_stock_products == 'yes' ) {
				continue;
			}
			if ( $product->is_type( 'variable' ) ) {
				// display variable product
				$html .= $this->get_variable_product_style_image( $product );
			} else {
				$caption = $this->get_figcaption( $product );
				$html   .= sprintf(
					'<label class="wpo-image-button" %9$s %11$s>
						<input type="checkbox" id="%1$s" name="%2$s[%3$s][]" value="%3$s" %10$s data-price-amount="%6$s" data-price-type="flat_fee">
						<figure class="%8$s">
							<div class="wpo-image-active">%7$s</div>
							%4$s
							%5$s
						</figure>
					</label>',
					esc_attr( $this->get_input_id() ),
					esc_attr( $this->get_input_name() ),
					esc_attr( $product->get_id() ),
					$product->get_image(),
					$caption,
					$product->get_price(),
					$this->get_deselect_svg(),
					$this->get_image_wrap_class(),
					! $product->is_in_stock() ? 'data-stock-out="true"' : '',
					disabled( ! $product->is_in_stock(), true, false ),
					$this->get_image_data( $product->get_image_id() )
				);
			}
		}

		$html .= '</div>';

		// phpcs:reason This is escaped above.
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped/
		echo $html;
	}

	/**
	 * Display variations as indidivual products and allow them to directly add to cart
	 *
	 * @param  WC_Product $product
	 * @return string
	 */
	public function get_variable_product_style_product( $product ) {
		$variations                         = $product->get_children();
		$manual_selected_product_variations = $this->get_manually_selected_product_variations( $product->get_id() );

		ob_start();

		foreach ( $variations as $variation_id ) {
			if ( ! in_array( $variation_id, $manual_selected_product_variations, true ) ) {
				continue;
			}

			$variation = wc_get_product( $variation_id );

			?>
			<tr class="wpo-product-option__list-product <?php echo $variation->is_in_stock() ? '' : 'wpo-product-out-of-stock'; ?>">
			<!-- product thumbnail -->
				<td class="wpo-product-thumbnail">
					<a href="<?php echo get_permalink( $product->get_id() ); ?>" tabindex="0">
						<?php echo $variation->get_image(); ?>
					</a>
				</td>       
				<!-- product title -->
				<td class="wpo-product-name" data-title="Product">
					<a href="<?php echo get_permalink( $variation->get_id() ); ?>" tabindex="0">
						<?php echo $variation->get_name(); ?>
					</a>
				</td>
				<!-- product price -->
				<td class="wpo-product-price" data-title="Price"><?php echo $variation->get_price_html(); ?></td>
				<td class="wpo-cart-button">
					<?php
						$add_to_cart_button_text = \apply_filters( 'wpo_product_add_to_cart_url', __( 'Add to cart', 'woocommerce-product-options' ) );
						// Display the add to cart button
						printf(
							'<a href="%s" data-quantity="1" class="button product_type_simple single_add_to_cart_button add_to_cart_button ajax_add_to_cart wp-element-button">%s</a>',
							esc_url( $variation->add_to_cart_url() ),
							esc_html( $add_to_cart_button_text ) // The add to cart text for the product
						);
					?>
				</td>
			</tr>
			<?php

		}

		return ob_get_clean();
	}

	/**
	 * Return the variation products as checkboxes and allow them to add to cart from the product page
	 *
	 * @param WC_Product $product
	 * @return string
	 */
	public function get_variable_product_style_checkbox( $product, $product_index ) {
		$variations                         = $product->get_children();
		$manual_selected_product_variations = $this->get_manually_selected_product_variations( $product->get_id() );

		$html = '';

		foreach ( $variations as $variation_id ) {
			if ( ! in_array( $variation_id, $manual_selected_product_variations, true ) ) {
				continue;
			}

			$variation = wc_get_product( $variation_id );

			$html .= sprintf(
				'<label class="wpo-checkbox" %8$s>
					<input type="checkbox" id="%1$s" name="%2$s[%3$s][]" value="%4$s" %9$s data-price-amount="%5$s" data-price-type="flat_fee" />
					<span class="wpo-checkbox-inner"></span>
					<div>
						%6$s
						%7$s
					</div>
				</label>',
				esc_attr( sprintf( '%1$s-%2$s', $this->get_input_id(), $product_index ) ),
				esc_attr( $this->get_input_name() ),
				esc_attr( $product->get_id() ),
				esc_attr( $variation_id ),
				$variation->get_price(),
				sprintf( '%1$s <span class="description">%2$s</span>', $variation->get_name(), wc_get_formatted_variation( $variation, true, false, true ) ),
				$variation->get_price() ? sprintf( ' <span class="wpo-price-container">(%s)</span>', $variation->get_price_html() ) : '',
				! $product->is_in_stock() ? 'data-stock-out="true"' : '',
				disabled( ! $product->is_in_stock(), true, false )
			);
		}

		return $html;
	}

	/**
	 * Return the variation products as radio buttons and allow them to add to cart from the product page
	 *
	 * @param WC_Product $product
	 * @param int $product_index The index of the item in the list of radio buttons
	 *
	 * @return string
	 */
	public function get_variable_product_style_radio( $product, $product_index ) {
		$variations                         = $product->get_children();
		$manual_selected_product_variations = $this->get_manually_selected_product_variations( $product->get_id() );

		$html = '';

		foreach ( $variations as $variation_id ) {
			if ( ! in_array( $variation_id, $manual_selected_product_variations, true ) ) {
				continue;
			}

			$variation = wc_get_product( $variation_id );

			$html .= sprintf(
				'<label class="wpo-radio" %8$s>
					<input type="radio" id="%1$s" name="%2$s[%3$s][]" value="%4$s" %9$s data-price-amount="%5$s" data-price-type="flat_fee"/>
					<span class="wpo-radio-inner">
						<span class="wpo-radio-dot"></span>
					</span>
					<div>
						%6$s
						%7$s
					</div>
				</label>',
				esc_attr( sprintf( '%1$s-%2$s', $this->get_input_id(), $product_index ) ),
				esc_attr( $this->get_input_name() ),
				esc_attr( $product->get_id() ),
				esc_attr( $variation_id ),
				$variation->get_price(),
				sprintf( '%1$s <span class="description">%2$s</span>', $variation->get_name(), wc_get_formatted_variation( $variation, true, false, true ) ),
				$variation->get_price() ? sprintf( ' <span class="wpo-price-container">(%s)</span>', $variation->get_price_html() ) : '',
				! $product->is_in_stock() ? 'data-stock-out="true"' : '',
				disabled( ! $product->is_in_stock(), true, false )
			);

		}

		return $html;
	}

	/**
	 * Return the variation products as image buttons and allow them to add to cart from the product page
	 *
	 * @param WC_Product $product
	 *
	 * @return string
	 */
	public function get_variable_product_style_image( $product ) {
		$variations                         = $product->get_children();
		$manual_selected_product_variations = $this->get_manually_selected_product_variations( $product->get_id() );

		$html = '';

		foreach ( $variations as $variation_id ) {
			if ( ! in_array( $variation_id, $manual_selected_product_variations, true ) ) {
				continue;
			}

			$variation = wc_get_product( $variation_id );
			$caption   = $this->get_figcaption( $variation );

			$html .= sprintf(
				'<label class="wpo-image-button" %10$s %12$s>
					<input type="checkbox" id="%1$s" name="%2$s[%3$s][]" value="%4$s" %11$s data-price-amount="%7$s" data-price-type="flat_fee">
					<figure class="%9$s">
						<div class="wpo-image-active">%8$s</div>
						%5$s
						%6$s
					</figure>
				</label>',
				esc_attr( $this->get_input_id() ),
				esc_attr( $this->get_input_name() ),
				esc_attr( $product->get_id() ),
				esc_attr( $variation_id ),
				$variation->get_image(),
				$caption,
				$variation->get_price(),
				$this->get_deselect_svg(),
				$this->get_image_wrap_class(),
				! $variation->is_in_stock() ? 'data-stock-out="true"' : '',
				disabled( ! $variation->is_in_stock(), true, false ),
				$this->get_image_data( $variation->get_image_id() )
			);
		}

		return $html;
	}

	/**
	 * {@inheritdoc}
	 */
	public function sanitize( $value ) {
		if ( is_array( $value ) ) {
			$products = [];

			if ( is_string( $value['product_ids'] ) ) {
				$value['product_ids'] = explode( ',', $value['product_ids'] );
			}

			foreach ( $value['product_ids'] as $product_ids ) {
				if ( is_string( $product_ids ) ) {
					$product_ids = explode( ',', $product_ids );
				}

				$products = array_merge( $products, array_map( 'absint', $product_ids ) );
			}

			return array_unique( $products );
		}

		return sanitize_text_field( $value );
	}



	/**
	 * Get product variations that were manually selected in the backend options
	 *
	 * @param int   $product_id
	 *
	 * @return array
	 */
	public function get_manually_selected_product_variations( $product_id ) {
		$manual_product      = array_values(
			array_filter(
				(array) $this->manual_products,
				function ( $variable_product ) use ( $product_id ) {
					return $variable_product['product_id'] === $product_id;
				}
			)
		);
		$selected_variations = $manual_product[0]['variations'] ?? [];

		/**
		 * If no variations are selected, return an empty array
		 * This is to prevent variations with undefined attributes from being added to the cart.
		 */

		if ( empty( $selected_variations ) ) {
			$manual_product_object = wc_get_product( $manual_product[0]['product_id'] ?? 0 );

			if ( is_a( $manual_product_object, 'WC_Product_Variable' ) ) {
				foreach ( $manual_product_object->get_children() as $variation_id ) {
					$variation            = wc_get_product( $variation_id );
					$variation_attributes = array_filter(
						$variation->get_attributes(),
						function ( $attribute ) {
							return $attribute !== '';
						}
					);

					// If every variation attribute is defined, add the variation to the selected variations
					if ( empty( $variation_attributes ) ) {
						$selected_variations[] = [
							'id' => $variation_id,
						];
					}
				}
			}
		}

		return array_column( $selected_variations, 'id' );
	}

	/**
	 * Validate the product options and add to cart
	 *
	 * @param array $value
	 * @param array $option_data
	 * @return bool|WP_Error
	 */
	public function validate( $value, $option_data ) {
		$products = $value['product_ids'] ?? '';

		if ( empty( $products ) ) {
			$products = $value;
		}

		if ( is_string( $products ) && ! empty( $products ) ) {
			// products is scalar (only from dropdown style)
			// so we need to convert it to array like all the other styles
			$products = array_map( 'intval', explode( ',', $products ) );
			$products = [
				$products[0] => [ $products[1] ?? 0 ],
			];
		}

		if ( is_array( $products ) ) {
			$products = array_filter( $products );
		}

		if ( ! empty( $products ) ) {
			$item_data_handler = wpo()->get_service( 'handlers/item_data' );
			remove_filter( 'woocommerce_add_cart_item_data', [ $item_data_handler, 'add_cart_item_data' ], 10 );

			$is_associative_array = array_keys( $products ) !== range( 0, count( $products ) - 1 );

			foreach ( $products as $product_id => $variation_ids ) {
				// get the WC product object
				if ( ! $is_associative_array ) {
					$variation_ids = [ $variation_ids ];
				}

				foreach ( $variation_ids as $variation_id ) {
					$variation  = wc_get_product( $variation_id );
					$product_id = $variation ? $variation->get_parent_id() : 0;

					if ( ! $product_id && $variation ) {
						$product_id   = $variation_id;
						$variation_id = 0;
					}

					if ( ! $product_id ) {
						return new WP_Error( 'wpo-validation-error', esc_html__( 'The selected product is not valid.', 'woocommerce-product-options' ) );
					}

					$product = $variation_id ? wc_get_product( $variation_id ) : wc_get_product( $product_id );

					if ( ! $product ) {
						return new WP_Error( 'wpo-validation-error', esc_html__( 'The selected product is not valid.', 'woocommerce-product-options' ) );
					}

					if ( $product->is_purchasable() ) {
						if ( ! WC()->cart->add_to_cart( $product_id, 1, (int) $variation_id ) ) {
							return false;
						}
					}
				}
			}

			add_filter( 'woocommerce_add_cart_item_data', [ $item_data_handler, 'add_cart_item_data' ], 10, 4 );
		}

		return true;
	}

	/**
	 * Gets the name attribute for the field input.
	 *
	 * @return string
	 */
	protected function get_input_name(): string {
		return sprintf( 'wpo-option[option-%d][product_ids]', $this->option->id );
	}

	/**
	 * Get the class for the image wrap.
	 *
	 * @return string The class.
	 */
	private function get_image_wrap_class(): string {
		$class = 'wpo-image-wrap';

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
	 * Build product query args for product option type
	 *
	 * @return array $args
	 */
	public function get_product_type_args() {
		$product = $this->get_product();
		$args    = [];

		if ( $this->product_selection === 'dynamic' ) {
			// for dynamic products
			$orderby    = $this->get_product_orderby_arg_value( $this->dynamic_products['sort'] );
			$order      = $this->get_product_order_arg_value( $this->dynamic_products['sort'] );
			$categories = wp_list_pluck( (array) $this->dynamic_products['categories'], 'category_slug' );

			$args = [
				'exclude'     => [ $product->get_id() ],
				'type'        => 'simple',
				'orderby'     => $orderby,
				'order'       => $order,
				'limit'       => $this->dynamic_products['limit'] ?: get_option( 'posts_per_page' ),
				'category'    => $categories,
				'post_status' => 'publish',
			];

			if ( ! in_array( $orderby, [ 'title', 'date' ], true ) ) {
				$sorting = [
					'price'      => '_price',
					'rating'     => '_wc_average_rating',
					'popularity' => 'total_sales',
				];
				$args['orderby']  = 'meta_value_num';
				$args['meta_key'] = $sorting[ $orderby ];
			}
		} else {
			// for manually selected products
			$products_list = wp_list_pluck( $this->manual_products, 'product_id' );
			$products_list = array_diff( $products_list, [ $product->get_id() ] );

			$args = [
				'include'     => $products_list,
				'orderby'     => 'include',
				'post_status' => 'publish',
				'limit'       => count( $products_list ),
			];
		}

		return $args;
	}

	/**
	 * Get product orderby arg value
	 *
	 * @param string $sorting
	 *
	 * @return string
	 */
	public function get_product_orderby_arg_value( $sorting ) {
		return str_replace( [ 'asc', 'desc', '_' ], '', $sorting );
	}

	/**
	 * Get product orderby arg value
	 *
	 * @param string $string
	 *
	 * @return string
	 */
	public function get_product_order_arg_value( $sorting ) {
		$order = 'asc';

		if ( str_contains( $sorting, 'desc' ) ) {
			$order = 'desc';
		}

		return strtoupper( $order );
	}

	private function get_figcaption( $product ) {
		$product_name = is_a( $product, 'WC_Product_Variation' ) ? sprintf( '%1$s <span class="description">%2$s</span>', $product->get_name(), wc_get_formatted_variation( $product, true, false, true ) ) : $product->get_name();
		$label        = $this->display_label ? $product_name : '';
		$label        = $label ? sprintf( '<span class="wpo-image-label">%s</span>', $label ) : '';
		$price        = $product->get_price() ? sprintf( '<span class="price wpo-price-container">%s</span>', $product->get_price_html() ) : '';

		if ( empty( $label ) && empty( $price ) ) {
			return '';
		}

		return sprintf(
			'<figcaption class="wpo-image-text">
				%1$s
				%2$s
			</figcaption>',
			$label,
			$price
		);
	}

	/**
	 * Whether the option has the "Update main image" setting enabled.
	 *
	 * @since 1.6.4
	 * @return bool
	 */
	private function is_update_main_image_enabled() {
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
		 * 	       return true;
		 *     }
		 * 
		 *     return $is_enabled;
		 * }
		 * ```
		 *
		 * @param Image_Buttons $option The current option object.
		 * @param WC_Product $product The current product object.
		 */
		return apply_filters( 'wc_product_options_is_update_main_image_enabled', ! ! $this->show_in_product_gallery, $this, $this->get_product() );
	}

	/**
	 * {@inheritDoc}
	 */
	public function stores_multiple_values(): bool {
		return in_array( $this->product_display_style, [ 'checkbox', 'image_buttons' ], true );
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

	/**
	 * Whether the field is required.
	 *
	 * @return boolean
	 */
	public function is_required() {
		return parent::is_required() && $this->product_display_style !== 'product';
	}

	// /**
	//  * Retrieves the cart item data for the selected value(s) of the field.
	//  *
	//  * @param mixed       $value
	//  * @param WC_Product $product
	//  * @param int $quantity
	//  * @param array $options
	//  * @return array
	//  */
	// public function get_cart_item_data( $value, $product, $quantity, $options ): ?array {
	// 	if ( Conditional_Logic_Util::is_field_hidden( $this, $options ) ) {
	// 		return null;
	// 	}

	// 	$product_list = $this->get_products_item_data( $options );
	// 	$item_data    = [
	// 		'name'        => $this->option->name,
	// 		'type'        => $this->option->type,
	// 		'option_id'   => $this->option->id,
	// 		'group_id'    => $this->option->group_id,
	// 		'value'       => $product_list,
	// 		'choice_data' => [
	// 			[
	// 				'label' => $product_list,
	// 				'value' => $product_list,
	// 			],
	// 		],
	// 	];

	// 	return $item_data;
	// }

	// private function get_products_item_data( $options ) {
	// 	$products = $options[ 'option-' . $this->get_id() ]['product_ids'] ?? [];

	// 	if ( is_string( $products ) ) {
	// 		$products = explode( ',', $products );
	// 		$products = [
	// 			$products[0] => [ $products[1] ?? 0 ],
	// 		];
	// 	}

	// 	// flatten the array of products with array_reduce
	// 	$products = array_reduce(
	// 		$products,
	// 		function ( $carry, $item ) {
	// 			return array_merge( $carry, $item );
	// 		},
	// 		[]
	// 	);

	// 	// get a pipe-separated list of product names as anchor tags linking to the product pages
	// 	$product_names = array_map(
	// 		function ( $product_id ) {
	// 			$product = wc_get_product( $product_id );

	// 			return $product ? sprintf( '<a href="%s">%s</a>', esc_url( $product->get_permalink() ), esc_html( $product->get_name() ) ) : null;
	// 		},
	// 		$products
	// 	);

	// 	return sprintf( '<ul class="wpo-products-item-data"><li>%s</li></ul>', implode( '</li><li>', array_filter( $product_names ) ) );
	// }
}
