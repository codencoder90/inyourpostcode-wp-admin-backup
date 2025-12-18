<?php
/**
 * Main WooCommerceRegistrationFormBuilder class.
 *
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 */

namespace ThemeGrill\WooCommerceRegistrationFormBuilder;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Main WooCommerceRegistrationFormBuilder class.
 */
final class WooCommerceRegistrationFormBuilder {

	/**
	 * Single instance of the class.
	 *
	 * @version 1.0.0
	 * @var null
	 */
	private static $instance = null;

	/**
	 * Notice.
	 *
	 * @since 1.0.0
	 * @var null|Notice
	 */
	public $notice = null;

	/**
	 * Holds instance of Blocks.
	 *
	 * @var Blocks|null
	 */
	public $blocks = null;

	/**
	 * Holds instance of ScriptStyle.
	 *
	 * @var ScriptStyle|null
	 */
	public $script_style = null;

	/**
	 * Get WooCommerce registration form builder instance.
	 *
	 * @version 1.0.0
	 * @since WooCommerceRegistrationFormBuilder|null Main instance.
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Cloning is forbidden.
	 *
	 * @version 1.0.0
	 * @since void
	 */
	public function __clone() {
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Cheatin&#8217', 'registration-form-for-woocommerce' ), '1.0' );
	}

	/**
	 * Unserializing instances of this class is forbidden.
	 *
	 * @version 1.0.0
	 * @since void
	 */
	public function __wakeup() {
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Cheatin&#8217', 'registration-form-for-woocommerce' ), '1.0' );
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		$this->init_props();
		new Install();
		new Shortcode();
		new PostType();
		new Sync();
		new FormHandler();
		new RESTAPI();
		new Ajax();
		new Admin();
		new Preview();
		$this->init_hooks();
		do_action( 'tgwcfb_loaded' );
	}

	/**
	 * Init properties.
	 *
	 * @return void
	 */
	private function init_props() {
		$this->blocks       = new Blocks();
		$this->notice       = new Notice();
		$this->script_style = new ScriptStyle();
	}

	/**
	 * Init hooks.
	 *
	 * @version 1.0.0
	 * @since void
	 */
	private function init_hooks() {
		add_action( 'init', array( $this, 'init' ), 0 );
		add_action( 'in_admin_header', array( $this, 'hide_admin_notices' ) );
		add_action( 'admin_init', array( $this, 'deactivate_plugin' ) );

		// Declare compatibility for HPOS.
		add_action(
			'before_woocommerce_init',
			function () {
				if ( class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
					\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', TGWCFB_PLUGIN_FILE, true );
				}
			}
		);
	}

	/**
	 * Init.
	 *
	 * @version 1.0.0
	 * @since void
	 */
	public function init() {
		$this->load_text_domain();
		$this->register_settings();
		do_action( 'tgwcfb_init' );
	}

	/**
	 * Load text domain.
	 *
	 * @version 1.0.0
	 * @since void
	 */
	private function load_text_domain() {
		load_plugin_textdomain( 'registration-form-for-woocommerce', false, plugin_basename( TGWCFB_PLUGIN_DIR ) . '/languages' );
	}

