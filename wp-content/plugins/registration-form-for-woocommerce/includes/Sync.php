<?php
/**
 * Sync.
 *
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 * @since 1.0.0
 */

namespace ThemeGrill\WooCommerceRegistrationFormBuilder;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

use WC_Order;
use WP_Comment;
use WP_Post;
use WP_User;

/**
 * Sync.
 */
class Sync {

	/**
	 * Sync constructor.
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
		add_filter( 'wc_get_template', array( $this, 'replace_forms' ), PHP_INT_MAX, 3 );
		add_action( 'init', array( $this, 'init_notices' ) );
		add_filter( 'get_avatar_url', array( $this, 'avatar_url' ), PHP_INT_MAX, 2 );
		add_action( 'tgwcfb_edit_account_form', array( $this, 'edit_account_fields' ) );
		add_filter( 'woocommerce_email_classes', array( $this, 'init_emails' ), PHP_INT_MAX );
		add_action(
			'woocommerce_email_customer_details',
			function ( $order, $sent_to_admin, $plain_text ) {
				$this->get_order_meta_fields( $order, true, $plain_text );
			},
			99,
			3
		);
		add_action(
			'woocommerce_admin_order_data_after_shipping_address',
			function ( $order ) {
				$this->get_order_meta_fields( $order );
			}
		);
		add_action(
			'woocommerce_order_details_after_customer_details',
			function ( $order ) {
				$this->get_order_meta_fields( $order, true );
			}
		);
		add_action( 'admin_init', array( $this, 'register_translation_strings' ) );
		add_action( 'render_block', array( $this, 'render_block' ), PHP_INT_MAX, 10, 2 );
		do_action( 'tgwcfb_sync_unhook' );
	}

	/**
	 * Register translation strings.
	 *
	 * @return void
	 */
	public function register_translation_strings() {
		$forms = get_posts(
			array(
				'post_type'      => 'tgwcfb_form',
				'posts_per_page' => -1,
				'post_status'    => 'publish',
			)
		);
		foreach ( $forms as $form ) {
			$form_fields = parse_blocks( $form->post_content );
			if ( ! empty( $form_fields ) ) {
				foreach ( $form_fields as $form_field ) {
					$block_name = explode( '/', isset( $form_field['blockName'] ) ? $form_field['blockName'] : '' );
					$block_name = isset( $block_name[1] ) ? $block_name[1] : '';
					$id         = isset( $form_field['attrs']['clientId'] ) ? $form_field['attrs']['clientId'] : $block_name;
					$key        = 'tgwcfb_form_' . $form->ID . '_field_' . $id;
					if ( ! empty( $form_field['attrs']['label'] ) ) {
						register_translation_string( "{$key}_label", $form_field['attrs']['label'] );
					}
					if ( ! empty( $form_field['attrs']['placeholder'] ) ) {
						register_translation_string( "{$key}_placeholder", $form_field['attrs']['placeholder'] );
					}
					if ( ! empty( $form_field['attrs']['options'] ) ) {
						foreach ( $form_field['attrs']['options'] as $option ) {
							register_translation_string( "{$key}_option_$option", $option );
						}
					}
					if ( ! empty( $form_field['attrs']['description'] ) ) {
						register_translation_string( "{$key}_description", $form_field['attrs']['description'] );
					}

					$submit_button = get_post_meta( $form->ID, '_tgwcfb_submit_btn_text', true );

					if ( ! empty( $submit_button ) ) {
						register_translation_string( "tgwcfb_form_{$form->ID}_submit_btn_text", $submit_button );
					}
				}
			}
		}
	}

