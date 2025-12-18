<?php
/**
 * Plain email template.
 *
 * @since 1.0.0
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

echo esc_html( wp_strip_all_tags( $email_heading ) );
echo "\n-----------------------------------------\n\n";

echo esc_html( wp_strip_all_tags( wptexturize( $email_content ) ) );

$additional_content && print( esc_html( wp_strip_all_tags( wptexturize( $additional_content ) ) ) . '\n\n----------------------------------------\n\n' );

echo wp_kses_post( apply_filters( 'woocommerce_email_footer_text', get_option( 'woocommerce_email_footer_text' ) ) );
