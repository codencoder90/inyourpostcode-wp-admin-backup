<?php

namespace Barn2\Plugin\WC_Product_Options\Rest\Routes;

use Barn2\Plugin\WC_Product_Options\Model\Option;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Rest\Base_Route;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Rest\Route;
use Barn2\Plugin\WC_Product_Options\Formula as Price_Formula;
use Barn2\Plugin\WC_Product_Options\Dependencies\NXP\MathExecutor;
use Barn2\Plugin\WC_Product_Options\Dependencies\NXP\Classes\Operator;
use Barn2\Plugin\WC_Product_Options\Util\Price as Price_Util;
use WP_Error;
use WP_REST_Response;
use WP_REST_Server;
use WC_Tax;
use Automattic\WooCommerce\Utilities\NumberUtil;

/**
 * REST controller for the server-side formula calculation.
 *
 * This route is invoked by the client side when the formula is calculated.
 * Formulas are generally calculated in Javascript
 * but when the "Prices entered with tax" is not aligned with the "Display prices in the shop" setting
 * (a configuration that WooCommerce doesn't recommend for rounding reasons),
 * the formula calculation is done server-side to ensure the correct price is calculated.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Formula extends Base_Route implements Route {

	protected $rest_base = 'formula';

	/**
	 * Register the REST routes.
	 */
	public function register_routes() {
		// CALCULATE.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/calculate',
			[
				[
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => [ $this, 'calculate' ],
					'permission_callback' => [ $this, 'permission_callback' ],
				],
			]
		);
	}

	/**
	 * Calculate formulas.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function calculate( $request ) {
		global $product;
		$results = [];
		$data    = json_decode( $request->get_body(), true );

		if ( ! $data ) {
			return new WP_Error( 'wpo_formula_error', __( 'Insufficient data supplied.', 'woocommerce-product-options' ) );
		}

		// formulas that are not used because of conditional logic
		// are passed as `null`, so we need to filter the formula array
		$formulas = array_values( array_filter( $data['formulas'] ) ) ?? [];
		$product  = wc_get_product( $data['product_id'] ?? 0 );

		foreach ( $formulas as $formula_data ) {
			$option = Option::find( $formula_data['option_id'] );

			if ( $option->type !== 'price_formula' ) {
				return new WP_Error( 'wpo_formula_error', __( 'Invalid option ID.', 'woocommerce-product-options' ) );
			}

			$formula        = new Price_Formula( $option );
			$variables      = $formula->get_variables();
			$expression     = strtolower( $option->settings['formula']['expression'] );
			$data_variables = $formula_data['variables'];

			if ( ! wc_prices_include_tax() ) {
				// if WooCommerce tax settings are set to enter prices without tax
				// we need to remove the tax from all the variables that are already calculated including tax
				if ( isset( $data_variables['product_price'] ) ) {
					$data_variables['product_price'] = $this->remove_tax( $data_variables['product_price'], $product );
				}
			}

			$executor = new MathExecutor();

			$custom_functions = array_merge( Price_Util::get_logical_functions(), Price_Util::get_custom_functions() );

			foreach ( $custom_functions as $function_name => $function ) {
				$executor->addFunction( $function_name, $function );
			}

			// MathExecutor doesn't include the `=` operator by default
			// so we need to add it manually
			// phpcs:disable
			$executor->addOperator(
				new Operator(
					'=',
					false,
					140,
					static function ( $a, $b ) {
						is_string( $a ) || is_string( $b )
							? 0 == strcmp( (string) $a, (string) $b )
							: $a == $b;
					}
				)
			);
			// phpcs:enable

			foreach ( $variables as $variable ) {
				$value             = 0;
				$new_variable_name = $variable['name'];

				if ( $variable['type'] === 'product' ) {
					$value = $data_variables[ $variable['name'] ] ?? 0;
				} else {
					$variable_name  = strtolower( $variable['var'] );
					$variable_array = explode( '.', $variable_name );
					$temp_variable  = $data_variables;
					$value          = null;
					foreach ( $variable_array as $prop ) {
						$temp_variable = $temp_variable[ $prop ] ?? null;
						if ( is_null( $temp_variable ) ) {
							break;
						}
					}

					if ( ! is_null( $temp_variable ) ) {
						$value = $temp_variable;
					}

					$new_variable_name = str_replace( '.', '__dot__', $variable_name );
					$expression        = str_replace( $variable_name, $new_variable_name, $expression );
				}

				$executor->setVar( $new_variable_name, $value );
			}

			try {
				$result = $this->convert_price( $executor->execute( $expression ), $product );
			} catch ( \Exception $e ) {
				$result = 0;
			}

			$results[] = [
				'option_id' => $formula_data['option_id'],
				'price'     => $result,
			];
		}

		return new WP_REST_Response( $results, 200 );
	}

	/**
	 * Permission callback.
	 *
	 * @return bool
	 */
	public function permission_callback() {
		return true;
	}

	/**
	 * Calculate the price including tax, depending on the WooCommerce settings.
	 *
	 * This method is borrowed from WooCommerce and modified to allow negative price calculations
	 * for example when a discount is applied to a product via a formula.
	 *
	 * @param float      $price   The price being calculated.
	 * @param WC_Product $product The current product object.
	 * @return float              The result of the tax calculation.
	 */
	public function get_price_including_tax( $price, $product ) {
		// we don't need the quantity in our calculation
		// but we need to pass it to the filter
		$qty = 1;

		if ( $product->is_taxable() ) {
			if ( ! wc_prices_include_tax() ) {
				// If the customer is exempt from VAT, set tax total to 0.
				if ( ! empty( WC()->customer ) && WC()->customer->get_is_vat_exempt() ) {
					$taxes_total = 0.00;
				} else {
					$tax_rates = WC_Tax::get_rates( $product->get_tax_class() );
					$taxes     = WC_Tax::calc_tax( $price, $tax_rates, false );

					if ( 'yes' === get_option( 'woocommerce_tax_round_at_subtotal' ) ) {
						$taxes_total = array_sum( $taxes );
					} else {
						$taxes_total = array_sum( array_map( 'wc_round_tax_total', $taxes ) );
					}
				}

				$price = NumberUtil::round( $price + $taxes_total, wc_get_price_decimals() );
			} else {
				$tax_rates      = WC_Tax::get_rates( $product->get_tax_class() );
				$base_tax_rates = WC_Tax::get_base_tax_rates( $product->get_tax_class( 'unfiltered' ) );

				/**
				 * If the customer is exempt from VAT, remove the taxes here.
				 * Either remove the base or the user taxes depending on woocommerce_adjust_non_base_location_prices setting.
				 */
				if ( ! empty( WC()->customer ) && WC()->customer->get_is_vat_exempt() ) { // @codingStandardsIgnoreLine.
					$remove_taxes = apply_filters( 'woocommerce_adjust_non_base_location_prices', true ) ? WC_Tax::calc_tax( $line_price, $base_tax_rates, true ) : WC_Tax::calc_tax( $line_price, $tax_rates, true );

					if ( 'yes' === get_option( 'woocommerce_tax_round_at_subtotal' ) ) {
						$remove_taxes_total = array_sum( $remove_taxes );
					} else {
						$remove_taxes_total = array_sum( array_map( 'wc_round_tax_total', $remove_taxes ) );
					}

					$price = NumberUtil::round( $price - $remove_taxes_total, wc_get_price_decimals() );

					/**
				 * The woocommerce_adjust_non_base_location_prices filter can stop base taxes being taken off when dealing with out of base locations.
				 * e.g. If a product costs 10 including tax, all users will pay 10 regardless of location and taxes.
				 * This feature is experimental @since 2.4.7 and may change in the future. Use at your risk.
				 */
				} elseif ( $tax_rates !== $base_tax_rates && apply_filters( 'woocommerce_adjust_non_base_location_prices', true ) ) {
					$base_taxes   = WC_Tax::calc_tax( $price, $base_tax_rates, true );
					$modded_taxes = WC_Tax::calc_tax( $price - array_sum( $base_taxes ), $tax_rates, false );

					if ( 'yes' === get_option( 'woocommerce_tax_round_at_subtotal' ) ) {
						$base_taxes_total   = array_sum( $base_taxes );
						$modded_taxes_total = array_sum( $modded_taxes );
					} else {
						$base_taxes_total   = array_sum( array_map( 'wc_round_tax_total', $base_taxes ) );
						$modded_taxes_total = array_sum( array_map( 'wc_round_tax_total', $modded_taxes ) );
					}

					$price = NumberUtil::round( $price - $base_taxes_total + $modded_taxes_total, wc_get_price_decimals() );
				}
			}
		}

		return apply_filters( 'woocommerce_get_price_including_tax', $price, $qty, $product );
	}

	/**
	 * Calculate the price excluding tax, depending on the WooCommerce settings.
	 *
	 * This method is borrowed from WooCommerce and modified to allow negative price calculations
	 * for example when a discount is applied to a product via a formula.
	 *
	 * @param float      $price   The price tax is being removed from.
	 * @param WC_Product $product The current product object.
	 * @param bool       $force   Whether to force the tax removal.
	 * @return float              The resulting price.
	 */
	public function get_price_excluding_tax( $price, $product, $force = false ) {
		// we don't need the quantity in our calculation
		// but we need to pass it to the filter
		$qty = 1;

		if ( $product->is_taxable() && ( wc_prices_include_tax() || $force ) ) {
			if ( apply_filters( 'woocommerce_adjust_non_base_location_prices', true ) ) {
				$tax_rates = WC_Tax::get_base_tax_rates( $product->get_tax_class( 'unfiltered' ) );
			} else {
				$tax_rates = WC_Tax::get_rates( $product->get_tax_class() );
			}

			$remove_taxes = WC_Tax::calc_tax( $price, $tax_rates, true );
			$price        = $price - array_sum( $remove_taxes ); // Unrounded since we're dealing with tax inclusive prices. Matches logic in cart-totals class. @see adjust_non_base_location_price.
		}

		return apply_filters( 'woocommerce_get_price_excluding_tax', $price, $qty, $product );
	}

	/**
	 * Convert the price depending on the WooCommerce tax settings.
	 */
	public function convert_price( $price, $product ) {
		if ( wc_prices_include_tax() ) {
			return $this->get_price_excluding_tax( $price, $product );
		} else {
			return $this->get_price_including_tax( $price, $product );
		}
	}

	/**
	 * Convert the price depending on the WooCommerce tax settings.
	 *
	 * @param float      $price   The price tax is being removed from.
	 * @param WC_Product $product The current product object.
	 * @return float              The price with the tax removed.
	 */
	public function remove_tax( $price, $product ) {
		return NumberUtil::round( $this->get_price_excluding_tax( $price, $product, true ), wc_get_price_decimals() );
	}
}