	/**
	 * Change avatar url.
	 *
	 * @param string $url Profile picture url.
	 * @param mixed  $id_or_email User id or email.
	 * @return mixed
	 */
	public function avatar_url( $url, $id_or_email ) {
		$user = false;
		if ( is_numeric( $id_or_email ) ) {
			$user = get_user_by( 'id', absint( $id_or_email ) );
		} elseif ( is_string( $id_or_email ) ) {
			$user = get_user_by( 'email', $id_or_email );
		} elseif ( $id_or_email instanceof WP_User ) {
			$user = $id_or_email;
		} elseif ( $id_or_email instanceof WP_Post ) {
			$user = get_user_by( 'id', (int) $id_or_email->post_author );
		} elseif ( $id_or_email instanceof WP_Comment ) {

			if ( ! empty( $id_or_email->user_id ) ) {
				$user = get_user_by( 'id', (int) $id_or_email->user_id );
			}
		}

		if ( ! $user || is_wp_error( $user ) ) {
			return $url;
		}

		$profile_picture_url = get_user_meta( $user->ID, 'profile_picture_url', true );

		return ! empty( $profile_picture_url ) ? $profile_picture_url : $url;
	}

	/**
	 * Init WC notices.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function init_notices() {
		if ( function_exists( 'wc_print_notices' ) ) {
			add_action( 'tgwcfb_before_customer_login_form', 'woocommerce_output_all_notices' );
			add_action( 'tgwcfb_before_customer_registration_form', 'woocommerce_output_all_notices' );
		}
	}

	public function render_block( $content, $block_data ) {
		if (
			! isset( $_POST['tgwcfb-register-nonce'] ) ||
			! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['tgwcfb-register-nonce'] ) ), 'tgwcfb-register' ) ||
			empty( $block_data['blockName'] ) ||
			false === strpos( $block_data['blockName'], 'tgwcfb/' ) ||
			'tgwcfb/profile-picture' === $block_data['blockName'] ||
			'tgwcfb/password' === $block_data['blockName']
			) {
			return $content;
		}

		$block_name = explode( '/', $block_data['blockName'] );
		$client_id  = isset( $block_data['attrs']['clientId'] ) ? $block_data['attrs']['clientId'] : '';
		$name       = str_replace( '-', '_', $block_name[1] );
		$name       = $client_id ? $name . '_' . $client_id : $name;

		if ( ! isset( $_POST[ $name ] ) ) {
			return $content;
		}

		if ( 'textarea' === $block_name[1] || 'description' === $block_name[1] ) {
			$content = str_replace( '></textarea>', '>' . esc_html( sanitize_textarea_field( $_POST[ $name ] ) ) . '</textarea>', $content );
		} else {
			$content = str_replace( 'name="' . $name . '"', 'name="' . $name . '" value="' . esc_attr( sanitize_text_field( $_POST[ $name ] ) ) . '"', $content );
		}

		return $content;
	}

	/**
	 * Replace form templates.
	 *
	 * @param string $template Template.
	 * @param string $template_name Template name.
	 * @param array  $args Arguments.
	 * @return string Template.
	 */
	public function replace_forms( $template, $template_name, $args ) {
		$id = get_option( '_tgwcfb_default_form_id' );

		if ( ! is_user_logged_in() ) {
			if ( ! empty( $id ) ) {
				$blocks = get_block_names( get_blocks( $id ) );
				add_filter(
					'render_block',
					function ( $content, $data ) use ( $id ) {
						if ( false !== strpos( empty( $data['blockName'] ) ? '' : $data['blockName'], 'tgwcfb/' ) ) {
							return $this->translate_block( $content, $data, $id );
						}
						return $content;
					},
					10,
					2
				);

				if ( 'myaccount/form-login.php' === $template_name ) {
					TGWCFB()->script_style->load_frontend_scripts_and_styles( $blocks );
					$template = TGWCFB_TEMPLATES . '/form-login.php';
				} elseif ( 'checkout/form-billing.php' === $template_name ) {
					TGWCFB()->script_style->load_frontend_scripts_and_styles( $blocks );
					$template = TGWCFB_TEMPLATES . '/form-billing.php';
				}
			}
		} elseif ( 'myaccount/form-edit-account.php' === $template_name ) {
				$template = TGWCFB_TEMPLATES . '/form-edit-account.php';
		}

		return $template;
	}

