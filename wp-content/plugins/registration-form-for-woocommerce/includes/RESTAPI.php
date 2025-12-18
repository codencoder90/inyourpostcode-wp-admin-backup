<?php
/**
 * RESTAPI.
 *
 * @since 1.0.0
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 */

namespace ThemeGrill\WooCommerceRegistrationFormBuilder;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

use WP_REST_Response;
use WP_REST_Server;

/**
 * RESTAPI.
 *
 * @since 1.0.0
 */
class RESTAPI {

	/**
	 * Namespace.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	private $namespace = 'tgwcfb/v1';

	/**
	 * Init.
	 *
	 * @since 1.0.0
	 * @return void
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
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		do_action( 'tgwcfb_restapi_unhook' );
	}

	/**
	 * Register rest routes.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			$this->namespace,
			'/user-roles/',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_user_roles' ),
				'permission_callback' => array( $this, 'permission_check' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/forms/',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_forms' ),
				'permission_callback' => array( $this, 'permission_check' ),
			)
		);
	}

	/**
	 * Get user roles.
	 *
	 * @since 1.0.0
	 * @return WP_REST_Response
	 */
	public function get_user_roles() {
		global $wp_roles;

		$roles = $wp_roles->roles;

		if ( ! isset( $roles ) ) {
			return new WP_REST_Response(
				array(
					'success'   => false,
					'userRoles' => array(),
				)
			);
		}

		$roles = array_filter(
			$roles,
			function ( $key ) {
				return 'administrator' !== $key;
			},
			ARRAY_FILTER_USE_KEY
		);

		$roles = array_reduce(
			array_keys( $roles ),
			function ( $acc, $curr ) use ( $roles ) {
				$acc[ $curr ] = $roles[ $curr ]['name'];
				return $acc;
			},
			array()
		);

		return new WP_REST_Response(
			array(
				'success'   => true,
				'userRoles' => $roles,
			)
		);
	}

	/**
	 * Ger forms.
	 *
	 * @since 1.0.0
	 * @return WP_REST_Response
	 */
	public function get_forms() {
		$forms = get_posts(
			array(
				'post_type'   => 'tgwcfb_form',
				'numberposts' => -1,
			)
		);

		return new WP_REST_Response(
			array(
				'success' => true,
				'forms'   => $forms,
			)
		);
	}

	/**
	 * Permission check.
	 *
	 * @return bool
	 */
	public function permission_check() {
		return current_user_can( 'manage_options' );
	}
}
