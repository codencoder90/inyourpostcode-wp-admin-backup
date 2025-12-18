<?php
/**
 * FormHandler.
 *
 * @since 1.0.0
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 */

namespace ThemeGrill\WooCommerceRegistrationFormBuilder;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

use WC_Emails;
use WP_Error;
use WP_User;

/**
 * FormHandler.
 */
class FormHandler {

	/**
	 * Valid data.
	 *
	 * @var array
	 */
	private $valid_data = array();

	/**
	 * Form id.
	 *
	 * @var null|int
	 */
	private $form_id = null;

	/**
	 * Is update.
	 *
	 * Determine if form is saving new data or updating.
	 *
	 * @var bool
	 */
	private $is_update = false;

	/**
	 * FormHandler constructor.
	 */
	public function __construct() {
		$this->init_hooks();
	}

	/**
	 * Init hooks.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function init_hooks() {
		add_action( 'wp_loaded', array( $this, 'disable_auto_generate_username_password' ), 19 );
		add_action( 'woocommerce_register_post', array( $this, 'validate_fields' ), 10, 3 );
		add_action( 'woocommerce_register_post', array( $this, 'add_user_data' ), 11 );
		add_action( 'woocommerce_after_checkout_validation', array( $this, 'validate_checkout_fields' ), 10, 2 );
		add_action( 'woocommerce_save_account_details_errors', array( $this, 'validate_edit_account_fields' ), 10, 1 );
		add_action( 'woocommerce_save_account_details', array( $this, 'save_fields' ) );
		add_action( 'user_register', array( $this, 'save_fields' ) );
		add_filter( 'woocommerce_registration_redirect', array( $this, 'change_redirect_url' ) );
		add_filter( 'woocommerce_add_error', array( $this, 'change_login_link' ) );
		do_action( 'tgwcfb_form_handler_unhook' );
	}

	/**
	 * Replace login link from error message.
	 *
	 * @since 1.0.0
	 * @param string $message Error message.
	 * @return array|string|string[]
	 */
	public function change_login_link( $message ) {
		if ( false !== strpos( $message, '<a href="#" class="showlogin">Please log in.</a>' ) && ! is_account_page() ) {
			$message = str_replace( 'href="#"', 'href="' . wc_get_page_permalink( 'myaccount' ) . '"', $message );
		}
		return $message;
	}