	/**
	 * Translate block.
	 *
	 * @param string     $content Content.
	 * @param array      $block_data Block data.
	 * @param int|string $form_id Form id.
	 * @return array|string|string[]
	 */
	public function translate_block( $content, $block_data, $form_id ) {
		$block_name = explode( '/', isset( $block_data['blockName'] ) ? $block_data['blockName'] : '' );
		$block_name = isset( $block_name[1] ) ? $block_name[1] : '';
		$key        = isset( $form_field['attrs']['clientId'] ) ? $form_field['attrs']['clientId'] : $block_name;
		$key        = 'tgwcfb_form_' . $form_id . '_field_' . $key;

		if ( ! empty( $block_data['attrs']['label'] ) ) {
			$label            = $block_data['attrs']['label'];
			$translated_label = translate_dynamic_string( $label, "{$key}_label" );
			$content          = str_replace( $label, $translated_label, $content );
		}

		if ( ! empty( $block_data['attrs']['description'] ) ) {
			$description            = $block_data['attrs']['description'];
			$translated_description = translate_dynamic_string( $description, "{$key}_description" );
			$content                = str_replace( $description, $translated_description, $content );
		}

		if ( ! empty( $block_data['attrs']['placeholder'] ) ) {
			$placeholder            = $block_data['attrs']['placeholder'];
			$translated_placeholder = translate_dynamic_string( $placeholder, "{$key}_placeholder" );
			$content                = str_replace( $placeholder, $translated_placeholder, $content );
		}

		if ( ! empty( $block_data['attrs']['options'] ) ) {
			$options = $block_data['attrs']['options'];
			foreach ( $options as $index => $option ) {
				$translated_option = translate_dynamic_string( $option, "{$key}_option_$index" );
				$content           = str_replace( $option, $translated_option, $content );
			}
		}

		return $content;
	}

