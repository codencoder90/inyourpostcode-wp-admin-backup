<?php

namespace Barn2\Plugin\WC_Product_Options\Fields\Traits;

use Barn2\Plugin\WC_Product_Options\Util\Util;
use Barn2\Plugin\WC_Product_Options\Util\Price as Price_Util;
use Barn2\Plugin\WC_Product_Options\Util\Conditional_Logic as Conditional_Logic_Util;
use Barn2\Plugin\WC_Product_Options\Model\Option as Option_Model;
use Barn2\Plugin\WC_Product_Options\Dependencies\NXP\MathExecutor;
use Barn2\Plugin\WC_Product_Options\Dependencies\NXP\Classes\Operator;
use Barn2\Plugin\WC_Product_Options\Dependencies\Illuminate\Database\Eloquent\ModelNotFoundException;
use Barn2\Plugin\WC_Product_Options\Fields\Price_Formula;
use Exception;

trait Cart_Item_Data_Formula {

	/**
	 * Retrieves the cart item data for the selected value(s) of the field.
	 *
	 * @param mixed       $value
	 * @param WC_Product $product
	 * @param int $quantity
	 * @param array $options
	 * @return array
	 */
	public function get_cart_item_data( $value, $product, $quantity, $options ): ?array {
		if ( ! $this->formula->check_validity() ) {
			return [];
		}

		if ( Conditional_Logic_Util::is_field_hidden( $this, $options ) ) {
			return [];
		}

		$original_quantity = $quantity;
		$wbv_quantities    = filter_input( INPUT_POST, 'quantity', FILTER_DEFAULT, FILTER_REQUIRE_ARRAY);

		if ( is_array( $wbv_quantities ) ) {
			$quantity = array_reduce(
				$wbv_quantities,
				function ( $sum, $quantity ) {
					return $sum + intval( $quantity );
				},
				0
			);
		}

		$result = $this->evaluate_formula( $options, $quantity );

		if ( is_null( $result ) ) {
			return [];
		}

		$pricing = [
			'type'   => 'price_formula',
			'amount' => $result,
		];

		if ( is_array( $wbv_quantities ) ) {
			$pricing['o_qty']    = $original_quantity;
			$pricing['bulk_qty'] = $quantity;
		}

		return [
			'name'        => $this->option->name,
			'type'        => $this->option->type,
			'option_id'   => $this->option->id,
			'group_id'    => $this->option->group_id,
			'value'       => $value,
			'choice_data' => [
				[
					'label'   => '',
					'pricing' => $pricing,
				],
			],
		];
	}

