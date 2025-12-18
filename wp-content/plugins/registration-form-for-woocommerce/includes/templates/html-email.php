<?php
/**
 * HTML email template.
 *
 * @since 1.0.0
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email );

echo wp_kses_post( wpautop( wptexturize( $email_content ) ) );

$additional_content && print( wp_kses_post( wpautop( wptexturize( $additional_content ) ) ) );

do_action( 'woocommerce_email_footer', $email );
