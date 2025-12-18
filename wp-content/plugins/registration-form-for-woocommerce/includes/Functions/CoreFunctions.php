<?php
/**
 * Core function for the plugin.
 *
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 * @since 1.0.0
 */

namespace ThemeGrill\WooCommerceRegistrationFormBuilder;

/**
 * Default post content.
 *
 * @since 1.0.0
 * @return mixed
 */
function default_content() {
	return apply_filters(
		'tgwcfb_default_content',
		'<!-- wp:tgwcfb/username {"label":"Username","required":true,"edited":true} -->
<p id="reg_username_field" class="form-row field-width-100"><label for="reg_username">Username <span class="required">*</span></label><input type="text" placeholder="" class="input-text" name="username" id="reg_username" autocomplete="username"/></p>
<!-- /wp:tgwcfb/username -->

<!-- wp:tgwcfb/email {"label":"Email address","required":true,"edited":true} -->
<p id="reg_email_field" class="form-row field-width-100"><label for="reg_email">Email address <span class="required">*</span></label><input type="email" placeholder="" class="input-text" name="email" id="reg_email" autocomplete="email"/></p>
<!-- /wp:tgwcfb/email -->

<!-- wp:tgwcfb/password {"label":"Password","required":true,"edited":true} -->
<p id="reg_password_field" class="form-row field-width-100"><label for="reg_password">Password <span class="required">*</span></label><span class="password-input"><input type="password" placeholder="" class="input-text" name="password" id="reg_password" autocomplete="new-password"/></span></p>
<!-- /wp:tgwcfb/password -->'
	);
}

/**
 * Check if WC is active.
 *
 * @since 1.0.0
 * @return bool
 */
function is_wc_active() {
	return class_exists( 'WooCommerce' );
}

/**
 * Render blocks.
 *
 * @since 1.0.0
 * @param array $blocks Blocks.
 * @return string Post content
 */
function render_blocks( $blocks = array(), $id = null, $should_translate = false ) {

	$pro_blocks = array(
		'tgwcfb/phone',
		'tgwcfb/multi-select',
		'tgwcfb/date-picker',
		'tgwcfb/profile-picture',
		'tgwcfb/range',
		'tgwcfb/time-picker',
		'tgwcfb/user-roles',
		'tgwcfb/file-upload',
	);

	$filtered_blocks = array_filter(
		$blocks,
		function ( $block ) use ( $pro_blocks ) {
			return ! in_array( $block['blockName'], $pro_blocks );
		}
	);

	return array_reduce(
		$filtered_blocks,
		function ( $acc, $curr ) {
			$acc .= render_block( $curr );
			return $acc;
		},
		''
	);
}

/**
 * Get blocks.
 *
 * @since 1.0.0
 * @param int $id Post id.
 * @return array[] Blocks.
 */
function get_blocks( $id ) {
	$content = get_post( $id )->post_content;
	return parse_blocks( $content );
}

/**
 * Get block names;
 *
 * @since 1.0.0
 * @param array $blocks Blocks.
 * @return mixed
 */
function get_block_names( $blocks ) {
	return array_reduce(
		$blocks,
		function ( $block_names, $current_block ) {
			if ( ! empty( $current_block['blockName'] ) ) {
				$block_names[] = $current_block['blockName'];
			}
			return $block_names;
		},
		array()
	);
}

/**
 * Get checkout block fields.
 *
 * @since 1.0.0
 * @return array|mixed
 */
function get_checkout_blocks() {
	$checkout_blocks = get_option( '_tgwcfb_checkout_fields' );
	if ( empty( $checkout_blocks ) ) {
		return array();
	}
	return array_reduce(
		$checkout_blocks,
		function ( $acc, $curr ) {
			if ( ! empty( $curr['blockName'] ) && ! empty( $curr['innerHTML'] ) ) {
				$curr['innerHTML']       = str_replace( 'field-width-50', 'field-width-100', $curr['innerHTML'] );
				$curr['innerContent'][0] = str_replace( 'field-width-50', 'field-width-100', $curr['innerContent'][0] );
				$acc[]                   = $curr;
			}
			return $acc;
		},
		array()
	);
}