	/**
	 * Create a new MathExecutor instance and add custom functions.
	 *
	 * @return MathExecutor
	 */
	public function get_math_executor() {
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
				static fn( $a, $b ) => is_string( $a ) || is_string( $b )
					? 0 == strcmp( (string) $a, (string) $b )
					: $a == $b
			)
		);
		// phpcs:enable

		return $executor;
	}

	/**
	 * Evaluates the formula for the field.
	 *
	 * If the optional parameter `$custom_variable_name` is provided,
	 * the formula will be evaluated with the custom variable formula
	 * instead of the main one.
	 *
	 * @param array $options
	 * @param int $quantity
	 * @param string|null $custom_variable_name
	 * @return float|null
	 */
	public function evaluate_formula( array $options, int $quantity, string $custom_variable_name = null ): ?float {
		// retrieve options which match formula vars
		$executor = $this->get_math_executor();

		// validate that supplied formula variables are valid
		$variable_values   = [];
		$formula_variables = array_map(
			function ( $variable ) {
				$variable_name   = strtolower( $variable['name'] ?? '' );
				$variable['var'] = strtolower( ( $variable['var'] ?? '' ) ?: $variable_name );
				return $variable;
			},
			$this->formula->get_variables()
		);

		$expression = $this->formula->get_expression( $custom_variable_name );

		foreach ( $formula_variables as $formula_variable ) {
			if ( str_contains( $formula_variable['var'], '.' ) ) {
				$new_variable_name       = str_replace( '.', '__dot__', $formula_variable['var'] );
				$expression              = str_replace( $formula_variable['var'], $new_variable_name, $expression );
				$formula_variable['var'] = $new_variable_name;
			}

			if ( $option = $this->is_valid_option_variable( $formula_variable, $options ) ) {
				$variable = $this->get_option_variable_value( $option, $options, $formula_variable, $quantity );
			} elseif ( $formula_variable['type'] === 'product' ) {
				$variable = $this->get_product_variable_value( $formula_variable['id'], $quantity );
			} elseif ( preg_match( '/__dot__none$/', $formula_variable['var'], $matches ) ) {
				// if the formula variable is `none`
				// and the variable is not present in the options array,
				// we can set $variable to 1
				// because input are not submitted when no input is selected
				$variable = 1;
			} else {
				$variable = null;
			}

			// can't find variable value, return null
			if ( ! isset( $variable ) ) {
				$variable_values[ $formula_variable['var'] ] = 0;
			} else {
				$variable_values[ $formula_variable['var'] ] = $variable;
			}
		}

		// remove empty variables, but not 0 or 0.00
		$variable_values = array_filter(
			$variable_values,
			function ( $value ) {
				return $value !== '' && ! is_null( $value );
			}
		);

		// check we have values for all variables
		if ( count( $variable_values ) !== count( $formula_variables ) ) {
			return null;
		}

		// remove spaces in variable names
		$executor_variables = array_combine(
			array_map(
				function ( $key ) {
					return str_replace( ' ', '', $key );
				},
				array_keys( $variable_values )
			),
			$variable_values
		);

		try {
			// set the variables for the expression evaluator
			foreach ( $executor_variables as $variable => $value ) {
				$executor->setVar( $variable, $value );
			}
			$result = $executor->execute( $expression );
		} catch ( Exception $e ) {
			return null;
		}

		return $result;
	}

	/**
	 * Checks if the supplied option variable is valid.
	 *
	 * @param array $formula_variable
	 * @param array $options
	 * @throws Exception If the option variable is not valid.
	 * @return object|null
	 */
	private function is_valid_option_variable( $formula_variable, $options ): ?object {
		try {
			$option = Option_Model::findOrFail( $formula_variable['id'] );

			if ( ! isset( $options[ "option-$option->id" ] ) ) {
				throw new Exception( 'Option is not present in options array' );
			}

			return $option;
		} catch ( ModelNotFoundException $exception ) {
			return null;
		} catch ( Exception $exception ) {
			return null;
		}
	}


	/**
	 * Checks if the formula is valid.
	 *
	 * @param object $option
	 * @param array $options
	 * @return float|null
	 */
	private function get_option_variable_value( object $option, array $options, array $formula_variable, $quantity ): ?float {
		if ( ! isset( $options[ "option-$option->id" ] ) ) {
			return null;
		}

		$field_class  = Util::get_field_class( $option->type );
		$field_object = new $field_class( $option, $this->product );

		$is_field_hidden = Conditional_Logic_Util::is_field_hidden( $field_object, $options );
		$sanitized_value = $is_field_hidden ? '0' : $field_object->sanitize( $options[ "option-$option->id" ] );

		$sanitized_value = $this->process_value( $sanitized_value, $option, $formula_variable, $options, $quantity );

		if ( ! is_numeric( $sanitized_value ) ) {
			return null;
		}

		// TODO: check if this is needed after expanding price formulas to support more than just numbers
		// if ( $sanitized_value !== '0' && empty( $sanitized_value ) ) {
		// 	return null;
		// }

		return $sanitized_value;
	}

	private function process_value( $value, $option, $formula_variable, $options, $quantity ) {
		$name       = $formula_variable['var'];
		$prop_chain = explode( '__dot__', $name );

		switch ( $option->type ) {
			case 'number':
			case 'price':
				$value = (float) $value;
				break;

			case 'checkbox':
			case 'radio':
			case 'dropdown':
			case 'images':
			case 'color_swatches':
			case 'text_labels':
				$value = $this->process_choice_value( $value, $option, $formula_variable );
				break;

			case 'text':
			case 'textarea':
				switch ( $prop_chain[1] ) {
					case 'characters':
						$value = strlen( trim( preg_replace( '/[\n\r ]+/', ' ', $value ) ) );
						break;
					case 'characters_no_space':
						$value = strlen( str_replace( ' ', '', preg_replace( '/[\n\r ]+/', ' ', $value ) ) );
						break;
					case 'words':
						$value = trim( $value ) ? count( explode( ' ', preg_replace( '/[\n\r ]+/', ' ', $value ) ) ) : 0;
						break;
					case 'lines':
						$value = trim( $value ) ? count( explode( "\n", $value ) ) : 0;
						break;
				}
				break;

			case 'file_upload':
				switch ( $prop_chain[1] ) {
					case 'count':
						if ( is_array( $value ) ) {
							$value = count( $value );
						} else {
							$value = 0;
						}
						break;
					case 'size':
						$size = 0;
						foreach ( $value as $file ) {
							// ignore certificate verification
							$head  = wp_remote_head( $file, [ 'sslverify' => false ] );
							$size += wp_remote_retrieve_header( $head, 'content-length' ) ?: 0;
						}
						$value = $size;
						break;
				}
				break;

			case 'price_formula':
				$price_formula = new Price_Formula( $option, $this->product );
				$value         = $price_formula->evaluate_formula( $options, $quantity );
				break;

			case 'datepicker':
				switch ( $prop_chain[1] ) {
					case 'daycount':
						$value = empty( $value ) ? 0 : date_diff( date_create( substr( $value, 0, 10 ) ), date_create() )->days + 1;
						break;
					case 'year':
						$value = empty( $value ) ? 0 : (int) gmdate( 'Y', strtotime( $value ) );
						break;
					case 'month':
						$value = empty( $value ) ? 0 : (int) gmdate( 'n', strtotime( $value ) );
						break;
					case 'day':
						$value = empty( $value ) ? 0 : (int) gmdate( 'j', strtotime( $value ) );
						break;
					case 'weekday':
						$start   = get_option( 'start_of_week', 0 );
						$date    = strtotime( $value );
						$weekday = (int) gmdate( 'N', $date );
						$value   = empty( $value ) ? 0 : ( 7 + $weekday - $start ) % 7 + 1;
						break;
				}
				break;

			case 'product':
				switch ( $prop_chain[1] ) {
					case 'count':
						$value = count( $value );
						break;
					case 'all':
						$value = count( $value ) === count( $option->choices ) ? 1 : 0;
						break;
					case 'any':
						$value = count( $value ) > 0 ? 1 : 0;
						break;
					case 'none':
						$value = count( $value ) === 0 ? 1 : 0;
						break;
					case 'max':
						$value = array_reduce(
							$value,
							function ( $max, $product_id ) {
								$product = wc_get_product( $product_id );
								if ( ! $product ) {
									return $max;
								}

								return max( $max, $product->get_price() );
							},
							0
						);
						break;

					case 'min':
						$count = is_array( $value ) ? count( $value ) : 1;
						$value = array_reduce(
							$value,
							function ( $min, $product_id ) {
								$product = wc_get_product( $product_id );
								if ( ! $product ) {
									return $min;
								}

								return min( $min, $product->get_price() );
							},
							$count > 0 ? INF : 0
						);
						break;

					case 'total':
						$value = array_reduce(
							$value,
							function ( $sum, $product_id ) {
								$product = wc_get_product( $product_id );
								if ( ! $product ) {
									return $sum;
								}

								return $sum + $product->get_price();
							},
							0
						);
						break;

					case 'selected':
						$value = count( $value ) > 0 ? 1 : 0;
						break;

					case 'price':
						$value = array_reduce(
							$value,
							function ( $sum, $product_id ) {
								$product = wc_get_product( $product_id );
								if ( ! $product ) {
									return $sum;
								}

								return $sum + $product->get_price();
							},
							0
						);
						break;
				}
				break;
		}

		return $value;
	}

	private function process_choice_value( $value, $option, $formula_variable ) {
		if ( ! is_array( $value ) ) {
			$value = [ $value ];
		}

		$name       = $formula_variable['var'];
		$prop_chain = explode( '__dot__', $name );

		switch ( $prop_chain[1] ) {
			case 'count':
				$value = count( $value );
				break;

			case 'all':
				$value = count( $value ) === count( $option->choices ) ? 1 : 0;
				break;

			case 'any':
				$value = count( $value ) > 0 ? 1 : 0;
				break;

			case 'none':
				$value = count( $value ) === 0 ? 1 : 0;
				break;

			case 'value':
				$choice = array_values(
					array_filter(
						$option->choices,
						function ( $choice ) use ( $value ) {
							if ( is_array( $value ) ) {
								return in_array( $choice['id'], $value, true );
							}

							return $choice['id'] === $value;
						}
					)
				);

				$value = empty( $choice ) ? 0 : ( $choice[0]['value'] ?? 0 );
				break;

			case 'max':
				$value = array_reduce(
					$option->choices,
					function ( $max, $choice ) use ( $value ) {
						if ( is_array( $value ) ) {
							return in_array( $choice['id'], $value, true ) ? max( $max, $choice['value'] ) : $max;
						}

						return $choice['id'] === $value ? max( $max, $choice['value'] ) : $max;
					},
					0
				);
				break;

			case 'min':
				$count = is_array( $value ) ? count( $value ) : 1;
				$value = array_reduce(
					$option->choices,
					function ( $min, $choice ) use ( $value ) {
						if ( is_array( $value ) ) {
							return in_array( $choice['id'], $value, true ) ? min( $min, $choice['value'] ) : $min;
						}

						return $choice['id'] === $value ? min( $min, $choice['value'] ) : $min;
					},
					$count > 0 ? INF : 0
				);
				break;

			case 'sum':
				$value = array_reduce(
					$option->choices,
					function ( $sum, $choice ) use ( $value ) {
						if ( is_array( $value ) ) {
							return in_array( $choice['id'], $value, true ) ? $sum + floatval( $choice['value'] ) : $sum;
						}

						return $choice['id'] === $value ? $sum + $choice['value'] : $sum;
					},
					0
				);
				break;

			case 'selected':
				$value = count( $value ) > 0 ? 1 : 0;
				break;

			case 'choices':
				$choice = array_values(
					array_filter(
						$option->choices,
						function ( $choice, $index ) use ( $value, $prop_chain ) {
							return $prop_chain[2] === "choice{$index}" && in_array( $choice['id'], $value, true );
						},
						ARRAY_FILTER_USE_BOTH
					)
				);

				if ( $prop_chain[3] === 'checked' ) {
					$value = empty( $choice ) ? 0 : 1;
				} elseif ( $prop_chain[3] === 'value' ) {
					$value = empty( $choice ) ? 0 : ( $choice[0]['value'] ?? 0 );
				}
				break;
		}

		return $value;
	}

	/**
	 * Get the values for product based variables.
	 *
	 * @param string $id
	 * @param int $quantity
	 * @return float
	 */
	private function get_product_variable_value( string $id, int $quantity ): ?float {
		switch ( $id ) {
			case 'product_price':
				return floatval( $this->product->get_price() );
			case 'product_quantity':
				return floatval( $quantity );
			case 'product_weight':
				return floatval( $this->product->get_weight() ?: 0 );
			case 'product_width':
				return floatval( $this->product->get_width() ?: 0 );
			case 'product_length':
				return floatval( $this->product->get_length() ?: 0 );
			case 'product_height':
				return floatval( $this->product->get_height() ?: 0 );
			case 'default':
			default:
				return 0;
		}
	}
}
