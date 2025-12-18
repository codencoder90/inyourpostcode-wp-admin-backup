<?php

namespace Barn2\Plugin\WC_Product_Options\Util;

use Barn2\Plugin\WC_Product_Options\Model\Option as Option_Model;
use Barn2\Plugin\WC_Product_Options\Fields;
use DateTime;

/**
 * Conditional logic utilities.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
final class Conditional_Logic {

	public static function apply_conditional_logic( $passing, $field ): bool {
		$config = $field->get_conditional_logic_config();

		if ( $config->visibility === 'show' ) {
			return ! $passing;
		}

		if ( $config->visibility === 'hide' ) {
			return $passing;
		}

		return false;
	}

	/**
	 * Determines if a field is hidden by conditional logic.
	 *
	 * @param Fields\Abstract_Field $field
	 * @param array $option_data
	 */
	public static function is_field_hidden( $field, $option_data, $recursive_field = null ): bool {
		if ( ! $field->has_conditional_logic() ) {
			return false;
		}

		$passing = self::check_for_conditions( $field, $option_data, $recursive_field );

		return self::apply_conditional_logic( $passing, $field );
	}

	/**
	 * Determines if the fields conditions are met.
	 *
	 * @param Abstract_Field $field
	 * @param array $option_data
	 */
	private static function check_for_conditions( $field, $option_data, $recursive_field ): bool {
		$config     = $field->get_conditional_logic_config();
		$product    = $field->get_product();
		$conditions = $config->conditions;

		if ( $recursive_field ) {
			$conditions = array_filter(
				$conditions,
				function ( $condition ) use ( $recursive_field ) {
					return $condition['optionID'] !== (int) $recursive_field->get_id();
				}
			);
		}

		if ( $config->relation === 'or' ) {
			// pass if any of the conditions are true.
			$matches = array_filter(
				$conditions,
				function ( $condition ) use ( $option_data, $field, $product ) {
					return self::check_condition( $option_data, (object) $condition, $field, $product );
				}
			);

			return count( $matches ) > 0;
		}

		if ( $config->relation === 'and' ) {
			// pass if all conditions are true.
			$matches = array_reduce(
				$conditions,
				function ( $acc, $condition ) use ( $option_data, $field, $product ) {
					return $acc && self::check_condition( $option_data, (object) $condition, $field, $product );
				},
				true
			);

			return (bool) $matches;
		}
	}

	/**
	 * Check a single condition against the current form values.
	 *
	 * @param array $option_data
	 * @param object $condition
	 * @param WC_Product $product
	 * @return bool Whether the condition is satisfied.
	 */
	private static function check_condition( $option_data, $condition, $recursive_field, $product ): bool {
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		// check if the condition corresponds to an option.
		$option = Option_Model::find( $condition->optionID );

		if ( ! $option || ! $option instanceof Option_Model ) {
			return self::check_product_condition( $condition, $product );
		}

		$key = "option-$condition->optionID";

		// check if the option itself isn't hidden from higher up in the conditional logic.		
		if ( ! isset( $option_data[ $key ] ) ) {
			return (
				$condition->operator === 'empty' ||
				$condition->operator === 'not_contains' ||
				$condition->operator === 'not_equals'
			);
		}

		$class = Util::get_field_class( $option->type );

		if ( ! class_exists( $class ) ) {
			return false;
		}

		$field = new $class( $option, $product );

		// check if the option itself isn't hidden from higher up in the conditional logic.
		if ( self::is_field_hidden( $field, $option_data, $recursive_field ) ) {
			return false;
		}

		$option_values = self::maybe_json_decode( $option_data[ $key ] );

		if ( ! is_array( $option_values ) ) {
			$option_values = [ $option_values ];
		}

		if ( isset( $option_values['products'] ) ) {
			if ( ! is_array( $option_values['products'] ) ) {
				$option_values['products'] = [ $option_values['products'] ];
			} else {
				$option_values = array_reduce(
					array_values( $option_values['products'] ),
					function ( $acc, $product ) {
						return array_merge( $acc, array_values( $product ) );
					},
					[]
				);
			}
		}

		return self::compare( $option_values, $condition );
	}

	/**
	 * Check a condition based on the current product.
	 *
	 * @param array|object $condition
	 * @param WC_Product $product
	 * @return bool
	 */
	public static function check_product_condition( $condition, $product ): bool {
		$condition = (object) $condition;
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$key     = $condition->optionID;
		$subtype = explode( '_', $key );

		switch ( $subtype[0] ) {
			case 'product':
				$getter = 'get_' . $subtype[1];
				return self::compare( [ $product->$getter() ], $condition );
			case 'pa':
				$attribute = filter_input( INPUT_POST, "attribute_pa_{$subtype[1]}" );

				if ( $attribute ) {
					$attribute = [ $attribute ];
				} else {
					$attribute = array_map( 'trim', explode( ',', strtolower( $product->get_attribute( $subtype[1] ) ) ) );
				}

				return self::compare( $attribute, $condition );
		}

		return false;
	}

	/**
	 * Check if the field meets the product conditions.
	 *
	 * @param Fields\Abstract_Field $field
	 * @return bool
	 */
	public static function check_product_conditions( $field ): bool {
		if ( ! $field->has_conditional_logic() ) {
			return true;
		}

		$config     = $field->get_conditional_logic_config();
		$conditions = $config->conditions ?? [];

		$product    = $field->get_product();
		$conditions = array_filter(
			$conditions,
			function ( $condition ) {
				$key     = $condition['optionID'] ?? '';
				$subtype = explode( '_', $key );
				return in_array( $subtype[0], [ 'product', 'pa' ], true );
			}
		);

		if ( empty( $conditions ) ) {
			return true;
		}

		if ( $config->relation === 'or' ) {
			// pass if any of the conditions are true.
			$matches = array_filter(
				$conditions,
				function ( $condition ) use ( $product ) {
					return self::check_product_condition( $condition, $product );
				}
			);

			return count( $matches ) > 0;
		}

		if ( $config->relation === 'and' ) {
			// pass if all conditions are true.
			$matches = array_reduce(
				$conditions,
				function ( $acc, $condition ) use ( $product ) {
					return $acc && self::check_product_condition( $condition, $product );
				},
				true
			);

			return (bool) $matches;
		}

		return false;
	}

	/**
	 * Determine whether the field can de displayed based on product conditions
	 * such as weight, dimensions or attributes.
	 *
	 * @param Fields\Abstract_Field $field
	 */
	public static function shall_display_field( $field ): bool {
		if ( ! $field->has_conditional_logic() ) {
			return true;
		}

		$config = $field->get_conditional_logic_config();

		if ( $config->visibility === 'hide' ) {
			return ! self::check_product_conditions( $field );
		}

		if ( $config->visibility === 'show' ) {
			return self::check_product_conditions( $field );
		}

		return true;
	}

	/**
	 * Compare the option values against the condition.
	 *
	 * @param array $option_values
	 * @param object $condition
	 * @return bool
	 */
	public static function compare( $option_values, $condition ) {
		if ( isset( $option_values['products'] ) ) {
			$option_values['products'] = array_reduce(
				array_values( $option_values['products'] ),
				function ( $acc, $product ) {
					if ( is_string( $product ) ) {
						return array_merge( $acc, explode( ',', $product ) );
					}

					return array_merge( $acc, array_values( $product ) );
				},
				[]
			);

			$option_values = $option_values['products'];
		}

		if ( count( $option_values ) === 1 ) {
			switch ( $condition->operator ) {
				case 'contains':
				case 'equals':
					return $condition->value === 'any' ? true : $option_values[0] === $condition->value;
				case 'not_contains':
				case 'not_equals':
					return $condition->value === 'any' ? false : $option_values[0] !== $condition->value;
				case 'greater':
					return (float) $option_values[0] > (float) $condition->value;
				case 'less':
					return (float) $option_values[0] < (float) $condition->value;
				case 'not_empty':
					return strlen( $option_values[0] ) > 0;
				case 'empty':
					return strlen( $option_values[0] ) === 0;
				case 'date_greater':
				case 'date_less':
				case 'date_equals':
				case 'date_not_equals':
					$field_date     = new DateTime( $option_values[0] );
					$condition_date = new DateTime( $condition->value );

					switch ( $condition->operator ) {
						case 'date_greater':
							return $field_date->format( 'U' ) > $condition_date->format( 'U' );
						case 'date_less':
							return $field_date->format( 'U' ) < $condition_date->format( 'U' );
						case 'date_equals':
							return $field_date->format( 'Y-m-d' ) === $condition_date->format( 'Y-m-d' );
						case 'date_not_equals':
							return $field_date->format( 'Y-m-d' ) !== $condition_date->format( 'Y-m-d' );
					}
			}
		} else {
			switch ( $condition->operator ) {
				case 'contains':
				case 'equals':
					return $condition->value === 'any' ? true : in_array( $condition->value, $option_values, true );
				case 'not_contains':
				case 'not_equals':
					return $condition->value === 'any' ? count( $option_values ) === 0 : ! in_array( $condition->value, $option_values, true );
				case 'empty':
					return count( $option_values ) === 0;
				case 'not_empty':
					return count( $option_values ) > 0;
			}
		}

		return false;
	}

	/**
	 * Decode a variable if it is a JSON string.
	 *
	 * @param mixed $json_value
	 * @return mixed
	 */
	public static function maybe_json_decode( $json_value ) {
		if ( is_string( $json_value ) && is_array( json_decode( $json_value, true ) ) ) {
			$json_value = json_decode( $json_value, true );
		}

		return $json_value;
	}
}
