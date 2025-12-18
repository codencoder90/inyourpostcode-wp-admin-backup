<?php
/**
 * Handles admin notices.
 *
 * @since 1.0.0
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 */

namespace ThemeGrill\WooCommerceRegistrationFormBuilder;

defined( 'ABSPATH' ) || exit;

/**
 * Notice.
 *
 * @since 1.0.0
 */
class Notice {

	/**
	 * Admin notices.
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	private $notices = array();

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->init();
	}

	/**
	 * Initialization.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	private function init() {
		$this->init_hooks();

		do_action( 'tgwc_notice_unhook', $this );
	}

	/**
	 * Initialization hooks.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	private function init_hooks() {
		add_action( 'admin_notices', array( $this, 'display_admin_notices' ) );
		do_action( 'tgwcfb_notice_unhook' );
	}

	/**
	 * Display admin notices.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function display_admin_notices() {
		$html = '';
		foreach ( $this->notices as $key => $notice ) {
			$is_dismissible = $notice['is_dismissible'] ? 'is-dismissible' : '';
			$type           = $notice['type'];

			$html .= "<div class='notice notice-$type $key $is_dismissible'>";
			$html .= '<p>';

			if ( ! empty( trim( $notice['heading'] ) ) ) {
				$html .= "<strong>{$notice['heading']}</strong>";
			}

			$html .= $notice['message'];
			$html .= '</p>';

			$html .= '</div>';
		}
		echo do_shortcode( $html );
	}

	/**
	 * Add admin notice.
	 *
	 * @param string $key            Key for notice.
	 * @param string $type           Type of notice. (e.g. error, warning, success, info ).
	 * @param string $heading        Heading to display in the notice.
	 * @param string $message        Message to display in the notice.
	 * @param string $is_dismissible Whether you make the notice dismissible or not.
	 * @return void
	 */
	public function add_notice( $key = 'default', $type = 'warning', $heading = '', $message = '', $is_dismissible = true ) {
		$this->notices[ $key ] = array(
			'type'           => $type,
			'heading'        => $heading,
			'message'        => $message,
			'is_dismissible' => $is_dismissible,
		);
	}

	/**
	 * Add error notice.
	 *
	 * @since 1.0.0
	 *
	 * @param string $key               Key for notice.
	 * @param string $heading           Heading to display in the notice.
	 * @param string $message           Message to display in the notice.
	 * @param string $is_dismissible    Whether make the notice dismissible or not.
	 * @return void
	 */
	public function add_error_notice( $key = 'default', $heading = '', $message = '', $is_dismissible = true ) {
		$this->add_notice( $key, 'error', $heading, $message, $is_dismissible );
	}

	/**
	 * Add warning notice.
	 *
	 * @since 1.0.0
	 *
	 * @param string $key               Key for notice.
	 * @param string $heading           Heading to display in the notice.
	 * @param string $message           Message to display in the notice.
	 * @param string $is_dismissible    Whether make the notice dismissible or not.
	 * @return void
	 */
	public function add_warning_notice( $key = 'default', $heading = '', $message = '', $is_dismissible = true ) {
		$this->add_notice( $key, 'warning', $heading, $message, $is_dismissible );
	}

	/**
	 * Add success notice.
	 *
	 * @since 1.0.0
	 *
	 * @param string $key               Key for notice.
	 * @param string $heading           Heading to display in the notice.
	 * @param string $message           Message to display in the notice.
	 * @param string $is_dismissible    Whether make the notice dismissible or not.
	 * @return void
	 */
	public function add_success_notice( $key = 'default', $heading = '', $message = '', $is_dismissible = true ) {
		$this->add_notice( $key, 'success', $heading, $message, $is_dismissible );
	}

	/**
	 * Add info notice.
	 *
	 * @since 1.0.0
	 *
	 * @param string $key            Key for notice.
	 * @param string $heading        Heading to display in the notice.
	 * @param string $message        Message to display in the notice.
	 * @param bool   $is_dismissible Is notice dismissible.
	 * @return void
	 */
	public function add_info_notice( $key = 'default', $heading = '', $message = '', $is_dismissible = true ) {
		$this->add_notice( $key, 'info', $heading, $message, $is_dismissible );
	}
}
