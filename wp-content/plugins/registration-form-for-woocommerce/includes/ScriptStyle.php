<?php
/**
 * ScriptStyle.
 *
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 */

namespace ThemeGrill\WooCommerceRegistrationFormBuilder;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * ScriptStyle.
 *
 * @since 1.0.0
 */
class ScriptStyle {

	/**
	 * ScriptStyle constructor.
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
		add_action( 'init', array( $this, 'after_wp_init' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts_and_styles' ) );
		do_action( 'tgwcfb_script_style_unhook' );
	}

	/**
	 * Init after WP is initialized.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function after_wp_init() {
		$this->register_block_scripts_and_styles();
		$this->register_frontend_scripts_and_styles();
	}

	/**
	 * Register block scripts and styles.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function register_block_scripts_and_styles() {
		if ( ! is_wc_active() ) {
			return;
		}
		$script_asset = $this->get_script_assets( 'blocks' );

		wp_register_script( 'tgwcfb-blocks', TGWCFB_ASSETS_DIR_URL . '/js/build/blocks.js', $script_asset->dependencies, $script_asset->version, true );
		wp_set_script_translations( 'tgwcfb-blocks', 'registration-form-for-woocommerce', TGWCFB_LANGUAGES );
		wp_localize_script(
			'tgwcfb-blocks',
			'_TGWCFB_EDITOR_',
			array(
				'billingCountries'  => WC()->countries->get_allowed_countries(),
				'shippingCountries' => WC()->countries->get_shipping_countries(),
				'states'            => WC()->countries->get_states(),
				'maxUploadSize'     => wp_max_upload_size(),
				'adminURL'          => admin_url(),
				'homeURL'           => home_url(),
				'captchaType'		=> get_option('_tgwcfb_captcha_type', 'v2')
			)
		);
		wp_register_style( 'tgwcfb-blocks', TGWCFB_ASSETS_DIR_URL . '/css/build/blocks.css', array(), $script_asset->version );
	}

	/**
	 * Register frontend scripts and styles.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function register_frontend_scripts_and_styles() {
		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		if ( ! wp_script_is( 'selectWoo', 'registered' ) ) {
			wp_register_script( 'selectWoo', TGWCFB_ASSETS_DIR_URL . "/js/selectWoo/selectWoo.full$suffix.js", array( 'jquery' ), TGWCFB_VERSION, true );
		}

		wp_register_script( 'tgwcfb-select', TGWCFB_ASSETS_DIR_URL . '/js/build/frontend-select.js', array( 'selectWoo' ), $this->get_script_assets( 'frontend-select' )->version, true );
		wp_register_script( 'tgwcfb-flatpickr', TGWCFB_ASSETS_DIR_URL . '/js/flatpickr/flatpickr.min.js', array(), TGWCFB_VERSION, true );
		wp_register_script( 'tgwcfb-date-time-picker', TGWCFB_ASSETS_DIR_URL . '/js/build/frontend-date-time-picker.js', array( 'jquery', 'tgwcfb-flatpickr' ), $this->get_script_assets( 'frontend-date-time-picker' )->version, true );
		wp_register_script( 'tgwcfb-range', TGWCFB_ASSETS_DIR_URL . '/js/build/frontend-range.js', array( 'jquery' ), $this->get_script_assets( 'frontend-range' )->version, true );
		wp_register_script( 'tgwcfb-sweetalert2', TGWCFB_ASSETS_DIR_URL . "/js/sweetalert2/sweetalert2$suffix.js", array(), TGWCFB_VERSION, true );
		wp_register_script( 'tgwcfb-jcrop', TGWCFB_ASSETS_DIR_URL . "/js/jquery-Jcrop/jquery.Jcrop$suffix.js", array( 'jquery' ), TGWCFB_VERSION, true );
		wp_register_script( 'tgwcfb-profile-picture', TGWCFB_ASSETS_DIR_URL . '/js/build/frontend-profile-picture.js', array( 'tgwcfb-jcrop', 'tgwcfb-sweetalert2' ), $this->get_script_assets( 'frontend-profile-picture' )->version, true );
		wp_register_script( 'tgwcfb-separate-shipping', TGWCFB_ASSETS_DIR_URL . '/js/build/frontend-separate-shipping.js', array( 'jquery' ), $this->get_script_assets( 'frontend-separate-shipping' )->version, true );
		wp_localize_script(
			'tgwcfb-profile-picture',
			'_TGWCFB_FRONTEND_',
			array(
				'nonce'              => wp_create_nonce( 'tgwcfb_profile_picture_upload_nonce' ),
				'ajaxURL'            => admin_url( 'admin-ajax.php' ),
				'uploading'          => __( 'Uploading...', 'registration-form-for-woocommerce' ),
				'somethingWentWrong' => __( 'Something went wrong, please try again', 'registration-form-for-woocommerce' ),
				'cropTitle'          => __( 'Crop Your Picture', 'registration-form-for-woocommerce' ),
				'cropBtn'            => __( 'Crop picture', 'registration-form-for-woocommerce' ),
				'permissionError'    => __( 'Permission error', 'registration-form-for-woocommerce' ),
				'cancelBtn'          => __( 'Cancel', 'registration-form-for-woocommerce' ),
				'confirmBtn'         => __( 'Ok', 'registration-form-for-woocommerce' ),
			)
		);

		wp_localize_script(
			'tgwcfb-separate-shipping',
			'_TGWCFB_FRONTEND_COUNTRY_',
			array(
				'countries'              => json_encode( array_merge( WC()->countries->get_allowed_country_states(), WC()->countries->get_shipping_country_states() ) ),
			'i18n_select_state_text' => esc_attr__( 'Select an option&hellip;', 'registration-form-for-woocommerce' ),
			)
		);

		if ( ! wp_style_is( 'select2', 'registered' ) ) {
			wp_register_style( 'select2', TGWCFB_ASSETS_DIR_URL . '/css/select2.css', array(), TGWCFB_VERSION );
		}

		wp_register_style( 'tgwcfb-flatpickr', TGWCFB_ASSETS_DIR_URL . '/css/flatpickr.css', array(), TGWCFB_VERSION );
		wp_register_style( 'tgwcfb-jcrop', TGWCFB_ASSETS_DIR_URL . '/css/jquery.Jcrop.css', array(), TGWCFB_VERSION );
		wp_register_style( 'tgwcfb-sweetalert2', TGWCFB_ASSETS_DIR_URL . '/css/sweetalert2.css', array(), TGWCFB_VERSION );
		wp_register_style( 'tgwcfb-frontend', TGWCFB_ASSETS_DIR_URL . '/css/build/frontend.css', array(), $this->get_script_assets( 'frontend' )->version );
	}

	/**
	 * Load frontend scripts and styles.
	 *
	 * @since 1.0.0
	 * @param array $blocks Blocks.
	 * @return void
	 */
	public function load_frontend_scripts_and_styles( $blocks ) {
		if ( empty( $blocks ) ) {
			return;
		}

		if ( count( array_intersect( array( 'tgwcfb/select', 'tgwcfb/multi-select' ), $blocks ) ) > 0 ) {
			wp_enqueue_script( 'tgwcfb-select' );
			wp_enqueue_style( 'select2' );
		}

		if ( count( array_intersect( array( 'tgwcfb/billing-country', 'tgwcfb/billing-state', 'tgwcfb/shipping-state', 'tgwcfb/shipping-country' ), $blocks ) ) > 0 ) {
			wp_enqueue_script( 'wc-address-i18n' );
			wp_enqueue_script( 'wc-country-select' );
			wp_enqueue_style( 'select2' );
		}

		wp_enqueue_script( 'tgwcfb-separate-shipping' );

		if ( in_array( 'tgwcfb/range', $blocks, true ) ) {
			wp_enqueue_script( 'tgwcfb-range' );
		}

		if ( count( array_intersect( array( 'tgwcfb/date-picker', 'tgwcfb/time-picker' ), $blocks ) ) > 0 ) {
			wp_enqueue_style( 'tgwcfb-flatpickr' );
			wp_enqueue_script( 'tgwcfb-date-time-picker' );
		}

		if ( in_array( 'tgwcfb/profile-picture', $blocks, true ) ) {
			wp_enqueue_script( 'tgwcfb-profile-picture' );
			wp_enqueue_style( 'tgwcfb-jcrop' );
			wp_enqueue_style( 'tgwcfb-sweetalert2' );
		}

		wp_enqueue_style( 'tgwcfb-frontend' );
	}

