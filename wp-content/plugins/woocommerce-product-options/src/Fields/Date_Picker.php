<?php
namespace Barn2\Plugin\WC_Product_Options\Fields;

use Barn2\Plugin\WC_Product_Options\Util\Util;
use Barn2\Plugin\WC_Product_Options\Util\Conditional_Logic as Conditional_Logic_Util;
use WP_Error;
use DateTime;
use DateInterval;
use Exception;

/**
 * Date_Picker input field class.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Date_Picker extends Abstract_Field {

	protected $type           = 'datepicker';
	protected $has_user_value = true;

	/**
	 * Supports multiple values (e.g checkboxes, radios).
	 *
	 * @var bool
	 */
	protected $supports_multiple_values = false;

	/**
	 * {@inheritDoc}
	 */
	protected $used_settings = [ 'datepicker' ];

	/**
	 * The datepicker setting.
	 *
	 * @var array
	 */
	protected $datepicker;

	/**
	 * Defaults values for the datepicker.
	 *
	 * @var array
	 */
	private $datepicker_defaults = [
		'enable_time'          => false,
		'min_date'             => false,
		'max_date'             => false,
		'min_time'             => '0:00',
		'max_time'             => '23:59',
		'minute_increment'     => 15,
		'hour_increment'       => 1,
		'disable_days'         => [],
		'disable_dates'        => '',
		'disable_past_dates'   => false,
		'disable_future_dates' => false,
		'disable_today'        => false,
		'date_format'          => 'F j, Y',
	];

	/**
	 * Validate the filed value.
	 *
	 * @param mixed $value
	 * @return WP_Error|true
	 */
	public function validate( $value, $option_data ) {
		// Check if the field is required
		if ( $this->is_required() && empty( $value ) && ! Conditional_Logic_Util::is_field_hidden( $this, $option_data ) ) {
			return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is a required field for "%2$s".', 'woocommerce-product-options' ), $this->option->name, $this->product->get_name() ) ) );
		}

		// Check if the field is empty
		if ( empty( $value ) ) {
			return true;
		}

		$format = $this->get_validation_date_format();
		$date   = $this->get_datetime_object( $value );

		// check date is valid
		if ( ! $date || $date->format( $format ) !== $value ) {
			return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is not a valid date for "%2$s".', 'woocommerce-product-options' ), $value, $this->product->get_name() ) ) );
		}

		$restrictions = $this->get_restrictions();

		// check date is not before min date
		if ( $restrictions->min_date ) {
			// check if dynamic date
			if ( $this->is_dynamic_date( $restrictions->min_date ) ) {
				$min_date = $this->parse_dynamic_date( $restrictions->min_date );
			} else {
				$min_date = $this->get_datetime_object( $restrictions->min_date );
			}

			if ( ! $min_date ) {
				return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( 'Invalid minimum date for "%1$s".', 'woocommerce-product-options' ), $this->product->get_name() ) ) );
			}

			if ( $date < $min_date ) {
				return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is before the minimum date for "%2$s".', 'woocommerce-product-options' ), $value, $this->product->get_name() ) ) );
			}
		}

		// check date is not after max date
		if ( $restrictions->max_date ) {
			// check if dynamic date
			if ( $this->is_dynamic_date( $restrictions->max_date ) ) {
				$max_date = $this->parse_dynamic_date( $restrictions->max_date );
			} else {
				$max_date = $this->get_datetime_object( $restrictions->max_date );
			}

			if ( ! $max_date ) {
				return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( 'Invalid maximum date for "%1$s".', 'woocommerce-product-options' ), $this->product->get_name() ) ) );
			}

			// add 23:59:59 to max date
			$max_date->add( new DateInterval( 'PT23H59M59S' ) );

			if ( $date > $max_date ) {
				return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is after the maximum date for "%2$s".', 'woocommerce-product-options' ), $value, $this->product->get_name() ) ) );
			}
		}

		// check date is not in excluded dates
		if ( $restrictions->disable_dates ) {
			$disable_dates = array_map( 'trim', explode( ',', $restrictions->disable_dates ) );

			foreach ( $disable_dates as $disabled_date ) {
				// check if dynamic date
				if ( $this->is_dynamic_date( $disabled_date ) ) {
					$disabled_date = $this->parse_dynamic_date( $disabled_date );
				} else {
					$disabled_date = $this->get_datetime_object( $disabled_date );
				}

				if ( ! $disabled_date ) {
					return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( 'Invalid disabled date for "%1$s".', 'woocommerce-product-options' ), $this->product->get_name() ) ) );
				}

				if ( $date->format( 'Y-m-d' ) === $disabled_date->format( 'Y-m-d' ) ) {
					return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is an excluded date for "%2$s".', 'woocommerce-product-options' ), $value, $this->product->get_name() ) ) );
				}
			}
		}

		// check pasts dates are not allowed (-1 day)
		if ( $restrictions->disable_past_dates && $date < $this->get_datetime_object( '-1 day' ) ) {
			return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is a disabled past date for "%2$s".', 'woocommerce-product-options' ), $value, $this->product->get_name() ) ) );
		}

		// check future dates are not allowed
		if ( $restrictions->disable_future_dates && $date > $this->get_datetime_object( '+1 day' ) ) {
			return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is a disabled future date for "%2$s".', 'woocommerce-product-options' ), $value, $this->product->get_name() ) ) );
		}

		// check today is not allowed (ignore time)
		$today = $this->get_datetime_object();

		if ( $restrictions->disable_today && $date->format( 'Y-m-d' ) === $today->format( 'Y-m-d' ) ) {
			return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is a disabled date for "%2$s".', 'woocommerce-product-options' ), $value, $this->product->get_name() ) ) );
		}

		// check date is not in disabled days
		if ( $restrictions->disable_days ) {
			$disable_days = array_map(
				function ( $day ) {
					return trim( $day, ' []' );
				},
				explode( ',', $restrictions->disable_days )
			);

			if ( in_array( $date->format( 'w' ), $disable_days, true ) ) {
				return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is a disabled day for "%2$s".', 'woocommerce-product-options' ), $value, $this->product->get_name() ) ) );
			}
		}

		// check time meets the increment if time is enabled
		if ( $restrictions->enable_time ) {
			// check min time (hours and minutes only)
			if ( $restrictions->min_time ) {
				$min_time = ( $this->get_datetime_object( $restrictions->min_time ) )->format( 'H:i' );

				if ( $date->format( 'H:i' ) < $min_time ) {
					return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is before the minimum time for "%2$s".', 'woocommerce-product-options' ), $value, $this->product->get_name() ) ) );
				}
			}

			// check max time (hours and minutes only)
			if ( $restrictions->max_time ) {
				$max_time = ( $this->get_datetime_object( $restrictions->max_time ) )->format( 'H:i' );

				if ( $date->format( 'H:i' ) > $max_time ) {
					return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is after the maximum time for "%2$s".', 'woocommerce-product-options' ), $value, $this->product->get_name() ) ) );
				}
			}

			// check hour increment
			$increment = $restrictions->hour_increment;

			if ( $increment ) {
				$hours = $date->format( 'H' );

				if ( $hours % $increment !== 0 ) {
					return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is not a valid hour increment for "%2$s".', 'woocommerce-product-options' ), $value, $this->product->get_name() ) ) );
				}
			}

			// check minute increment
			$increment = $restrictions->minute_increment;

			if ( $increment ) {
				$minutes = $date->format( 'i' );

				if ( $minutes % $increment !== 0 ) {
					return new WP_Error( 'wpo-validation-error', esc_html( sprintf( __( '"%1$s" is not a valid minute increment for "%2$s".', 'woocommerce-product-options' ), $value, $this->product->get_name() ) ) );
				}
			}
		}

		return true;
	}

	/**
	 * Render the HTML for the field.
	 */
	public function render(): void {
		if ( ! $this->has_display_prerequisites() ) {
			return;
		}

		$this->render_field_wrap_open();

		$this->render_option_name();
		$this->render_input();
		$this->render_description();

		$this->render_field_wrap_close();
	}


	/**
	 * Render the HTML for the field input.
	 */
	private function render_input(): void {

		$html = sprintf(
			'<label for="%1$s" aria-label="%8$s">%4$s %5$s</label>
			<div class="wpo-datepicker-container">
				<input type="text" id="%1$s" name="%2$s" %3$s %6$s %7$s data-input>
				<a class="input-button wpo-datepicker-clear" title="clear" data-clear>
					<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" role="img" aria-hidden="true" focusable="false"><path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21ZM15.5303 8.46967C15.8232 8.76256 15.8232 9.23744 15.5303 9.53033L13.0607 12L15.5303 14.4697C15.8232 14.7626 15.8232 15.2374 15.5303 15.5303C15.2374 15.8232 14.7626 15.8232 14.4697 15.5303L12 13.0607L9.53033 15.5303C9.23744 15.8232 8.76256 15.8232 8.46967 15.5303C8.17678 15.2374 8.17678 14.7626 8.46967 14.4697L10.9393 12L8.46967 9.53033C8.17678 9.23744 8.17678 8.76256 8.46967 8.46967C8.76256 8.17678 9.23744 8.17678 9.53033 8.46967L12 10.9393L14.4697 8.46967C14.7626 8.17678 15.2374 8.17678 15.5303 8.46967Z"></path></svg>
				</a>
			</div>',
			esc_attr( $this->get_input_id() ),
			esc_attr( $this->get_input_name() ),
			$this->get_choice_pricing_attributes(),
			$this->get_label(),
			$this->get_choice_pricing_string(),
			$this->get_date_restrictions(),
			$this->is_required() ? 'required' : '',
			esc_attr( $this->get_label( 0, true ) )
		);

		// phpcs:reason This is escaped above.
        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $html;
	}

	private function has_property( $property ) {
		return isset( $this->datepicker[ $property ] ) && ! empty( $this->datepicker[ $property ] );
	}

	private function get_datepicker_property( $property ) {
		return $this->has_property( $property ) ? $this->datepicker[ $property ] : null;
	}

	/**
	 * Get the date restrictions for the field.
	 *
	 * @return string
	 */
	private function get_date_restrictions(): string {
		$restrictions = array_filter(
			array_combine(
				array_map(
					function ( $property ) {
						return 'data-' . str_replace( '_', '-', $property );
					},
					array_keys( $this->datepicker_defaults )
				),
				array_map(
					function ( $property ) {
						switch ( $property ) {
							case 'disable_days':
								return $this->get_datepicker_property( $property )
									? wp_json_encode( $this->get_datepicker_property( $property ) )
									: null;

							case 'date_format':
								return $this->get_combined_date_format();

							default:
								return $this->get_datepicker_property( $property );
						}
					},
					array_keys( $this->datepicker_defaults )
				)
			)
		);

		$attribute_string = Util::get_html_attribute_string( $restrictions );

		return $attribute_string;
	}

	/**
	 * Get the combined date format
	 *
	 * Adds time format to date format if time is enabled.
	 * NOTE: Do not use PHP format characters as they are not compatible with JS.
	 *
	 * @return string
	 */
	protected function get_printable_date_format() {
		$date_format = get_option( 'date_format' );

		if ( $this->has_property( 'enable_time' ) ) {
			$date_format .= ' ' . get_option( 'time_format' );
		}

		return $date_format;
	}

	/**
	 * Get the combined date format
	 *
	 * Adds time format to date format if time is enabled.
	 * NOTE: Do not use PHP format characters as they are not compatible with JS.
	 *
	 * @return string
	 */
	protected function get_combined_date_format() {
		$date_format = $this->get_date_format();

		if ( $this->has_property( 'enable_time' ) ) {
			$date_format .= ' H:i';
		}

		return $date_format;
	}

	/**
	 * Get the date format
	 *
	 * @return string
	 */
	protected function get_date_format(): string {
		if ( $this->has_property( 'date_format' ) ) {
			$date_format = $this->datepicker['date_format'];
		} else {
			$date_format = 'F j, Y';
		}

		return $date_format;
	}

	protected function get_validation_date_format(): string {
		$date_format = 'Y-m-d';

		if ( $this->has_property( 'enable_time' ) ) {
			$date_format .= ' H:i';
		}

		return $date_format;
	}

	/**
	 * Get the datepicker restrictions
	 *
	 * @return object
	 */
	private function get_restrictions() {
		$restrictions = array_filter(
			array_combine(
				array_keys( $this->datepicker_defaults ),
				array_map(
					function ( $property, $default ) {
						switch ( $property ) {
							case 'disable_days':
								return $this->get_datepicker_property( $property )
									? wp_json_encode( $this->get_datepicker_property( $property ) )
									: $default;

							case 'date_format':
								return $this->get_combined_date_format();

							default:
								return $this->get_datepicker_property( $property ) ?? $default;
						}
					},
					array_keys( $this->datepicker_defaults ),
					$this->datepicker_defaults
				)
			)
		);

		return (object) array_merge( $this->datepicker_defaults, $restrictions );
	}

	/**
	 * Retrives the date object from a date string.
	 *
	 * @param mixed $date_string
	 * @return null|DateTime
	 */
	private function get_datetime_object( $date_string = 'now' ) {
		try {
			$date = new DateTime( $date_string, wp_timezone() );
		} catch ( Exception $e ) {
			$date = null;
		}

		return $date;
	}

	/**
	 * Check if string is a dynamic date string.
	 * .e.g +112d, -22w, +3m, -4y
	 *
	 * @param {string} date_string
	 * @return {boolean} isDynamicDate
	 */
	private function is_dynamic_date( $date_string ) {
		return preg_match( '/^([+-])(\d+)([dwmy])$/', $date_string );
	}


	/**
	 * Parse a dynamic date string and return a date object.
	 * e.g +112d, -22w, +3m, -4y
	 *
	 * @param string dynamic_date_string
	 * @return DateTime|null date
	 */
	private function parse_dynamic_date( $dynamic_date_string ) {
		$dynamic_date_string = trim( $dynamic_date_string );

		if ( ! preg_match( '/^([+-])(\d+)([dwmy])$/', $dynamic_date_string, $matches ) ) {
			return null;
		}

		$sign   = $matches[1];
		$amount = $matches[2];
		$unit   = $matches[3];

		$now = $this->get_datetime_object();

		switch ( $unit ) {
			case 'd':
				$interval = new DateInterval( 'P' . $amount . 'D' );
				break;
			case 'w':
				$interval = new DateInterval( 'P' . $amount . 'W' );
				break;
			case 'm':
				$interval = new DateInterval( 'P' . $amount . 'M' );
				break;
			case 'y':
				$interval = new DateInterval( 'P' . $amount . 'Y' );
				break;
		}

		if ( $sign === '-' ) {
			$now->sub( $interval );
		} else {
			$now->add( $interval );
		}

		return $now;
	}
}