	/**
	 * Deactivate plugin if WooCommerce in not active.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function deactivate_plugin() {
		if ( ! is_wc_active() ) {
			$plugin_data = get_plugin_data( TGWCFB_PLUGIN_FILE, false );

			$this->notice->add_error_notice(
				'tgwcfb_woocommerce_deactivate',
				$plugin_data['Name'] . ': ',
				esc_html__( 'WooCommerce is required for this plugin to work. Please, activate WooCommerce first.', 'registration-form-for-woocommerce' )
			);

			deactivate_plugins( plugin_basename( TGWCFB_PLUGIN_FILE ) );

			// phpcs:disable WordPress.Security.NonceVerification.Recommended
			if ( isset( $_GET['activate'] ) ) {
				unset( $_GET['activate'] );
			}
			// phpcs:enable WordPress.Security.NonceVerification.Recommended
		}
	}

	/**
	 * Register setting.
	 *
	 * @return void
	 */
	private function register_settings() {
		global $wp_roles;

		register_setting(
			'_tgwcfb_settings',
			'_tgwcfb_form_id',
			array(
				'type'              => 'number',
				'show_in_rest'      => true,
				'default'           => 0,
				'sanitize_callback' => 'sanitize_key',
			)
		);
		register_setting(
			'_tgwcfb_settings',
			'_tgwcfb_checkout_form_id',
			array(
				'type'              => 'number',
				'show_in_rest'      => true,
				'default'           => 0,
				'sanitize_callback' => 'sanitize_key',
			)
		);
		register_setting(
			'_tgwcfb_settings',
			'_tgwcfb_captcha_type',
			array(
				'type'              => 'string',
				'show_in_rest'      => true,
				'default' => 'v2',
				'sanitize_callback' => false,
			)
		);
		register_setting(
			'_tgwcfb_settings',
			'_tgwcfb_site_key',
			array(
				'type'              => 'string',
				'show_in_rest'      => true,
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		register_setting(
			'_tgwcfb_settings',
			'_tgwcfb_secret_key',
			array(
				'type'              => 'string',
				'show_in_rest'      => true,
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);

		register_setting(
			'_tgwcfb_settings',
			'_tgwcfb_admin_email_settings',
			array(
				'type'              => 'string',
				'show_in_rest'      => true,
				'default' => '',
				'sanitize_callback' => false,
			)
		);

		register_setting(
			'_tgwcfb_settings',
			'_tgwcfb_recaptcha_v3_site_key',
			array(
				'type'              => 'string',
				'show_in_rest'      => true,
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);

		register_setting(
			'_tgwcfb_settings',
			'_tgwcfb_recaptcha_v3_secrete_key',
			array(
				'type'              => 'string',
				'show_in_rest'      => true,
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);

		register_setting(
			'_tgwcfb_settings',
			'_tgwcfb_hcaptcha_site_key',
			array(
				'type'              => 'string',
				'show_in_rest'      => true,
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		register_setting(
			'_tgwcfb_settings',
			'_tgwcfb_hcaptcha_secrete_key',
			array(
				'type'              => 'string',
				'show_in_rest'      => true,
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);

		register_setting(
			'_tgwcfb_settings',
			'_tgwcfb_checkout_fields',
			array(
				'type'              => 'array',
				'show_in_rest'      => array(
					'schema' => array(
						'type'  => 'array',
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'attrs'        => array(
									'type'       => 'object',
									'properties' => array(
										'clientId'       => array(
											'type' => 'string',
										),
										'label'          => array(
											'type' => 'string',
										),
										'placeholder'    => array(
											'type' => 'string',
										),
										'placeholder1'   => array(
											'type' => 'string',
										),
										'placeholder2'   => array(
											'type' => 'string',
										),
										'fieldWidth'     => array(
											'type' => 'number',
										),
										'description'    => array(
											'type' => 'string',
										),
										'required'       => array(
											'type' => 'boolean',
										),
										'hideLabel'      => array(
											'type' => 'boolean',
										),
										'hasDescription' => array(
											'type' => 'boolean',
										),
										'className'      => array(
											'type' => 'string',
										),
										'options'        => array(
											'type'  => 'array',
											'items' => array(
												'type' => 'string',
											),
										),
										'showInOrder'    => array(
											'type' => 'boolean',
										),
										'fileTypes'      => array(
											'type'  => 'array',
											'items' => array(
												'type' => 'string',
											),
										),
										'min'            => array(
											'type' => 'number',
										),
										'max'            => array(
											'type' => 'number',
										),
										'step'           => array(
											'type' => 'number',
										),
										'maxFileSize'    => array(
											'type' => 'string',
										),
										'edited'         => array(
											'type' => 'boolean',
										),
										'roles'          => array(
											'type'       => 'object',
											'properties' => array_reduce(
												array_keys( $wp_roles->roles ),
												function ( $acc, $crr ) {
													$acc[ $crr ] = array(
														'type' => 'string',
													);
													return $acc;
												},
												array()
											),
										),
									),
								),
								'blockName'    => array(
									'type' => 'string',
								),
								'innerBlocks'  => array(
									'type'  => 'array',
									'items' => array(
										'type' => 'string',
									),
								),
								'innerHTML'    => array(
									'type'             => 'string',
									'contentMediaType' => 'text/html',
								),
								'innerContent' => array(
									'type'  => 'array',
									'items' => array(
										'type'             => 'string',
										'contentMediaType' => 'text/html',
									),
								),
							),
						),
					),
				),
				'default'           => array(),
				'sanitize_callback' => false,
			)
		);
	}

	/**
	 * Hide admin notices in settings page.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function hide_admin_notices() {
		global $current_screen, $wp_filter;

		if ( 'tgwcfb_form_page_settings' !== $current_screen->id ) {
			return;
		}

		$ignore_notices = apply_filters( 'tgwcfb_ignored_notice', array() );

		foreach ( array( 'user_admin_notices', 'admin_notices', 'all_admin_notices' ) as $wp_notice ) {
			if ( empty( $wp_filter[ $wp_notice ] ) ) {
				continue;
			}

			$hook_callbacks = $wp_filter[ $wp_notice ]->callbacks;

			if ( empty( $hook_callbacks ) || ! is_array( $hook_callbacks ) ) {
				continue;
			}

			foreach ( $hook_callbacks as $priority => $hooks ) {
				foreach ( $hooks as $name => $callback ) {
					if ( ! empty( $name ) && in_array( $name, $ignore_notices, true ) ) {
						continue;
					}
					if (
						! empty( $callback['function'] ) &&
						! is_a( $callback['function'], '\Closure' ) &&
						isset( $callback['function'][0], $callback['function'][1] ) &&
						is_object( $callback['function'][0] ) &&
						in_array( $callback['function'][1], $ignore_notices, true )
					) {
						continue;
					}
					unset( $wp_filter[ $wp_notice ]->callbacks[ $priority ][ $name ] );
				}
			}
		}
	}
}
