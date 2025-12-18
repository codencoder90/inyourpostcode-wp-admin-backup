<?php
/**
 * Email.
 *
 * @since 1.0.0
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 */

namespace ThemeGrill\WooCommerceRegistrationFormBuilder;

// Exit is accessed directly.
defined( 'ABSPATH' ) || exit;

use WC_Email;
use WP_User;
use AllowDynamicProperties;
#[AllowDynamicProperties]

/**
 * Email.
 *
 * @since 1.0.0
 */
class Email extends WC_Email {

	/**
	 * Email content.
	 *
	 * @var string
	 */
	public $email_content = '';

	/**
	 * Default email content.
	 *
	 * @var string
	 */
	public $default_content = '';

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 * @param array $args Arguments.
	 */
	public function __construct(
		$args = array()
	) {
		$defaults = admin_email_defaults();
		$args     = wp_parse_args( $args, $defaults );

		foreach ( $args as $k => $v ) {
			$this->{ $k } = $v;
		}

		parent::__construct();

		if ( ! isset( $args['consumer_email'] ) || ! $args['customer_email'] ) {
			if ( $args['to'] ) {
				$this->recipient = $args['to'];
			} else {
				$this->recipient = $this->get_option( 'recipient', get_option( 'admin_email' ) );
			}
		}

		$this->template_base  = TGWCFB_TEMPLATES;
		$this->template_html  = 'html-email.php';
		$this->template_plain = 'plain-email.php';

		add_action( $args['id'], array( $this, 'send_email' ), 10, 3 );
	}

	/**
	 * Get HTML email content.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_content_html() {
		return wc_get_template_html(
			$this->template_html,
			array(
				'customer'           => $this->object,
				'email_heading'      => $this->get_heading(),
				'email_content'      => ! empty( $this->email_content ) ? $this->email_content : $this->default_content,
				'additional_content' => $this->get_additional_content(),
				'sent_to_admin'      => false,
				'plain_text'         => false,
				'email'              => $this,
			),
			$this->template_base,
			$this->template_base
		);
	}

	/**
	 * {@inheritDoc}
	 *
	 * @return void
	 */
	public function init_form_fields() {
		parent::init_form_fields();
		$this->form_fields['content'] = array(
			'title'       => __( 'Content', 'registration-form-for-woocommerce' ),
			'type'        => 'textarea',
			'desc_tip'    => true,
			'description' => __( 'Email content. Available placeholders: {{first_name}}, {{last_name}}, {{username}}, {{email}}, {{home_url}}, {{blog_info}}, {{all_fields}}, {{verification_link}}', 'registration-form-for-woocommerce' ),
			'default'     => $this->default_content,
			'class'       => 'tgwcfb-editor',
			'css'         => 'width:400px; height: 150px;',
		);
	}

	/**
	 * Get plain email content.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_content_plain() {
		return wc_get_template_html(
			$this->template_plain,
			array(
				'customer'           => $this->object,
				'email_heading'      => $this->get_heading(),
				'email_content'      => ! empty( $this->email_content ) ? $this->email_content : $this->default_content,
				'additional_content' => $this->get_additional_content(),
				'sent_to_admin'      => ! $this->customer_email,
				'plain_text'         => false,
				'email'              => $this,
			),
			$this->template_base,
			$this->template_base
		);
	}

	/**
	 * Send email.
	 *
	 * @since 1.0.0
	 * @param WP_User $user User object.
	 * @param array   $fields Fields.
	 * @return void
	 */
	public function send_email( $user, $fields ) {
		$this->setup_locale();
		$username            = stripslashes( $user->user_login );
		$user_email          = stripslashes( $user->user_email );
		$content             = $this->get_content_setting();
		$content             = $this->parse_smart_tags( $content, $username, $user_email, $fields );
		$this->email_content = $content;
		$this->object        = $user;

		if ( $this->customer_email ) {
			$this->recipient = $user_email;
		}

		if ( $this->is_enabled() && $this->get_recipient() ) {
			$this->send( $this->get_recipient(), $this->get_subject(), $this->get_content(), $this->get_headers(), $this->get_attachments() );
		}

		$this->restore_locale();
	}

	/**
	 * Get content setting.
	 *
	 * @return mixed|void
	 */
	public function get_content_setting() {
		$content = $this->get_option( 'content', '' );
		return apply_filters( 'woocommerce_email_content_' . $this->id, $content, $this->object, $this );
	}

	/**
	 * Parse smart tags.
	 *
	 * @since 1.0.0
	 * @param string $content Content.
	 * @param string $username Username.
	 * @param string $user_email User email.
	 * @param array  $fields Fields.
	 * @return array|string|string[]
	 */
	private function parse_smart_tags( $content = '', $username = '', $user_email = '', $fields = array() ) {
		$all_fields = '<table class="tgwcfb-email-entries"><tbody>';
		if ( ! empty( $fields ) ) {
			foreach ( $fields as $field ) {
				$value       = is_array( $field['value'] ) ? implode( ', ', $field['value'] ) : ( empty( $field['value'] ) ? '' : $field['value'] );
				$all_fields .= "<tr><td>{$field['label']}</td><td>$value</td></tr>";
			}
		}
		$all_fields .= '</body></table>';

		$user = get_user_by( 'email', $user_email );

		$tags = array(
			'{{first_name}}'        => $user->get( 'first_name' ),
			'{{last_name}}'         => $user->get( 'last_name' ),
			'{{username}}'          => $username,
			'{{email}}'             => $user_email,
			'{{home_url}}'          => get_home_url(),
			'{{blog_info}}'         => get_bloginfo(),
			'{{all_fields}}'        => $all_fields,
			'{{verification_link}}' => add_query_arg(
				'tgwcfb_token',
				get_user_meta( $user->ID, 'tgwcfb_confirm_email_token', true ),
				wc_get_page_permalink( 'myaccount' )
			),
		);

		$tags = apply_filters( 'tgwcfb_smart_tags_list', $tags, $user, $fields );

		foreach ( $tags as $k => $v ) {
			$content = str_replace( $k, $v, $content );
		}

		return $content;
	}
}