/**
 * Get fields for My Account.
 *
 * @since 1.0.0
 * @param int $form_id Form id.
 * @return array[]
 */
function get_edit_account_blocks( $form_id ) {
	$blocks = get_blocks( (int) $form_id );

	$blocks = parse_grouped_blocks( $blocks );

	return array_filter(
		$blocks,
		function ( $block ) {
			return ! empty( $block['blockName'] ) &&
			! in_array(
				$block['blockName'],
				array_merge(
					array(
						'tgwcfb/display-name',
						'tgwcfb/username',
						'tgwcfb/first-name',
						'tgwcfb/last-name',
						'tgwcfb/password',
						'tgwcfb/email',
						'tgwcfb/user-roles',
						'core/heading',
						'core/paragraph',
						'tgwcfb/separate-shipping',
					),
					TGWCFB()->blocks->wc_default_blocks
				),
				true
			);
		}
	);
}

/**
 * Get field Data.
 *
 * @since 1.0.0
 * @param array $field Field as block.
 * @return array
 */
function get_field_data( $field ) {
	list( , $block_name ) = explode( '/', $field['blockName'] );
	$field_name           = str_replace( '-', '_', $block_name );

	if ( 'tgwcfb/profile-picture' === $field['blockName'] ) {
		$field_name = 'profile_picture_url';
	}

	if ( isset( $field['attrs']['clientId'] ) ) {
		$field_name = "{$field_name}_{$field['attrs']['clientId']}";
	}

	$required = isset( $field['attrs']['required'] ) && $field['attrs']['required'];
	$label    = isset( $field['attrs']['label'] ) ? $field['attrs']['label'] : '';

	return array( $field_name, $label, $required );
}

/**
 * Recaptcha.
 *
 * @param int $id Post id.
 * @return void
 */
