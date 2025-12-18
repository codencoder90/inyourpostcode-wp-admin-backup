<?php
namespace Barn2\Plugin\WC_Product_Options\Admin;

use Barn2\Plugin\WC_Product_Options\Model\Option as Option_Model;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Plugin\Licensed_Plugin;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;
use Barn2\Plugin\WC_Product_Options\Formula;

use Transliterator;

/**
 * Hook into the plugin activation process.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Version_Updater implements Registerable, Standard_Service {

	/**
	 * Plugin's entry file
	 *
	 * @var string
	 */
	private $file;

	/**
	 * Plugin instance
	 *
	 * @var Plugin
	 */
	private $plugin;

	/**
	 * Version updates available for the current version
	 *
	 * @var array $version_updates Array of version numbers
	 */
	private $version_updates = [
		'2.2.0',
		'2.3.0',
	];

	/**
	 * Class constructor
	 *
	 * @param Licensed_Plugin $plugin
	 */
	public function __construct( Licensed_Plugin $plugin ) {
		$this->plugin = $plugin;
	}

	/**
	 * Register the service
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'admin_init', [ $this, 'run_updates' ], 1 );
	}

	/**
	 * Run updates based on the database version number.
	 *
	 * @return void
	 */
	public function run_updates(): void {
		if ( wp_doing_ajax() ) {
			return;
		}

		$db_version = get_option( 'woocommerce_product_options_version' );

		foreach ( $this->version_updates as $version ) {
			if ( ! $db_version || version_compare( $db_version, $version, '<' ) ) {
				$method = 'update_' . str_replace( '.', '', $version );

				if ( method_exists( $this, $method ) ) {
					$this->$method();
				}
			}
		}
	}

	/**
	 * Update to version 2.2.0
	 *
	 * @return void
	 */
	public function update_220(): void {
		$update_version = '2.2.0';
		$this->plugin->get_license()->refresh();
		update_option( 'woocommerce_product_options_version', $update_version );
	}

	/**
	 * Update to version 2.3.0
	 *
	 * @return void
	 */
	public function update_230(): void {
		$update_version = '2.3.0';
		$options        = Option_Model::where( 'type', 'price_formula' )->get();

		if ( $options->isEmpty() ) {
			update_option( 'woocommerce_product_options_version', $update_version );
			return;
		}

		if ( filter_input( INPUT_GET, 'conversion' ) === 'done' ) {
			$this->plugin->notices()->add_info_notice(
				'wpo_formula_conversion_done',
				$this->plugin->get_name(),
				__( 'All price formulas have been successfully converted. Please double-check that everything works as expected.', 'woocommerce-product-options' ),
				[
					'screens' => [],
				]
			);
			update_option( 'woocommerce_product_options_version', $update_version );
		} elseif ( filter_input( INPUT_GET, 'action' ) === 'update-price-formulas' ) {
			$this->convert_formulas();
			wp_safe_redirect( admin_url( 'edit.php?post_type=product&page=wpo_options&conversion=done' ) );
		} else {
			$this->plugin->notices()->add_info_notice(
				'wpo_formula_conversion',
				$this->plugin->get_name(),
				sprintf(
					// translators: %1$s: link to backup database page
					__( 'Your price formulas will be upgraded to the new version.<br>We strongly recommend you %1$s now and export of all your option groups before updating your formulas.', 'woocommerce-product-options' ),
					'<a href="https://developer.wordpress.org/advanced-administration/security/backup/database/">' . __( 'backup your database', 'woocommerce-product-options' ) . '</a>'
				),
				[
					'screens' => [],
					'buttons' => [
						[
							'value' => __( 'Export option groups', 'woocommerce-product-options' ),
							'href'  => admin_url( 'edit.php?post_type=product&page=wpo_options&action=update-price-formulas' ),
							'class' => 'button action-export',
						],
						[
							'value' => __( 'Update price formulas', 'woocommerce-product-options' ),
							'href'  => admin_url( 'edit.php?post_type=product&page=wpo_options&action=update-price-formulas' ),
							'class' => 'button button-primary action-update',
							'style' => 'margin-left: 10px;',
						],
					],
				]
			);
		}
	}

	/**
	 * Convert all the formulas to version 2.3.0
	 *
	 * @return void
	 */
	public function convert_formulas(): void {
		$options = Option_Model::where( 'type', 'price_formula' )->get();

		foreach ( $options as $option ) {
			self::convert_formula( $option );
		}
	}

	/**
	 * Convert a price formula option to the new format.
	 *
	 * @param Option_Model $option The option to convert.
	 * @return void
	 */
	public static function convert_formula( $option ) {
		if ( ! self::do_option_need_conversion( $option ) ) {
			return;
		}

		$settings              = $option->settings;
		$formula               = $settings['formula'] ?? '';
		$changes               = 0;
		$are_variables_missing = false;

		if ( ! empty( $formula ) ) {
			$variables        = $formula['variables'] ?? [];
			$custom_variables = $formula['customVariables'] ?? [];

			foreach ( $variables as $key => $variable ) {
				if ( $variable['type'] === 'product' ) {
					// the variable is a product property, so we can skip it
					continue;
				}

				$old_name   = $variable['name'];
				$tokens     = explode( '.', $old_name );
				$var_option = Option_Model::where( 'id', $variable['id'] )
					->whereRaw( 'LOWER( REGEXP_REPLACE( name, "[ \-]", "_" ) ) = ?', strtolower( $tokens[0] ) )
					->first();

				if ( ! $var_option ) {
					// we could not find the option using its ID
					// it probably means that the option was imported from a different site
					// and its ID has changed in the current site
					$var_option = Option_Model::where( 'group_id', $option->group_id )
						->where( 'id', '!=', $option->id )
						->whereRaw( 'LOWER( REGEXP_REPLACE( name, "[ \-]", "_" ) ) = ?', strtolower( $tokens[0] ) )
						->first();
				}

				if ( ! $var_option ) {
					// we could not find the option using its name either
					// this could be the result
					$are_variables_missing = true;
					unset( $variables[ $key ] );
					continue;
				}

				$variables[ $key ]  = self::process_new_variable( $var_option, $tokens );
				$formula['formula'] = str_replace( "[{$old_name}]", "[{$variables[ $key ]['name']}]", $formula['formula'] );

				foreach ( $custom_variables as $cv_key => $custom_variable ) {
					$custom_variables[ $cv_key ]['formula'] = str_replace( "[{$old_name}]", "[{$variables[ $key ]['name']}]", $custom_variable['formula'] );
				}

				++$changes;
			}

			// If we removed any variables in the previous loop, it means that some variables are missing
			// possibly because the name was transliterated by the script and cannot be found in the database.
			// Fortunately, the formula would still contain the exact (or sanitized) name of the option,
			// so we can use that to look for any missing variables and add it back to the variables array.
			if ( $are_variables_missing ) {
				$expanded_formula = strtolower( $formula['formula'] );

				foreach ( array_reverse( $custom_variables ) as $custom_variable ) {
					$expanded_formula = str_replace( strtolower( "[{$custom_variable['name']}]" ), strtolower( "({$custom_variable['formula']})" ), $expanded_formula );
				}
				// get every variable in the formula
				preg_match_all( '/\[(.*?)\]/', $expanded_formula, $matches );

				$missing_variables = array_values( array_unique( $matches[1] ?? [] ) );

				foreach ( $missing_variables as $missing_variable ) {
					$variable_name = str_replace( [ '[', ']' ], '', $missing_variable );
					$tokens        = explode( '.', $variable_name );
					$var_option    = Option_Model::where( 'group_id', $option->group_id )
						->where( 'id', '!=', $option->id )
						->whereRaw( 'LOWER( REPLACE( name, " ", "_" ) ) = ?', strtolower( $tokens[0] ) )
						->first();

					if ( $var_option && ! in_array( $variable_name, array_column( $variables, 'name' ), true ) ) {
						$new_variable       = self::process_new_variable( $var_option, $tokens );
						$variables[]        = $new_variable;
						$formula['formula'] = str_replace( "[{$missing_variable}]", "[{$new_variable['name']}]", $formula['formula'] );

						foreach ( $custom_variables as $cv_key => $custom_variable ) {
							$custom_variables[ $cv_key ]['formula'] = str_replace( "[{$missing_variable}]", "[{$new_variable['name']}]", $custom_variable['formula'] );
						}

						++$changes;
					}
				}
			}
		}

		if ( $changes > 0 ) {
			$formula['variables']       = array_values( $variables );
			$formula['customVariables'] = array_values( $custom_variables );
			$settings['formula']        = $formula;
			$option->settings           = $settings;
			$formula_object             = new Formula( $option );
			$formula['expression']      = $formula_object->get_expression();
			$formula['valid']           = true;

			$settings['formula'] = $formula;
			$option->settings    = $settings;
			$option->save();
		}
	}

	/**
	 * Process a variable from an older formula to a new variable format.
	 *
	 * @param Option_Model $var_option The option object the variable is referring to.
	 * @param array        $tokens     The exploded variable name.
	 * @return array                   The new variable array.
	 */
	private static function process_new_variable( $var_option, $tokens ) {
		$var_name       = "var{$var_option->id}";
		$new_name       = $tokens[0];
		$transliterator = Transliterator::create( 'Any-Latin; Latin-ASCII; Lower()' );

		switch ( count( $tokens ) ) {
			case 1:
				break;
			case 2:
				$var_name .= ".{$tokens[1]}";
				$new_name .= ".{$tokens[1]}";
				break;
			case 4:
				$index = array_search(
					strtolower( $tokens[2] ),
					array_map(
						function ( $choice_label ) {
							return str_replace( [ ' ', '-' ], '_', strtolower( $choice_label ) );
						},
						array_column( $var_option->choices, 'label' )
					),
					true
				);

				if ( $index === false ) {
					$index = array_search(
						strtolower( $tokens[2] ),
						array_map(
							function ( $choice_label ) use ( $transliterator ) {
								return $transliterator->transliterate( str_replace( [ ' ', '-' ], '_', $choice_label ) );
							},
							array_column( $var_option->choices, 'label' )
						),
						true
					);
				}

				if ( $index !== false ) {
					$var_name .= ".choices.choice{$index}.{$tokens[3]}";
					$label     = str_replace( [ ' ', '-' ], '_', $var_option->choices[ $index ]['label'] );
				} else {
					$var_name .= ".choices.choice0.{$tokens[3]}";
					$label     = str_replace( [ ' ', '-' ], '_', $var_option->choices[0]['label'] );
				}

				$new_name .= ".choices.{$label}.{$tokens[3]}";
				break;
		}

		return [
			'id'        => $var_option->id,
			'name'      => str_replace( [ ' ', '-' ], '_', $new_name ),
			'var'       => $var_name,
			'type'      => "{$var_option->type}_option",
			'valueType' => isset( $tokens[2] ) ? 'array' : 'scalar',
		];
	}

	/**
	 * Determine whether an option are already converted to the new format.
	 *
	 * The method will check if the option has a formula and if the formula has any variables that need conversion.
	 * If the formula has no variables or all of them are already in the new format, the method will return false.
	 *
	 * @param Option_Model $option The option to check.
	 */
	private static function do_option_need_conversion( $option ) {
		if ( $option->type !== 'price_formula' ) {
			return false;
		}

		$settings = $option->settings;
		$formula  = $settings['formula'] ?? '';

		if ( empty( $formula ) ) {
			return false;
		}

		$variables = $formula['variables'] ?? [];

		if ( empty( $variables ) ) {
			return false;
		}

		foreach ( $variables as $variable ) {
			if ( $variable['type'] === 'product' ) {
				continue;
			}

			$tokens     = explode( '.', $variable['var'] ?? '' );
			$var_id     = str_replace( 'var', '', $tokens[0] );
			$var_option = Option_Model::where( 'group_id', $option->group_id )->where( 'id', $var_id )->first();

			if ( ! $var_option ) {
				return true;
			}
		}

		// all variables are already in the new format
		return false;
	}
}
