<?php
/**
 * Install.
 *
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 * @since 1.0.0
 */

namespace ThemeGrill\WooCommerceRegistrationFormBuilder;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Install.
 *
 * @since 1.0.0
 */
class Install {

	/**
	 * Install constructor.
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
		add_action( 'init', array( $this, 'install' ), 6 );
		do_action( 'tgwcfb_install_unhook' );
	}

	/**
	 * Install.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function install() {
		if ( version_compare( get_option( 'tgwcfb_version' ), TGWCFB_VERSION, '<' ) ) {
			$this->create_form();
			$this->update_version();
		}
	}

	/**
	 * Create a default form.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function create_form() {
		if ( 0 !== count( get_posts( 'post_type=tgwcfb_form' ) ) ) {
			return;
		}

		$default_post_id = wp_insert_post(
			array(
				'post_type'      => 'tgwcfb_form',
				'post_title'     => esc_html__( 'Default form', 'registration-form-for-woocommerce' ),
				'post_content'   => default_content(),
				'post_status'    => 'publish',
				'comment_status' => 'closed',
				'ping_status'    => 'closed',
			)
		);

		update_option( '_tgwcfb_default_form_id', $default_post_id );
		update_option( '_tgwcfb_form_id', $default_post_id );
	}

	/**
	 * Update version.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function update_version() {
		$old_version = get_option( 'tgwcfb_version' );
		delete_option( 'tgwcfb_version' );
		add_option( 'tgwcfb_version', TGWCFB_VERSION );
		do_action( 'tgwcfb_version_update', TGWCFB_VERSION, $old_version );
	}
}