	/**
	 * Display fields on My Account page.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function edit_account_fields() {
		$user_id = get_current_user_id();
		$form_id = get_user_meta( $user_id, 'tgwcfb_form_id', true );
		$user    = new WP_User( $user_id );

		if ( empty( $form_id ) ) {
			return;
		}

		$fields     = get_edit_account_blocks( $form_id );
		$new_fields = array();

		foreach ( $fields as $field ) {
			list ( $field_name ) = get_field_data( $field );
			$value               = 'tgwcfb/url' === $field['blockName'] ? $user->user_url : get_user_meta( $user_id, $field_name, true );
			$value               = ! empty( $value ) ? $value : '';
			$disabled            = '';

			$field['innerHTML']       = str_replace( 'field-width-50', 'field-width-100', $field['innerHTML'] );
			$field['innerContent'][0] = str_replace( 'field-width-50', 'field-width-100', $field['innerContent'][0] );

			if ( in_array(
				$field['blockName'],
				array(
					'tgwcfb/username',
					'tgwcfb/nickname',
					'tgwcfb/url',
					'tgwcfb/email',
					'tgwcfb/input',
					'tgwcfb/number',
					'tgwcfb/range',
					'tgwcfb/date-picker',
					'tgwcfb/time-picker',
					'tgwcfb/secondary-email',
					'tgwcfb/phone',
				),
				true
			) ) {
				$field['innerHTML']       = str_replace( 'name="' . $field_name . '"', "$disabled value=\"$value\" name=" . '"' . $field_name . '"', $field['innerHTML'] );
				$field['innerContent'][0] = str_replace( 'name="' . $field_name . '"', "$disabled value=\"$value\" name=" . '"' . $field_name . '"', $field['innerContent'][0] );
			}

			if ( in_array( $field['blockName'], array( 'tgwcfb/textarea', 'tgwcfb/description' ), true ) ) {
				$field['innerHTML']       = str_replace( '</textarea>', "$value</textarea>", $field['innerHTML'] );
				$field['innerContent'][0] = str_replace( '</textarea>', "$value</textarea>", $field['innerContent'][0] );
				$field['innerHTML']       = str_replace( '<textarea', "<textarea $disabled", $field['innerHTML'] );
				$field['innerContent'][0] = str_replace( '<textarea', "<textarea $disabled", $field['innerContent'][0] );
			}

			if ( in_array( $field['blockName'], array( 'tgwcfb/select', 'tgwcfb/multi-select', 'tgwcfb/checkbox', 'tgwcfb/radio' ), true ) ) {
				$value                    = is_array( $value ) ? $value : array( $value );
				$field['innerHTML']       = str_replace( 'class="tgwcfb-select', $disabled . ' class="tgwcfb-select', $field['innerHTML'] );
				$field['innerContent'][0] = str_replace( 'class="tgwcfb-select', $disabled . ' class="tgwcfb-select', $field['innerContent'][0] );
				if ( ! empty( $field['attrs']['options'] ) ) {
					foreach ( $field['attrs']['options'] as $option ) {
						if ( in_array( $option, $value, true ) ) {
							if ( in_array( $field['blockName'], array( 'tgwcfb/select', 'tgwcfb/multi-select' ), true ) ) {
								$field['innerHTML']       = str_replace( 'value="' . $option . '"', 'selected value="' . $option . '"', $field['innerHTML'] );
								$field['innerContent'][0] = str_replace( 'value="' . $option . '"', 'selected value="' . $option . '"', $field['innerContent'][0] );
							}

							if ( in_array( $field['blockName'], array( 'tgwcfb/checkbox', 'tgwcfb/radio' ), true ) ) {
								$field['innerHTML']       = str_replace( 'value="' . $option . '"', 'checked' . $disabled . ' value="' . $option . '"', $field['innerHTML'] );
								$field['innerContent'][0] = str_replace( 'value="' . $option . '"', 'checked' . $disabled . ' value="' . $option . '"', $field['innerContent'][0] );
							}
						}
					}
				}
			}

			if ( 'tgwcfb/profile-picture' === $field['blockName'] ) {
				$src                      = ! empty( $value ) ? $value : TGWCFB_ASSETS_DIR_URL . '/images/default_profile.png';
				$field['innerHTML']       = preg_replace( '(src="(.*?)")', "src=$src", $field['innerHTML'] );
				$field['innerContent'][0] = preg_replace( '(src="(.*?)")', "src=$src", $field['innerContent'][0] );
				$field['innerHTML']       = str_replace( '<button type="submit"', "<button type=\"submit\" $disabled", $field['innerHTML'] );
				$field['innerContent'][0] = str_replace( '<button type="submit"', "<button type=\"submit\" $disabled", $field['innerContent'][0] );
			}

			$new_fields[] = $field;
		}

		TGWCFB()->script_style->load_frontend_scripts_and_styles( get_block_names( $new_fields ) );
		?>
		<p></p>
		<fieldset>
			<legend><?php esc_html_e( 'Additional Information', 'registration-form-for-woocommerce' ); ?></legend>
			<?php echo do_shortcode( render_blocks( $new_fields ) ); ?>
			<?php wp_nonce_field( 'tgwcfb-edit-account', 'tgwcfb-edit-account-nonce' ); ?>
		</fieldset>
		<?php
	}

	/**
	 * Init WC emails.
	 *
	 * @since 1.0.0
	 * @param array $emails Array of email notification classes.
	 * @return array
	 */
	public function init_emails( $emails ) {
		$emails['tgwcfb_admin_email']                   = new Email();
		$emails['tgwcfb_profile_details_changed_email'] = new Email(
			array(
				'id'              => 'tgwcfb_profile_details_changed_email',
				'title'           => __( 'Profile Details Changed Email', 'registration-form-for-woocommerce' ),
				'description'     => __( 'Email sent to the admin when a user profile details is changed', 'registration-form-for-woocommerce' ),
				'heading'         => __( 'Profile Details Changed', 'registration-form-for-woocommerce' ),
				'subject'         => __( 'Profile Details Changed', 'registration-form-for-woocommerce' ),
				'default_content' => __(
					'User has changed profile information for the following account:<br/>

SiteName: {{blog_info}} <br/>
Username: {{username}} <br/>

{{all_fields}}
<br/>
Thank You!',
					'registration-form-for-woocommerce'
				),
			)
		);
		$emails['tgwcfb_awaiting_admin_approval_email'] = new Email(
			array(
				'id'              => 'tgwcfb_awaiting_admin_approval_email',
				'title'           => __( 'Awaiting Registration Approval Email', 'registration-form-for-woocommerce' ),
				'description'     => __( 'Email sent to the customer when customer register and approval is required', 'registration-form-for-woocommerce' ),
				'heading'         => __( 'Awaiting Registration Approval', 'registration-form-for-woocommerce' ),
				'subject'         => __( 'Awaiting Registration Approval', 'registration-form-for-woocommerce' ),
				'customer_email'  => true,
				'default_content' => __(
					'Hi {{username}}, <br/>

You have registered on <a href="{{home_url}}">{{blog_info}}</a>. <br/>

Please wait until the site admin approves your registration. You will be notified after it is approved. <br/>

Thank You!',
					'registration-form-for-woocommerce'
				),
			)
		);
		$emails['tgwcfb_registration_pending_email']    = new Email(
			array(
				'id'              => 'tgwcfb_registration_pending_email',
				'title'           => __( 'Registration Pending Email', 'registration-form-for-woocommerce' ),
				'description'     => __( 'Email sent to the customer when admin changes user status to pending', 'registration-form-for-woocommerce' ),
				'heading'         => __( 'Registration Pending', 'registration-form-for-woocommerce' ),
				'subject'         => __( 'Registration Pending', 'registration-form-for-woocommerce' ),
				'customer_email'  => true,
				'default_content' => __(
					'Hi {{username}}, <br/>

Your registration on <a href="{{home_url}}">{{blog_info}}</a> has been changed to pending. <br/>

Sorry for the inconvenience. <br/>

You will be notified after it is approved. <br/>

Thank You!',
					'registration-form-for-woocommerce'
				),
			)
		);
		$emails['tgwcfb_registration_approved_email']   = new Email(
			array(
				'id'              => 'tgwcfb_registration_approved_email',
				'title'           => __( 'Registration Approved Email', 'registration-form-for-woocommerce' ),
				'description'     => __( 'Email sent to the customer when admin approves account', 'registration-form-for-woocommerce' ),
				'heading'         => __( 'Registration Approved', 'registration-form-for-woocommerce' ),
				'subject'         => __( 'Registration Approved', 'registration-form-for-woocommerce' ),
				'customer_email'  => true,
				'default_content' => __(
					'Hi {{username}}, <br/>

Your registration on <a href="{{home_url}}">{{blog_info}}</a>  has been approved. <br/>

Please visit <b>My Account</b> page to edit your account details and create your user profile on <a href="{{home_url}}">{{blog_info}}</a>. <br/>

Thank You!',
					'registration-form-for-woocommerce'
				),
			)
		);
		$emails['tgwcfb_registration_denied_email']     = new Email(
			array(
				'id'              => 'tgwcfb_registration_denied_email',
				'title'           => __( 'Registration Denied Email', 'registration-form-for-woocommerce' ),
				'description'     => __( 'Email sent to the customer when admin disapproves account', 'registration-form-for-woocommerce' ),
				'heading'         => __( 'Registration Denied', 'registration-form-for-woocommerce' ),
				'subject'         => __( 'Registration Denied', 'registration-form-for-woocommerce' ),
				'customer_email'  => true,
				'default_content' => __(
					'Hi {{username}}, <br/>

You have registered on <a href="{{home_url}}">{{blog_info}}</a>. <br/>

Unfortunately your registration is denied. Sorry for the inconvenience. <br/>

Thank You!',
					'registration-form-for-woocommerce'
				),
			)
		);

		$emails['tgwcfb_user_confirmation_email'] = new Email(
			array(
				'id'              => 'tgwcfb_user_confirmation_email',
				'title'           => __( 'Email confirmation', 'registration-form-for-woocommerce' ),
				'description'     => __( 'Email sent to the customer after registration and email confirmation is required', 'registration-form-for-woocommerce' ),
				'heading'         => __( 'Email confirmation', 'registration-form-for-woocommerce' ),
				'subject'         => __( 'Email confirmation', 'registration-form-for-woocommerce' ),
				'customer_email'  => true,
				'default_content' => __(
					'Hi {{username}}, <br/>

You have registered on <a href="{{home_url}}">{{blog_info}}</a>.<br/>

Please click on this verification link {{verification_link}} to confirm registration.

Thank You!',
					'registration-form-for-woocommerce'
				),
			)
		);

		return $emails;
	}