function recaptcha( $id ) {
	$captcha_type = get_option( '_tgwcfb_captcha_type', 'v2' );

	// Initialize variables
	$site_key   = '';
	$secret_key = '';
	$is_enabled = false;

	// Handle reCAPTCHA v2
	if ( 'v2' === $captcha_type ) {
		$site_key   = get_option( '_tgwcfb_site_key' );
		$secret_key = get_option( '_tgwcfb_secret_key' );
		$is_enabled = get_post_meta( $id, '_tgwcfb_recaptcha_v2', true );

		// If v2 is enabled, load the v2 API
		if ( empty( $secret_key ) || empty( $site_key ) || ! $is_enabled ) {
			return;
		}

		$recaptcha_api    = 'https://www.google.com/recaptcha/api.js?onload=TGWCFBRecaptchaLoad&render=explicit';
		$recaptcha_inline = 'var TGWCFBRecaptchaLoad=function(){jQuery(".g-recaptcha").each(function(a,c){var r=grecaptcha.render(c);jQuery(c).attr("data-recaptcha-id",r)})};';

		static $count_v2 = 1;

		wp_enqueue_script( 'tgwcfb-recaptcha', $recaptcha_api, array( 'jquery' ), '2.0.0', true );

		if ( 1 === $count_v2 ) {
			wp_add_inline_script( 'tgwcfb-recaptcha', $recaptcha_inline );
			++$count_v2;
		}

		echo '<div class="tgwcfb-recaptcha-container form-row">';
		echo '<div class="g-recaptcha" data-sitekey="' . esc_attr( $site_key ) . '" data-recaptcha-id="' . esc_attr( $count_v2 ) . '"></div>';
		echo '</div>';

		// Handle reCAPTCHA v3
	} elseif ( 'v3' === $captcha_type ) {
		$site_key   = get_option( '_tgwcfb_recaptcha_v3_site_key' );
		$secret_key = get_option( '_tgwcfb_recaptcha_v3_secrete_key' );
		$is_enabled = get_post_meta( $id, '_tgwcfb_recaptcha_v3', true );

		if ( empty( $secret_key ) || empty( $site_key ) || ! $is_enabled ) {
			return;
		}

		$recaptcha_api = 'https://www.google.com/recaptcha/api.js?render=' . $site_key;

		wp_enqueue_script( 'tgwcfb-recaptcha-v3', $recaptcha_api, array(), '3.0.0', true );

		$recaptcha_v3_inline = '
    var TGWCFBRecaptchaLoad = function() {
        grecaptcha.ready(function() {
            grecaptcha.execute("' . esc_js( $site_key ) . '", { action: "submit" }).then(function(token) {
                // Make sure the element exists before setting its value
                var tokenInput = jQuery(".tgwcfb-recaptcha-token");
                if (tokenInput.length) {
                    tokenInput.val(token);
                } else {
                    console.warn("reCAPTCHA token input element not found.");
                }
            });
        });
    };
    // Trigger the function when the page is ready
    jQuery(document).ready(function() {
        TGWCFBRecaptchaLoad();
    });
';

		static $count_v3 = 1;
		if ( 1 === $count_v3 ) {
			// Add the inline script for v3
			wp_add_inline_script( 'tgwcfb-recaptcha-v3', $recaptcha_v3_inline );
			++$count_v3;
		}

		// Output the container for reCAPTCHA v3 (invisible)
		echo '<input type="hidden" class="tgwcfb-recaptcha-token" name="recaptcha_token" value="">';
	} elseif ( 'hcaptcha' === $captcha_type ) {
		$site_key   = get_option( '_tgwcfb_hcaptcha_site_key' );
		$secret_key = get_option( '_tgwcfb_hcaptcha_secrete_key' );
		$is_enabled = get_post_meta( $id, '_tgwcfb_hcaptcha', true );

		if ( empty( $secret_key ) || empty( $site_key ) || ! $is_enabled ) {
			return;
		}

		$hcaptcha_api = 'https://js.hcaptcha.com/1/api.js';

		wp_enqueue_script( 'tgwcfb-hcaptcha', $hcaptcha_api, array( 'jquery' ), '1.0.0', true );

		echo '<div class="tgwcfb-hcaptcha-container form-row field-width-100">';
		echo '<div class="h-captcha" data-sitekey="' . esc_attr( $site_key ) . '"></div>';
		echo '</div>';

		$hcaptcha_inline = '
			jQuery(document).ready(function() {
				// You can add custom functionality after the hCaptcha has been rendered
				// For example, handle form submission or token storage here
			});
		';
		wp_add_inline_script( 'tgwcfb-hcaptcha', $hcaptcha_inline );
	}
}


/**
 * Encrypt/Decrypt the provided string.
 * Encrypt while setting token and updating to database, decrypt while comparing the stored token.
 *
 * @param string $string String to encrypt|decrypt.
 * @param string $action encrypt|decrypt action.
 * @return false|string Encrypted|decrypted string.
 */