	/**
	 * Disable WC auto generate username and password.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function disable_auto_generate_username_password() {
		if ( isset( $_POST['tgwcfb-register-nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['tgwcfb-register-nonce'] ) ), 'tgwcfb-register' ) ) {
			add_filter(
				'option_woocommerce_registration_generate_username',
				function () {
					return 'no';
				}
			);
			add_filter(
				'option_woocommerce_registration_generate_password',
				function () {
					return 'no';
				}
			);
		}
	}

	/**
	 * Validate fields.
	 *
	 * @since 1.0.0
	 * @param string   $username Customer email.
	 * @param string   $email User email.
	 * @param WP_Error $errors WP Error.
	 * @return void
	 */
	public function validate_fields( $username, $email, $errors ) {
		if (
			! isset( $_POST['tgwcfb-register-nonce'] ) ||
			! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['tgwcfb-register-nonce'] ) ), 'tgwcfb-register' ) ||
			! isset( $_POST['tgwcfb_id'] ) ||
			is_checkout()
		) {
			return;
		}

		$form_id = intval( wp_unslash( $_POST['tgwcfb_id'] ) );
		$fields  = get_blocks( $form_id );

		if ( empty( $fields ) ) {
			return;
		}

		// Process groups and collect all fields
		$all_fields = parse_grouped_blocks( $fields );

		// Process all collected fields
		foreach ( $all_fields as $field ) {
			$type                                = $field['blockName'];
			list($field_name, $label, $required) = get_field_data( $field );

			// Skip shipping fields if separate shipping is disabled
			if ( empty( $_POST['separate_shipping'] ) && false !== strpos( $field_name, 'shipping_' ) ) {
				continue;
			}

			$value = '';
			if ( ! empty( $_POST[ $field_name ] ) ) {
				switch ( $type ) {
					case 'tgwcfb/checkbox':
					case 'tgwcfb/multi-select':
						$value = array_map( 'sanitize_text_field', (array) wp_unslash( $_POST[ $field_name ] ) );
						break;
					case 'tgwcfb/description':
					case 'tgwcfb/textarea':
						$value = sanitize_textarea_field( wp_unslash( $_POST[ $field_name ] ) );
						break;

					case 'tgwcfb/number':
						$value = intval( wp_unslash( $_POST[ $field_name ] ) );
						break;

					case 'tgwcfb/email':
					case 'tgwcfb/billing-email':
						$value = sanitize_email( wp_unslash( $_POST[ $field_name ] ) );
						break;
					default:
						$value = sanitize_text_field( wp_unslash( $_POST[ $field_name ] ) );
				}
			}

			$this->validate( $type, $field_name, $label, $required, $value, $errors );
			$this->valid_data[ $field_name ] = array(
				'label' => $label,
				'type'  => $type,
				'value' => $value,
			);
		}

		// Captcha verifications.
		$captcha_type = get_option( '_tgwcfb_captcha_type', 'v2' );
		// Initialize variables
		$site_key   = '';
		$secret_key = '';
		$is_enabled = false;

		// Handle reCAPTCHA v2
		if ( 'v2' === $captcha_type ) {
			$site_key   = get_option( '_tgwcfb_site_key' );
			$secret_key = get_option( '_tgwcfb_secret_key' );
			$is_enabled = get_post_meta( $form_id, '_tgwcfb_recaptcha_v2', true );

			if ( ! empty( $site_key ) && ! empty( $secret_key ) && $is_enabled ) {
				$token        = ! empty( $_POST['g-recaptcha-response'] ) ? sanitize_textarea_field( wp_unslash( $_POST['g-recaptcha-response'] ) ) : false;
				$raw_response = wp_safe_remote_get( "https://www.google.com/recaptcha/api/siteverify?secret=$secret_key&response=$token" );

				if ( ! is_wp_error( $raw_response ) ) {
					$response = json_decode( wp_remote_retrieve_body( $raw_response ) );
					if ( empty( $response->success ) ) {
						$errors->add( 'tgwcfb_recaptcha_error', __( 'Google reCAPTCHA verification failed, please try again later.', 'registration-form-for-woocommerce' ) );
					}
				} else {
					$errors->add( 'tgwcfb_recaptcha_error', __( 'Google reCAPTCHA verification failed, please try again later.', 'registration-form-for-woocommerce' ) );
				}
			}
			// Handle reCAPTCHA v3
		} elseif ( 'v3' === $captcha_type ) {
			$site_key   = get_option( '_tgwcfb_recaptcha_v3_site_key' );
			$secret_key = get_option( '_tgwcfb_recaptcha_v3_secrete_key' );
			$is_enabled = get_post_meta( $form_id, '_tgwcfb_recaptcha_v3', true );

			if ( ! empty( $site_key ) && ! empty( $secret_key ) && $is_enabled ) {
				$token        = ! empty( $_POST['recaptcha_token'] ) ? sanitize_textarea_field( wp_unslash( $_POST['recaptcha_token'] ) ) : false;
				$raw_response = wp_safe_remote_get( "https://www.google.com/recaptcha/api/siteverify?secret=$secret_key&response=$token" );

				if ( ! is_wp_error( $raw_response ) ) {
					$response = json_decode( wp_remote_retrieve_body( $raw_response ) );
					if ( empty( $response->success ) ) {
						$errors->add( 'tgwcfb_recaptcha_error', __( 'Google reCAPTCHA verification failed, please try again later.', 'registration-form-for-woocommerce' ) );
					}
				} else {
					$errors->add( 'tgwcfb_recaptcha_error', __( 'Google reCAPTCHA verification failed, please try again later.', 'registration-form-for-woocommerce' ) );
				}
			}
		} elseif ( 'hcaptcha' === $captcha_type ) {
			$site_key   = get_option( '_tgwcfb_hcaptcha_site_key' );
			$secret_key = get_option( '_tgwcfb_hcaptcha_secrete_key' );
			$is_enabled = get_post_meta( $form_id, '_tgwcfb_hcaptcha', true );

			if ( ! empty( $secret_key ) && ! empty( $site_key ) && $is_enabled ) {

				$hcaptcha_response = ! empty( $_POST['h-captcha-response'] ) ? sanitize_text_field( wp_unslash( $_POST['h-captcha-response'] ) ) : false;

				if ( ! $hcaptcha_response ) {
					$errors->add( 'tgwcfb_hcaptcha_error', __( 'Please verify you are human by completing the hCaptcha.', 'registration-form-for-woocommerce' ) );
				} else {
					$verify_url = 'https://hcaptcha.com/siteverify';
					$response   = wp_safe_remote_post(
						$verify_url,
						array(
							'body' => array(
								'secret'   => $secret_key,
								'response' => $hcaptcha_response,
							),
						)
					);

					if ( is_wp_error( $response ) ) {
						$errors->add( 'tgwcfb_hcaptcha_error', __( 'hCaptcha verification failed, please try again later.', 'registration-form-for-woocommerce' ) );
					} else {
						$response_body = json_decode( wp_remote_retrieve_body( $response ) );
						if ( empty( $response_body->success ) || ! $response_body->success ) {
							$errors->add( 'tgwcfb_hcaptcha_error', __( 'hCaptcha verification failed, please try again.', 'registration-form-for-woocommerce' ) );
						}
					}
				}
			}
		}

		if ( in_array( get_post_meta( $form_id, '_tgwcfb_user_approval', true ), array( 'admin_approval', 'email_confirmation' ), true ) ) {
			$this->valid_data['user_status'] = array(
				'label' => __( 'Status', 'registration-form-for-woocommerce' ),
				'type'  => '',
				'value' => 'pending',
			);
		}

		$this->form_id = $form_id;

		if ( empty( $this->valid_data['separate_shipping']['value'] ) ) {
			foreach ( $this->valid_data as $name => $data ) {
				if ( false !== strpos( $name, 'billing_' ) ) {
					list( , $shipping_string ) = explode( 'billing_', $name );
					if ( ! in_array(
						$shipping_string,
						array(
							'first_name',
							'last_name',
							'company',
							'country',
							'address_1',
							'address_2',
							'city',
							'state',
							'postcode',
							'phone',
						),
						true
					) ) {
						continue;
					}

					if ( empty( $this->valid_data[ "shipping_$shipping_string" ]['value'] ) ) {
						$this->valid_data[ "shipping_$shipping_string" ] = array(
							'value' => $data['value'],
							'label' => '',
							'type'  => '',
						);
					}
				}
			}
		}
	}

	/**
	 * Add user data.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function add_user_data() {
		$url  = isset( $this->valid_data['url']['value'] ) ? $this->valid_data['url']['value'] : '';
		$role = 'customer';

		$has_auto_user_role = get_post_meta( $this->form_id, '_tgwcfb_enable_default_user_role', true );
		$auto_user_role     = get_post_meta( $this->form_id, '_tgwcfb_default_user_role', true );

		if ( $has_auto_user_role && $auto_user_role ) {
			$role = $auto_user_role;
		} elseif ( ! empty( $this->valid_data['user_roles']['value'] ) ) {
			$role = $this->valid_data['user_roles']['value'];
		}

		add_filter(
			'woocommerce_new_customer_data',
			function ( $user_data ) use ( $role, $url ) {
				$user_data['role']     = sanitize_text_field( $role );
				$user_data['user_url'] = esc_url_raw( $url );
				return $user_data;
			}
		);
	}

	/**
	 * Validate checkout fields.
	 *
	 * @since 1.0.0
	 * @param array    $data Checkout data.
	 * @param WP_Error $errors WP Errors.
	 * @return void
	 */
	public function validate_checkout_fields( $data, $errors ) {
		if (
			! isset( $_POST['tgwcfb-checkout-register-nonce'] ) ||
			! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['tgwcfb-checkout-register-nonce'] ) ), 'tgwcfb-checkout-register' ) ||
			! is_checkout() ||
			( WC()->checkout()->is_registration_required() && empty( $_POST['createaccount'] ) ) ||
			empty( WC()->checkout()->get_checkout_fields( 'account' ) )
		) {
			return;
		}

		$checkout_fields = get_checkout_blocks();

		foreach ( $checkout_fields as $checkout_field ) {
			$type                                   = $checkout_field['blockName'];
			list ( $field_name, $label, $required ) = get_field_data( $checkout_field );
			$value                                  = '';

			if ( ! empty( $_POST[ $field_name ] ) ) {
				switch ( $type ) {
					case 'tgwcfb/checkbox':
					case 'tgwcfb/multi-select':
						$value = array_map( 'sanitize_text_field', (array) wp_unslash( $_POST[ $field_name ] ) );
						break;
					case 'tgwcfb/description':
					case 'tgwcfb/textarea':
						$value = sanitize_textarea_field( wp_unslash( $_POST[ $field_name ] ) );
						break;

					case 'tgwcfb/number':
						$value = intval( wp_unslash( $_POST[ $field_name ] ) );
						break;

					case 'tgwcfb/email':
					case 'tgwcfb/billing-email':
						$value = sanitize_email( wp_unslash( $_POST[ $field_name ] ) );
						break;
					default:
						$value = sanitize_text_field( wp_unslash( $_POST[ $field_name ] ) );
				}
			}

			$this->validate( $type, $field_name, $label, $required, $value, $errors );

			$this->valid_data[ $field_name ] = array(
				'label' => $label,
				'type'  => $type,
				'value' => $value,
			);
		}

		$this->form_id = get_option( '_tgwcfb_checkout_form_id' );
	}

	/**
	 * Validate edit account fields.
	 *
	 * @since 1.0.0
	 * @param WP_Error $errors Validation errors.
	 * @return void
	 */
	public function validate_edit_account_fields( $errors ) {
		if (
			! isset( $_POST['tgwcfb-edit-account-nonce'] ) ||
			! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['tgwcfb-edit-account-nonce'] ) ), 'tgwcfb-edit-account' )
		) {
			return;
		}

		$user_id = get_current_user_id();
		$form_id = get_user_meta( $user_id, 'tgwcfb_form_id', true );

		if ( empty( $form_id ) ) {
			return;
		}

		$fields    = get_edit_account_blocks( $form_id );
		$user_data = array( 'ID' => $user_id );

		foreach ( $fields as $field ) {
			$type                                   = $field['blockName'];
			list ( $field_name, $label, $required ) = get_field_data( $field );
			$value                                  = '';

			if ( ! empty( $_POST[ $field_name ] ) ) {
				switch ( $type ) {
					case 'tgwcfb/checkbox':
					case 'tgwcfb/multi-select':
						$value = array_map( 'sanitize_text_field', (array) wp_unslash( $_POST[ $field_name ] ) );
						break;
					case 'tgwcfb/description':
					case 'tgwcfb/textarea':
						$value = sanitize_textarea_field( wp_unslash( $_POST[ $field_name ] ) );
						break;

					case 'tgwcfb/number':
						$value = intval( wp_unslash( $_POST[ $field_name ] ) );
						break;

					case 'tgwcfb/email':
					case 'tgwcfb/billing-email':
						$value = sanitize_email( wp_unslash( $_POST[ $field_name ] ) );
						break;
					default:
						$value = sanitize_text_field( wp_unslash( $_POST[ $field_name ] ) );
				}
			}

				$this->validate( $type, $field_name, $label, $required, $value, $errors );

			if ( 'tgwcfb/url' === $type ) {
				$user_data['user_url'] = $value;
			}

			$this->valid_data[ $field_name ] = array(
				'label' => $label,
				'type'  => $type,
				'value' => $value,
			);
		}
		$this->is_update = true;
		$this->form_id   = $form_id;

		wp_update_user( $user_data );
	}

	/**
	 * Save data.
	 *
	 * @since 1.0.0
	 * @param int $user_id User id.
	 * @throws \Exception Exception.
	 * @return void
	 */
	public function save_fields( $user_id ) {

		if ( empty( $this->valid_data ) ) {
			return;
		}

		$user = new WP_User( $user_id );

		foreach ( $this->valid_data as $name => $data ) {
			if ( 'password' === $name ) {
				continue;
			}
			update_user_meta( $user_id, $name, $data['value'] );
		}
		update_user_meta( $user_id, 'tgwcfb_form_id', is_checkout() ? get_option( '_tgwcfb_checkout_form_id' ) : $this->form_id );

		wc()->mailer();

		if ( ! $this->is_update ) {
			do_action( 'tgwcfb_admin_email', $user, $this->valid_data );

			if ( 'admin_approval' === get_post_meta( $this->form_id, '_tgwcfb_user_approval', true ) ) {
				do_action( 'tgwcfb_awaiting_admin_approval_email', $user, $this->valid_data );
			}

			if ( ! is_checkout() && 'email_confirmation' === get_post_meta( $this->form_id, '_tgwcfb_user_approval', true ) ) {
				update_user_meta( $user_id, 'tgwcfb_confirm_email', 0 );
				update_user_meta( $user_id, 'tgwcfb_confirm_email_token', get_token( $user_id ) );
				do_action( 'tgwcfb_user_confirmation_email', $user, $this->valid_data );
			}

			do_action( 'tgwcfb_after_user_registration', $this->valid_data, $user_id );
		} else {
			do_action( 'tgwcfb_profile_details_changed_email', $user, $this->valid_data );
		}
	}

	/**
	 * Disable WC default forced login after registration if manual approval is required.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function disable_forced_login() {
		if ( ! in_array( get_post_meta( $this->form_id, '_tgwcfb_user_approval', true ), array( 'admin_approval', 'email_confirmation' ), true ) || is_checkout() ) {
			return;
		}
		add_filter( 'woocommerce_registration_auth_new_customer', '__return_false' );
		remove_action( 'woocommerce_created_customer_notification', array( WC_Emails::instance(), 'customer_new_account' ) );

		$msg = get_post_meta( $this->form_id, '_tgwcfb_account_created_message', true );
		$msg = empty( $msg ) ? __( 'Registration complete, wait until admin approves your registration', 'registration-form-for-woocommerce' ) : $msg;
		$msg = 'email_confirmation' === get_post_meta( $this->form_id, '_tgwcfb_user_approval', true ) ? __( 'User registered. Verify your email by clicking on the link sent to your email.', 'registration-form-for-woocommerce' ) : $msg;

		add_filter(
			'woocommerce_add_success',
			function ( $message ) use ( $msg ) {
				if ( false !== strpos( $message, 'Your account was created successfully' ) ) {
					return $msg;
				}
				return $message;
			}
		);

		if ( ! empty( get_post_meta( $this->form_id, '_tgwcfb_redirect_url', true ) ) ) {
			$redirect = wp_sanitize_redirect( get_post_meta( $this->form_id, '_tgwcfb_redirect_url', true ) );
		} else {
			$redirect = '';
		}

		if ( ! empty( $redirect ) && wp_safe_redirect( $redirect ) ) {
			exit;
		}
	}

	/**
	 * Change redirect URL.
	 *
	 * @since 1.0.0
	 * @param string $redirect Redirect url.
	 * @return string
	 */
	public function change_redirect_url( $redirect ) {
		$redirect_url = get_post_meta( $this->form_id, '_tgwcfb_redirect_url', true );
		return ! empty( $redirect_url ) ? $redirect_url : $redirect;
	}

	/**
	 * Validate field.
	 *
	 * @param string              $type Block type.
	 * @param string              $field_name Form field name.
	 * @param string              $label Field label.
	 * @param boolean             $required Required.
	 * @param string|array|number $data Data from $_POST.
	 * @param WP_Error            $errors Errors.
	 * @return void
	 */
	private function validate( $type, $field_name, $label, $required, $data, $errors ) {
		if ( ! empty( $data ) ) {
			if ( 'tgwcfb/username' === $type && username_exists( $data ) ) {
				$errors->add( 'tgwcfb_username_error', __( 'Username already exists.', 'registration-form-for-woocommerce' ) );
			}
			if (
				( in_array( $type, array( 'tgwcfb/billing-email', 'tgwcfb/email', 'tgwcfb/secondary-email' ), true ) && ! is_email( $data ) ) ||
				( in_array( $type, array( 'tgwcfb/number', 'tgwcfb/range' ), true ) && ! is_numeric( $data ) ) ||
				( in_array( $type, array( 'tgwcfb/checkbox', 'tgwcfb/multi-select' ), true ) && ! is_array( $data ) ) ||
				( in_array( $type, array( 'tgwcfb/billing-phone', 'tgwcfb/phone' ), true ) && ! preg_match( '/^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/', $data ) ) ||
				( 'tgwcfb/url' === $type && ! filter_var( $data, FILTER_VALIDATE_URL ) ) ||
				( 'tgwcfb/username' === $type && ! validate_username( $data ) )
			) {
				/* Translators: Label */
				$errors->add( "tgwcfb_{$field_name}_error", sprintf( __( '%s is not valid.', 'registration-form-for-woocommerce' ), "<strong>$label</strong>" ) );
			}
		}

		if ( empty( $data ) && $required ) {
			/* Translators: Label */
			$errors->add( "tgwcfb_{$field_name}_error", sprintf( __( '%s is required.', 'registration-form-for-woocommerce' ), "<strong>$label</strong>" ) );
		}
	}
}
