<?php
/**
 * Woocommerce lost password form is replaced by this template
 *
 * This template can be overridden by copying it to yourtheme/templates/xoo-el-wc-lost-password.php.
 * @version 9.2.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

$shortcode = xoo_el_helper()->get_general_option('m-myacclpw-sc');

do_action( 'woocommerce_before_lost_password_form' ); ?>

<?php echo do_shortcode( apply_filters( 'xoo_el_lostpw_shortcode',  $shortcode ) ); ?>
		
<?php do_action( 'woocommerce_after_lost_password_form' ); ?>