function crypt_string( $string, $action = 'encrypt' ) {
	$secret_key     = 'tgwcfb_secret_key';
	$secret_id      = 'tgwcfb_secret_iv';
	$output         = false;
	$encrypt_method = 'AES-256-CBC';
	$key            = hash( 'sha256', $secret_key );
	$iv             = substr( hash( 'sha256', $secret_id ), 0, 16 );

	switch ( $action ) {
		case 'encrypt':
			$output = base64_encode( openssl_encrypt( $string, $encrypt_method, $key, 0, $iv ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
			break;
		case 'decrypt':
			$output = openssl_decrypt( base64_decode( $string ), $encrypt_method, $key, 0, $iv ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
			break;
	}

	return $output;
}

/**
 * Generate token.
 *
 * @param int $user_id User ID.
 * @return string Token.
 * @throws \Exception Exception.
 */
function get_token( $user_id ) {
	$length         = 50;
	$token          = '';
	$code_alphabet  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	$code_alphabet .= 'abcdefghijklmnopqrstuvwxyz';
	$code_alphabet .= '0123456789';
	$max            = strlen( $code_alphabet );

	for ( $i = 0; $i < $length; $i++ ) {
		$token .= $code_alphabet[ random_int( 0, $max - 1 ) ];
	}

	$token .= crypt_string( $user_id . '_' . time(), 'encrypt' );

	return $token;
}

/**
 * Register translation string.
 *
 * @param string $key Unique identifier for the string.
 * @param string $string The string to register.
 * @return void
 */
function register_translation_string( $key, $string ) {
	if ( function_exists( 'pll_register_string' ) ) {
		pll_register_string( $key, $string, 'registration-form-for-woocommerce' );
	} elseif ( function_exists( 'icl_object_id' ) ) {
		do_action( 'wpml_register_single_string', 'registration-form-for-woocommerce', $key, $string );
	}
}

/**
 * Get translated string.
 *
 * @param string      $string String to translate.
 * @param null|string $key Key to translate.
 * @return mixed|string|null
 */
function translate_dynamic_string( $string, $key = null ) {
	if ( function_exists( 'pll__' ) ) {
		return pll__( $string );
	}

	if ( function_exists( 'icl_object_id' ) && $key ) {
		return apply_filters(
			'wpml_translate_single_string',
			$string,
			'registration-form-for-woocommerce',
			$key
		);
	}

	return $string;
}

function admin_email_defaults( $defaults = false ) {

	$settings = array(
		'id'              => 'tgwcfb_admin_email',
		'title'           => __( 'Admin Email', 'registration-form-for-woocommerce' ),
		'description'     => __( 'Email sent to the admin when a new user registers', 'registration-form-for-woocommerce' ),
		'template_base'   => TGWCFB_TEMPLATES,
		'template_html'   => 'html-email.php',
		'template_plain'  => 'plain-email.php',
		'heading'         => __( 'New user registration', 'registration-form-for-woocommerce' ),
		'subject'         => __( 'New user registration', 'registration-form-for-woocommerce' ),
		'default_content' => __(
			'Hi Admin, <br/>

A new user {{username}} - {{email}} has successfully registered to your site <a href="{{home_url}}">{{blog_info}}</a>. <br/>

Please review the user role and details at <b>Users</b> menu in your WP dashboard111. <br/>

Thank You!',
			'registration-form-for-woocommerce'
		),
		'to'              => get_option( 'admin_email' ),
	);

	if ( $defaults ) {
		return $settings;
	}
	$settings = get_option( '_tgwcfb_admin_email_settings', $settings );
	if ( is_string( $settings ) ) {
		$settings = json_decode( $settings, true );
	}

	return $settings;
}

/**
 * Parse grouped blocks.
 *
 * @param [type] $blocks The blocks list.
 * @return array
 */
function parse_grouped_blocks( $blocks ): array {
	$all_blocks = array();

	if ( empty( $blocks ) ) {
		return $all_blocks;
	}

	$valid_blocks = array_merge(
		TGWCFB()->blocks->wp_default_blocks,
		TGWCFB()->blocks->wc_default_blocks,
		TGWCFB()->blocks->custom_blocks
	);

	foreach ( $blocks as $block ) {
		if ( empty( $block['blockName'] ) ) {
			continue;
		}

		// Handle group blocks
		if ( 'core/group' === $block['blockName'] && ! empty( $block['innerBlocks'] ) ) {
			foreach ( $block['innerBlocks'] as $inner_block ) {
				if ( ! empty( $inner_block['blockName'] ) && in_array( $inner_block['blockName'], $valid_blocks, true ) ) {
					$all_blocks[] = $inner_block;
				}
			}
			continue;
		}

		// Add regular blocks
		if ( in_array( $block['blockName'], $valid_blocks, true ) ) {
			$all_blocks[] = $block;
		}
	}

	return $all_blocks;
}