	/**
	 * Get order meta fields.
	 *
	 * @since 1.0.0
	 * @param WC_Order $order WC_Order object.
	 * @param bool     $table_output HTML as table.
	 * @param bool     $plain_text Plain text.
	 * @return void
	 */
	private function get_order_meta_fields( $order, $table_output = false, $plain_text = false ) {
		$user_id = $order->get_customer_id();
		$form_id = get_user_meta( $user_id, 'tgwcfb_form_id', true );
		$html    = '';

		if ( ! empty( $form_id ) ) {
			$blocks     = get_blocks( $form_id );
			$has_blocks = false;

			if ( ! empty( $blocks ) ) {

				foreach ( $blocks as $block ) {
					if ( isset( $block['attrs']['showInOrder'] ) && $block['attrs']['showInOrder'] ) {
						$has_blocks = true;
						break;
					}
				}

				if ( $has_blocks ) {
					$heading_tag = $table_output ? 'h2' : 'h3';
					$html       .= '<div class="extra-information clear"><' . $heading_tag . '>' . __( 'Additional Information', 'registration-form-for-woocommerce' ) . '</' . $heading_tag . '>';

					if ( $plain_text ) {
						$html = "\n" . __( 'Additional Information', 'registration-form-for-woocommerce' ) . "\n\n";
					}

					if ( $table_output && ! $plain_text ) {
						$html .= '<table cellspacing="0" cellpadding="6" class="woocommerce-table--order-details td"><thead><tr>';
						$html .= '<th class="td">' . __( 'Field', 'registration-form-for-woocommerce' ) . '</th>';
						$html .= '<th class="td">' . __( 'Value', 'registration-form-for-woocommerce' ) . '</th>';
						$html .= '</tr></thead><tbody>';
					}

					foreach ( $blocks as $block ) {
						if (
							in_array(
								$block['blockName'],
								array_merge(
									array(
										'tgwcfb/username',
										'tgwcfb/email',
										'tgwcfb/password',
										'core/paragraph',
										'core/heading',
										'core/paragraph',
										'core/heading',
									),
									TGWCFB()->blocks->wc_default_blocks
								),
								true
							) ||
							empty( $block['blockName'] )
						) {
							continue;
						}

						if ( ! isset( $block['attrs']['showInOrder'] ) || ! $block['attrs']['showInOrder'] ) {
							continue;
						}

						list ( $post_field, $label ) = get_field_data( $block );
						$value                       = get_user_meta( $user_id, $post_field, true );
						$value                       = is_array( $value ) ? implode( ', ', $value ) : $value;

						if ( $plain_text ) {
							$html .= $label . ': ' . $value . "\n";
						} elseif ( $table_output ) {
								$html .= '<tr><td class="td">' . $label . '</td><td class="td">' . $value . '</td></tr>';
						} else {
							$html .= '<p><strong>' . $label . '</strong>: ' . $value . '</p>';
						}
					}

					if ( ! $plain_text ) {
						if ( $table_output ) {
							$html .= '</tbody></table>';
						}
						$html .= '</div>';
					}
				}
			}
		}

		echo wp_kses_post( $html );
	}
}
