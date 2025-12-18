<?php

namespace Barn2\Plugin\WC_Product_Options\Util;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Util as Lib_Util;
use Barn2\Plugin\WC_Wholesale_Pro\Util as Wholesale_Util;
use Barn2\Plugin\WC_Product_Options\Fields\Price_Formula;
use Barn2\Plugin\WC_Product_Options\Model\Option as Option_Model;

/**
 * Pricing utilities.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
final class Price {

	/**
	 * Get currency data about the store currency.
	 * For use in JS.
	 *
	 * @return array
	 */
	public static function get_currency_data(): array {
		$currency = get_woocommerce_currency();

		return [
			'code'              => $currency,
			'precision'         => wc_get_price_decimals(),
			'symbol'            => html_entity_decode( get_woocommerce_currency_symbol( $currency ) ),
			'symbolPosition'    => get_option( 'woocommerce_currency_pos' ),
			'decimalSeparator'  => wc_get_price_decimal_separator(),
			'thousandSeparator' => wc_get_price_thousand_separator(),
			'priceFormat'       => html_entity_decode( get_woocommerce_price_format() ),
		];
	}

	/**
	 * Get a formatted price with currency symbol for display.
	 *
	 * We don't use wc_price for option choices because it is subject
	 * to interference by HTMLElement class targeting from third party themes and plugins.
	 *
	 * @param float|string $price The price you want to format for display.
	 * @return string $price_html
	 */
	public static function get_price_html( $price ): string {
		$price        = floatval( $price );
		$currency_pos = get_option( 'woocommerce_currency_pos' );
		/**
		 * Filter the character used as a plus sign.
		 *
		 * @param string $sign The plus sign.
		 * @param float $price The price.
		 * @param string $currency_pos The currency position.
		 */
		$sign                 = apply_filters( 'wc_product_options_plus_sign', '+', $price, $currency_pos );
		$currency_placeholder = '%1$s';
		$price_placeholder    = '%2$s';

		// if the currency symbol is on the left and the number is negative, put the negative symbol before the currency symbol.
		if ( $price < 0 ) {
			$price = abs( $price );
			/**
			 * Filter the character used as a minus sign.
			 *
			 * @param string $sign The minus sign.
			 * @param float $price The price.
			 * @param string $currency_pos The currency position.
			 */
			$sign = apply_filters( 'wc_product_options_minus_sign', '-', $price, $currency_pos );
		}

		if ( str_contains( $currency_pos, 'space' ) ) {
			$sign .= '&nbsp;';
		}

		if ( str_contains( $currency_pos, 'left' ) ) {
			$currency_placeholder = "$sign$currency_placeholder";
		} else {
			$price_placeholder = "$sign$price_placeholder";
		}

		$price_string = str_replace( [ '%1$s', '%2$s' ], [ "<span class=\"wpo-currency\">$currency_placeholder</span>", "<span class=\"wpo-price\">$price_placeholder</span>" ], get_woocommerce_price_format() );

		$price_html = sprintf(
			$price_string,
			get_woocommerce_currency_symbol(),
			self::get_formatted_price( $price )
		);

		return $price_html;
	}

	/**
	 * Get a formatted price for display.
	 *
	 * @param float $price
	 * @return string
	 */
	public static function get_formatted_price( float $price ): string {
		$decimal_seperator  = wc_get_price_decimal_separator();
		$thousand_separator = wc_get_price_thousand_separator();
		$decimals           = wc_get_price_decimals();

		return number_format( $price, $decimals, $decimal_seperator, $thousand_separator );
	}

	/**
	 * Calculates the display price for a chosen option choice.
	 *
	 * @param array $price_data
	 * @param WC_Product $product
	 * @param int $quantity
	 * @param string|null $display_area
	 * @param float|null $product_price
	 * @return float
	 */
	public static function calculate_option_display_price( $price_data, $product, $quantity = 1, $display_area = null, $product_price = null ): float {
		if ( ! isset( $price_data['type'] ) ) {
			return 0;
		}

		if ( ! in_array( $price_data['type'], [ 'flat_fee', 'percentage_inc', 'percentage_dec', 'quantity_based', 'char_count', 'file_count', 'price_formula' ], true ) ) {
			return 0;
		}

		if ( $product_price === null ) {
			$product_price = $product->get_price();
		}

		$price_amount = self::get_choice_display_price( $product, $price_data['amount'], $display_area );

		switch ( $price_data['type'] ) {
			case 'flat_fee':
				$option_price = $price_amount / $quantity;
				break;
			case 'percentage_inc':
				$option_price = $product_price * ( $price_data['amount'] / 100 );
				break;
			case 'percentage_dec':
				$option_price = - ( $product_price * ( $price_data['amount'] / 100 ) );
				break;
			case 'quantity_based':
			case 'price_formula':
				$option_price = $price_amount;
				break;
			case 'char_count':
				$option_price = $price_amount * $price_data['char_count'];
				break;
			case 'file_count':
				$option_price = $price_amount * $price_data['file_count'];
				break;
			default:
				$option_price = 0;
				break;
		}

		return $option_price;
	}


	/**
	 * Calculates the price for a chosen option choice.
	 *
	 * @param array $price_data
	 * @param WC_Product $product
	 * @param int $quantity
	 * @param float $product_price
	 * @return float
	 */
	public static function calculate_option_cart_price( $price_data, $product, $quantity = 1, $product_price = 0.0 ): float {

		if ( ! isset( $price_data['type'] ) ) {
			return 0;
		}

		if ( ! in_array( $price_data['type'], [ 'flat_fee', 'percentage_inc', 'percentage_dec', 'quantity_based', 'char_count', 'file_count', 'price_formula' ], true ) ) {
			return 0;
		}

		if ( $product_price === null ) {
			$product_price = (float) $product->get_price();
		} else {
			// Ensure product price is a float.
			$product_price = (float) $product_price;
		}

		switch ( $price_data['type'] ) {
			case 'flat_fee':
				$option_price = $price_data['amount'] / $quantity;
				break;
			case 'percentage_inc':
				$option_price = $product_price * ( $price_data['amount'] / 100 );
				break;
			case 'percentage_dec':
				$option_price = - ( $product_price * ( $price_data['amount'] / 100 ) );
				break;
			case 'quantity_based':
			case 'price_formula':
				$option_price = $price_data['amount'];
				break;
			case 'char_count':
				$option_price = $price_data['amount'] * $price_data['char_count'];
				break;
			case 'file_count':
				$option_price = $price_data['amount'] * $price_data['file_count'];
				break;

			default:
				$option_price = 0;
				break;
		}

		/**
		 * Filter the price of an option choice in the cart.
		 *
		 * @param float $option_price
		 * @param WC_Product $product
		 * @param array $price_data
		 */
		return apply_filters( 'wc_product_options_cart_price', $option_price, $product, $price_data );
	}

	/**
	 * Get display price for a an option choice.
	 *
	 * @param WC_Product $product
	 * @param float $choice_price
	 * @param string|null $display_area
	 * @return float|string $price
	 */
	public static function get_choice_display_price( $product, $choice_price, $display_area = null ) {
		if ( ! wc_tax_enabled() ) {
			/**
			 * Filter the price of an option choice.
			 *
			 * @param float $choice_price
			 * @param WC_Product $product
			 * @param float $choice_price
			 */
			return apply_filters( 'wc_product_options_choice_label_price', $choice_price, $product, $choice_price );
		}

		if ( is_null( $display_area ) ) {
			$display_on = is_cart() || is_checkout() ? 'cart' : 'shop';
		} elseif ( in_array( $display_area, [ 'cart', 'shop' ], true ) ) {
			$display_on = $display_area;
		} else {
			return apply_filters( 'wc_product_options_choice_label_price', $choice_price, $product, $choice_price );
		}

		$tax_display = get_option( "woocommerce_tax_display_{$display_on}" );

		if ( ! empty( WC()->customer ) && WC()->customer->get_is_vat_exempt() && wc_prices_include_tax() ) {
			$tax_display = 'excl';
		}

		return apply_filters( 'wc_product_options_choice_label_price', self::get_price_with_applicable_tax( $product, $choice_price, $tax_display ), $product, $choice_price );
	}

	/**
	 * Get price based on tax settings.
	 *
	 * @param WC_Product $product
	 * @param float $price
	 * @param bool $tax_display
	 * @return float|string Empty string if price cannot be calculated.
	 */
	public static function get_price_with_applicable_tax( $product, $price, $tax_display ) {
		// check if price is negative and set a marker to return the negative price later
		// wc_get_price_including_tax() and wc_get_price_excluding_tax() will return a positive value
		$negative_price = false;
		$price          = floatval( $price );

		if ( $price < 0 ) {
			$negative_price = true;
			$price          = abs( floatval( $price ) );
		}

		if ( $tax_display === 'incl' ) {
			$price = wc_get_price_including_tax(
				$product,
				[
					'qty'   => 1,
					'price' => $price,
				]
			);
		}

		if ( $tax_display === 'excl' ) {
			$price = wc_get_price_excluding_tax(
				$product,
				[
					'qty'   => 1,
					'price' => $price,
				]
			);
		}

		// if the price was negative, return it as negative
		if ( $negative_price ) {
			$price = - $price;
		}

		return $price;
	}

	public static function has_conflicting_tax_settings(): bool {
		if ( ! wc_tax_enabled() ) {
			return false;
		}

		$display_includes_tax = get_option( 'woocommerce_tax_display_shop' ) === 'incl';
		$prices_include_tax   = apply_filters( 'woocommerce_prices_include_tax', get_option( 'woocommerce_prices_include_tax' ) === 'yes' );

		return $prices_include_tax !== $display_includes_tax;
	}

	/**
	 * Determine if the current user has a wholesale role with set choice pricing for the given choice.
	 *
	 * @param array $choice
	 * @return bool|float
	 */
	public static function wholesale_user_has_choice_pricing( $choice ) {
		if ( ! Lib_Util::is_barn2_plugin_active( '\Barn2\Plugin\WC_Wholesale_Pro\woocommerce_wholesale_pro' ) ) {
			return false;
		}

		$wholesale_role = Wholesale_Util::get_current_user_wholesale_role_object();

		if ( ! $wholesale_role ) {
			return false;
		}

		if ( ! isset( $choice['wholesale'][ $wholesale_role->get_name() ] ) ) {
			return false;
		}

		if ( ! is_numeric( $choice['wholesale'][ $wholesale_role->get_name() ] ) ) {
			return false;
		}

		return $choice['wholesale'][ $wholesale_role->get_name() ];
	}

	/**
	 * Get the choice pricing for the current user.
	 *
	 * @param array $choice
	 * @return string
	 */
	public static function get_user_choice_pricing( $choice ) {
		$choice_pricing           = $choice['pricing'] ?? '0';
		$wholesale_choice_pricing = self::wholesale_user_has_choice_pricing( $choice );

		if ( $wholesale_choice_pricing !== false ) {
			$choice_pricing = $wholesale_choice_pricing;
		}

		return $choice_pricing;
	}

	/**
	 * Get the logical functions.
	 *
	 * @return array
	 */
	public static function get_logical_functions(): array {
		$logical_functions = [
			'sign'    => function ( $number ) {
				return $number <=> 0;
			},
			'trunc'   => function ( $number ) {
				return ( $number <=> 0 ) * floor( abs( $number ) );
			},
			'compare' => function ( $a, $b, $operator = '>' ) {
				switch ( $operator ) {
					case '<':
						return $a < $b ? 1 : 0;
					case '>=':
						return $a >= $b ? 1 : 0;
					case '<=':
						return $a <= $b ? 1 : 0;
					case '=':
						return $a == $b ? 1 : 0; // phpcs:ignore
					case '!=':
						return $a != $b ? 1 : 0; // phpcs:ignore
					case '>':
					default:
						return $a > $b ? 1 : 0;
				}
				return $a <=> $b;
			},
			'if'      => function ( $condition, $true_value, $false_value ) {
				return $condition ? $true_value : $false_value;
			},
			'and'     => function ( ...$args ) {
				return array_reduce(
					$args,
					function ( $carry, $item ) {
						return $carry && $item;
					},
					true
				);
			},
			'or'      => function ( ...$args ) {
				return array_reduce(
					$args,
					function ( $carry, $item ) {
						return $carry || $item;
					},
					false
				);
			},
			'not'     => function ( $value ) {
				return ! filter_var( $value, FILTER_VALIDATE_BOOLEAN );
			},
			'eq'      => function ( $a, $b ) {
				// phpcs:reason MathExecutor treats numeric literals as strings
				// phpcs:ignore StrictComparisons.LooseComparison
				return $a == $b;
			},
			'neq'     => function ( $a, $b ) {
				// phpcs:reason MathExecutor treats numeric literals as strings
				// phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
				return $a != $b;
			},
			'gt'      => function ( $a, $b ) {
				return $a > $b;
			},
			'gte'     => function ( $a, $b ) {
				return $a >= $b;
			},
			'lt'      => function ( $a, $b ) {
				return $a < $b;
			},
			'lte'     => function ( $a, $b ) {
				return $a <= $b;
			},
		];

		return array_combine(
			array_map( 'strtolower', array_keys( $logical_functions ) ),
			array_values( $logical_functions )
		);
	}

	/**
	 * Get the custom functions.
	 *
	 * @return array
	 */
	public static function get_custom_functions(): array {
		$default_custom_functions = [
			'bulkPrice'   => function ( $price, $quantity, ...$bulk_prices ) {
				if ( count( $bulk_prices ) % 2 !== 0 ) {
					return 0;
				}

				$prices      = [];
				$price_count = count( $bulk_prices );

				for ( $i = 0; $i < $price_count; $i += 2 ) {
					$prices[] = [
						'quantity' => $bulk_prices[ $i ],
						'price'    => $bulk_prices[ $i + 1 ],
					];
				}

				usort(
					$prices,
					function ( $a, $b ) {
						return $b['quantity'] - $a['quantity'];
					}
				);

				foreach ( $prices as $price_data ) {
					if ( $quantity >= $price_data['quantity'] ) {
						return $price_data['price'];
					}
				}

				return $price;
			},
			'bulkRate'    => function ( $price, $quantity, ...$bulk_rates ) {
				if ( count( $bulk_rates ) % 2 !== 0 ) {
					return 0;
				}

				$prices      = [];
				$price_count = count( $bulk_rates );

				for ( $i = 0; $i < $price_count; $i += 2 ) {
					$prices[] = [
						'quantity' => $bulk_rates[ $i ],
						'rate'     => $bulk_rates[ $i + 1 ],
					];
				}

				usort(
					$prices,
					function ( $a, $b ) {
						return $b['quantity'] - $a['quantity'];
					}
				);

				foreach ( $prices as $price_data ) {
					if ( $quantity >= $price_data['quantity'] ) {
						return $price * $price_data['rate'];
					}
				}

				return $price;
			},
			'year'        => function ( $date = null ) {
				if ( ! $date ) {
					$date = current_time( 'Y-m-d' );
				}

				return (int) gmdate( 'Y', strtotime( $date ) );
			},
			'month'       => function ( $date = null ) {
				if ( ! $date ) {
					$date = current_time( 'Y-m-d' );
				}

				return (int) gmdate( 'n', strtotime( $date ) );
			},
			'day'         => function ( $date = null ) {
				if ( ! $date ) {
					$date = current_time( 'Y-m-d' );
				}

				return (int) gmdate( 'j', strtotime( $date ) );
			},
			'weekday'     => function ( $date = null ) {
				if ( ! $date ) {
					$date = current_time( 'Y-m-d' );
				}

				return ( 7 + (int) gmdate( 'N', strtotime( $date ) ) - get_option( 'start_of_week', 0 ) ) % 7 + 1;
			},
			'productMeta' => function ( $meta_key, $default_value = 0 ) {
				global $product;

				if ( ! $product ) {
					$product_id = filter_input( INPUT_POST, 'add-to-cart', FILTER_VALIDATE_INT );
					$product    = wc_get_product( $product_id );
				}

				if ( ! $product ) {
					return $default_value;
				}

				return $product->get_meta( $meta_key ) ?: $default_value;
			},
		];

		$custom_functions = array_merge( $default_custom_functions, apply_filters( 'wc_product_options_formula_custom_functions', [] ) );

		return array_combine(
			array_map( 'strtolower', array_keys( $custom_functions ) ),
			array_values( $custom_functions )
		);
	}

	/**
	 * Evaluate a formula for a cart item.
	 *
	 * @param string $option_id
	 * @param array  $cart_item
	 * @param string|null $custom_variable_name
	 * @return float|int|string
	 */
	public static function evaluate_cart_item_formula( $option_id, $cart_item, $custom_variable_name = null ) {
		$options     = $cart_item['wpo_options'];
		$choice_data = $options[ $option_id ]['choice_data'];
		$product     = $cart_item['data'];
		$quantity    = $cart_item['quantity'] ?? 1;

		// When a formula is present, `[product_quantity]` in the formula
		// represents the total quantity of products added by WBV.
		// Therefore, we need to account for all the products added by WBV
		// rather than a single product at a time.
		$o_qty    = $choice_data[0]['pricing']['o_qty'] ?? null;
		$bulk_qty = $choice_data[0]['pricing']['bulk_qty'] ?? null;
		$quantity = $bulk_qty && $o_qty ? $bulk_qty + $quantity - $o_qty : $quantity;

		$option        = Option_Model::find( $option_id );
		$price_formula = new Price_Formula( $option, $product );
		$option_values = array_combine(
			array_map(
				function ( $key ) {
					return "option-{$key}";
				},
				array_keys( $options )
			),
			array_map(
				function ( $options ) {
					return $options['value'];
				},
				$options
			),
		);

		return $price_formula->evaluate_formula( $option_values, $quantity, $custom_variable_name );
	}
}
