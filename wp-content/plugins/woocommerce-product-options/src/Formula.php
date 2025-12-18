<?php

namespace Barn2\Plugin\WC_Product_Options;

use Barn2\Plugin\WC_Product_Options\Model\Option;

/**
 * Model for handling price formula data.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Formula {

	/**
	 * The option ID.
	 *
	 * @var int
	 */
	private $option_id;

	/**
	 * The option settings.
	 *
	 * @var array
	 */
	private $settings;

	/**
	 * The formula data.
	 *
	 * @var array
	 */
	private $data;

	/**
	 * Whether to exclude the product price from the formula.
	 *
	 * @var bool
	 */
	private $exclude_product_price;

	/**
	 * A list of custom functions.
	 *
	 * The custom functions are provided as an associative array
	 * where the key is the function name and the value is the function definition.
	 *
	 * @var array
	 */
	private $custom_functions;

	/**
	 * Constructor.
	 *
	 * @param Option $option
	 * @throws \InvalidArgumentException If the option is not an Option or is not a price formula.
	 */
	public function __construct( $option ) {
		if ( ! $option instanceof Option ) {
			throw new \InvalidArgumentException( 'Invalid option' );
		}

		if ( $option['type'] !== 'price_formula' ) {
			throw new \InvalidArgumentException( 'Invalid option type' );
		}

		$this->option_id             = $option->id;
		$this->settings              = $option->settings;
		$this->data                  = $option->settings['formula'] ?? [];
		$this->exclude_product_price = $option->settings['exclude_product_price'] ?? false;

		$this->data['validationError'] = $this->data['validationError'] ?? false;
	}

	/**
	 * Determines whether the current data is sufficient to evaluate the formula.
	 *
	 * @return bool
	 */
	public function check_validity() {
		if ( $this->data['validationError'] || empty( $this->data['formula'] ) || empty( $this->data['expression'] ) ) {
			$this->set_valid( false );
			return false;
		}

		return true;
	}

	/**
	 * Updates a variable name in the formula.
	 *
	 * @param int $option_id
	 * @param string $name
	 */
	public function update_variable_name( $option_id, $name ) {
		$keys = array_filter(
			array_keys( $this->data['variables'] ),
			function ( $key ) use ( $option_id ) {
				return $this->data['variables'][ $key ]['id'] === $option_id;
			}
		);

		foreach ( $keys as $key ) {
			$old_name = $this->data['variables'][ $key ]['name'];
			$old_name = explode( '.', $old_name )[0] ?? $old_name;

			$this->data['variables'][ $key ]['name'] = preg_replace( "/^{$old_name}/i", $name, $this->data['variables'][ $key ]['name'] );
			$this->data['expression']                = preg_replace( "/([^\.])$old_name/i", "$1{$name}", $this->data['expression'] );
			$this->data['formula']                   = preg_replace( "/([^\.])$old_name/i", "$1{$name}", $this->data['formula'] );
		}
	}

	/**
	 * Updates a variable id in the formula.
	 *
	 * @param int $new_id
	 * @param int $old_id
	 */
	public function update_variable_id( $new_id, $old_id ) {
		$keys = array_filter(
			array_keys( $this->data['variables'] ),
			function ( $key ) use ( $old_id ) {
				return $this->data['variables'][ $key ]['id'] === $old_id;
			}
		);

		foreach ( $keys as $key ) {
			$this->data['variables'][ $key ]['id'] = $new_id;
		}
	}

	/**
	 * Saves the formula data to the database.
	 */
	public function save() {
		$this->settings['formula'] = $this->data;
		Option::where( [ 'id' => $this->option_id ] )->update( [ 'settings' => $this->settings ] );
	}

	/**
	 * Sets the price formula for the field.
	 *
	 * @param string $formula
	 */
	public function set_formula( string $formula ): void {
		$this->data['formula'] = $formula;
	}

	/**
	 * Sets the expression for the executor.
	 *
	 * @param string $expression
	 */
	public function set_expression( string $expression ): void {
		$this->data['expression'] = $expression;
	}

	/**
	 * Sets the price formula variables for the field.
	 *
	 * @param array $variables
	 */
	public function set_variables( array $variables ): void {
		$this->data['variables'] = $variables;
	}

	/**
	 * Sets the price formula variables for the field.
	 *
	 * @param array $variables
	 */
	public function set_custom_variables( array $variables ): void {
		$this->data['customVariables'] = $variables;
	}

	/**
	 * Sets the valid status of the formula.
	 *
	 * @param bool $valid
	 */
	public function set_valid( bool $valid ): void {
		$this->data['valid'] = $valid;
	}

	/**
	 * Gets the price formula for the field.
	 *
	 * @return string
	 */
	public function get_formula(): string {
		return $this->data['formula'] ?? '';
	}

	/**
	 * Gets the expression for the executor.
	 *
	 * The expression is stored in the formula configuration.
	 * Nevertheless, there might be situations where the expression
	 * cannot be updated because the update only occurs on the client side
	 * when a formula is edited. This means that the expression stored in the database
	 * might be outdated and not reflect the current formula.
	 * To avoid this, we manually regenerate the expression here by:
	 *     * converting the expression to lower case;
	 *     * iteratively replacing custom variables with their formulas;
	 *     * removing the square brackets around each variable name.
	 *
	 * Additionally, we can pass a custom variable name to get the expression for that variable
	 * instead of the expression for the main formula.
	 *
	 * @param string|null $custom_variable_name Optionally, the name of the custom variable to get the expression for.
	 * @return string
	 */
	public function get_expression( $custom_variable_name = null ): string {
		$expression       = $this->data['formula'] ?? '';
		$variables        = $this->get_variables();
		$custom_variables = $this->get_custom_variables();
		$custom_variables = array_map(
			function ( $variable, $index ) {
				$variable['index'] = $index;
				return $variable;
			},
			$custom_variables,
			array_keys( $custom_variables )
		);

		if ( $custom_variable_name ) {
			$custom_variable_formulas = array_filter(
				$custom_variables,
				function ( $custom_variable ) use ( $custom_variable_name ) {
					return $custom_variable['name'] === $custom_variable_name;
				}
			);

			if ( empty( $custom_variable_formulas ) ) {
				return '';
			}

			$expression = reset( $custom_variable_formulas )['formula'];
		}

		$expression = array_reduce(
			// we need to reverse the array of custom variables
			// so that they evaluated from bottom to top
			array_reverse( $custom_variables ),
			function ( $expression, $variable ) {
				$variable_name    = strtolower( $variable['name'] );
				$variable_formula = strtolower( $variable['formula'] );
				return str_replace( "[$variable_name]", "($variable_formula)", $expression );
			},
			strtolower( $expression )
		);

		foreach ( $variables as $variable ) {
			$variable_name = strtolower( $variable['name'] ?? '' );
			$variable_var  = strtolower( ( $variable['var'] ?? '' ) ?: $variable_name );

			if ( ! empty( $variable_name ) ) {
				$expression = str_replace( "[{$variable_name}]", "[{$variable_var}]", $expression );
			}
		}

		return preg_replace( '/[\[\]\s]/', '', $expression );
	}

	/**
	 * Gets the price formula variables for the field.
	 *
	 * @return array
	 */
	public function get_variables(): array {
		return $this->data['variables'] ?? [];
	}

	/**
	 * Gets the price formula variables for the field.
	 *
	 * @return array
	 */
	public function get_custom_variables(): array {
		return $this->data['customVariables'] ?? [];
	}

	/**
	 * Gets the price formula variables for the field.
	 *
	 * @return string
	 */
	public function get_valid(): bool {
		return $this->data['valid'] ?? false;
	}

	/**
	 * Whether the product product price should be excluded because of the formula.
	 */
	public function exclude_product_price(): bool {
		return $this->exclude_product_price;
	}
}