	/**
	 * Load admin scripts and styles.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function load_admin_scripts_and_styles() {
		global $current_screen;
		if ( in_array( $current_screen->id, array( 'user-edit', 'profile' ), true ) ) {
			wp_enqueue_script( 'tgwcfb-admin-user-edit', TGWCFB_ASSETS_DIR_URL . '/js/build/admin-user-edit.js', array( 'jquery', 'selectWoo', 'tgwcfb-flatpickr' ), $this->get_script_assets( 'admin-user-edit' )->version, true );
			wp_enqueue_style( 'tgwcfb-admin-user-edit', TGWCFB_ASSETS_DIR_URL . '/css/build/admin-user-edit.css', array( 'select2', 'tgwcfb-flatpickr' ), $this->get_script_assets( 'admin-user-edit' )->version );
		}
		if ( 'tgwcfb_form_page_settings' === $current_screen->id ) {
			wp_enqueue_editor();
			wp_enqueue_script( 'tgwcfb-admin-settings', TGWCFB_ASSETS_DIR_URL . '/js/build/admin-settings.js', $this->get_script_assets( 'admin-settings' )->dependencies, $this->get_script_assets( 'admin-settings' )->version, true );
			wp_enqueue_style( 'tgwcfb-admin-settings', TGWCFB_ASSETS_DIR_URL . '/css/build/admin-settings.css', array( 'wp-components' ), $this->get_script_assets( 'admin-settings' )->version );
			wp_set_script_translations( 'tgwcfb-admin-settings', 'registration-form-for-woocommerce', TGWCFB_LANGUAGES );

			$admin_email = admin_email_defaults();

			wp_localize_script(
				'tgwcfb-admin-settings',
				'_TGWCFB_SETTINGS_',
				array(
					'adminURL' => admin_url(),
					'adminEmail' => $admin_email,
				)
			);
		}

		if ( 'woocommerce_page_wc-settings' === $current_screen->id ) {
			wp_enqueue_editor();
			wp_enqueue_script( 'tgwcfb-admin-email', TGWCFB_ASSETS_DIR_URL . '/js/build/admin-email.js', $this->get_script_assets( 'admin-email' )->dependencies, $this->get_script_assets( 'admin-email' )->version, true );
			wp_enqueue_style( 'tgwcfb-admin-email', TGWCFB_ASSETS_DIR_URL . '/css/build/admin-email.css', array(), $this->get_script_assets( 'admin-email' )->version );
		}

		if ('edit-tgwcfb_form' === $current_screen->id || 'tgwcfb_form' === $current_screen->id) {
			wp_enqueue_style( 'tgwcfb-sweetalert2' );
			wp_enqueue_script( 'tgwcfb-admin-upgrade-pro', TGWCFB_ASSETS_DIR_URL . '/js/build/upgrade-pro.js', array('jquery', 'tgwcfb-sweetalert2'), '', true );
		}
	}

	/**
	 * Get script assets.
	 *
	 * @since 1.0.0
	 * @param string $name Script name.
	 * @return object
	 */
	private function get_script_assets( $name ) {
		$script_asset_path = TGWCFB_ASSETS_DIR . "/js/build/$name.asset.php";
		$script_asset      = file_exists( $script_asset_path ) ? require $script_asset_path : array(
			'dependencies' => array(),
			'version'      => filemtime( TGWCFB_ASSETS_DIR . "/js/build/$name.js" ),
		);
		return (object) $script_asset;
	}
}
