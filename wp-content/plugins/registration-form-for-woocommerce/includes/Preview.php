<?php
/**
 * Class Preview.
 *
 * @since 1.0.0
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 */

namespace ThemeGrill\WooCommerceRegistrationFormBuilder;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Class Preview.
 *
 * @since 1.0.0
 */
class Preview {

	/**
	 * Form id.
	 *
	 * @var int Form id.
	 */
	private $form_id = 0;

	/**
	 * Constructor.
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
		add_action( 'init', array( $this, 'init_preview_hooks' ) );
	}

	/**
	 * Init preview hooks.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function init_preview_hooks() {
		if ( ! is_user_logged_in() || is_admin() ) {
			return;
		}

		if ( ! isset( $_GET['tgwcfb_preview'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		$this->form_id = isset( $_GET['form_id'] ) ? absint( wp_unslash( $_GET['form_id'] ) ) : 0;  // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		add_filter( 'edit_post_link', array( $this, 'edit_form_link' ) );
		add_action( 'pre_get_posts', array( $this, 'pre_get_posts' ) );
		add_filter( 'home_template_hierarchy', array( $this, 'template_include' ) );
		add_filter( 'frontpage_template_hierarchy', array( $this, 'template_include' ) );
		add_action( 'template_redirect', array( $this, 'handle_preview' ) );
	}

	/**
	 * Edit form link.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function edit_form_link() {
		$edit_link = add_query_arg(
			array(
				'post'   => $this->form_id,
				'action' => 'edit',
			),
			admin_url( 'post.php' )
		);

		return sprintf(
			'<a class="post-edit-link" href="%1$s">%2$s</a>',
			esc_url( $edit_link ),
			__( 'Edit form', 'registration-form-for-woocommerce' )
		);
	}

	/**
	 * Limit posts.
	 *
	 * @since 1.0.0
	 * @param \WP_Query $query WP_Query instance.
	 * @return void
	 */
	public function pre_get_posts( $query ) {
		if ( $query->is_main_query() ) {
			$query->set( 'posts_per_page', 1 );
		}
	}

	/**
	 * Template include.
	 *
	 * @since 1.0.0
	 * @return string[]
	 */
	public function template_include() {
		return array( 'page.php', 'single.php', 'index.php' );
	}

	/**
	 * Handle preview.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function handle_preview() {
		if ( 0 !== $this->form_id ) {
			add_filter( 'the_title', array( $this, 'form_preview_title' ) );
			add_filter( 'the_content', array( $this, 'form_preview_content' ) );
			add_filter( 'get_the_excerpt', array( $this, 'form_preview_content' ) );
			add_filter( 'post_thumbnail_html', '__return_empty_string' );
		}
	}

	/**
	 * Form preview title.
	 *
	 * @since 1.0.0
	 * @param string $title Post/Page title.
	 * @return string
	 */
	public function form_preview_title( $title ) {
		if ( in_the_loop() ) {
			$form_data = get_post( $this->form_id );

			if ( ! empty( $form_data ) ) {
				/* translators: %s - Form name. */
				return sprintf( esc_html__( '%s &ndash; Preview', 'registration-form-for-woocommerce' ), sanitize_text_field( $form_data->post_title ) );
			}
		}

		return $title;
	}

	/**
	 * Form preview content.
	 *
	 * @since 1.0.0
	 * @param string $content Post/Page content.
	 * @return string
	 */
	public function form_preview_content( $content ) {

		remove_filter( 'the_content', array( $this, 'form_preview_content' ) );

		if ( function_exists( 'apply_shortcodes' ) ) {
			$content = apply_shortcodes( '[tgwcfb_registration_form id="' . $this->form_id . '"]' );
		} else {
			$content = do_shortcode( '[tgwcfb_registration_form id="' . $this->form_id . '"]' );
		}

		return $content;
	}
}
