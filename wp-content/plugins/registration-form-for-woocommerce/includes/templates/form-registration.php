<?php
/**
 * Form registration template.
 *
 * @since 1.0.0
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

use function ThemeGrill\WooCommerceRegistrationFormBuilder\recaptcha;
use function ThemeGrill\WooCommerceRegistrationFormBuilder\translate_dynamic_string;
?>
<div class="woocommerce">
	<?php do_action( 'tgwcfb_before_customer_registration_form' ); ?>
	<form method="post" class="woocommerce-form woocommerce-form-register register tgwcfb-register" <?php do_action( 'tgwcfb_register_form_tag' ); ?> >
		<?php do_action( 'tgwcfb_register_form_start' ); ?>
		<?php do_action( 'tgwcfb_register_form' ); ?>
		<?php echo do_shortcode( $content ); ?>
		<?php recaptcha( $form_id ); ?>
		<div class="woocommerce-form-row form-row">
			<?php wp_nonce_field( 'woocommerce-register', 'woocommerce-register-nonce' ); ?>
			<?php wp_nonce_field( 'tgwcfb-register', 'tgwcfb-register-nonce' ); ?>
			<input type="hidden" name="tgwcfb_id" value="<?php echo esc_attr( $form_id ); ?>">
			<?php
			$text = get_post_meta( $form_id, '_tgwcfb_submit_btn_text', true );
			$text = empty( $text ) ? __( 'Register', 'registration-form-for-woocommerce' ) : $text;
			$text = translate_dynamic_string( $text, "tgwcfb_form_{$form_id}_submit_btn_text" );
			?>
			<button type="submit" class="woocommerce-Button woocommerce-button button woocommerce-form-register__submit" name="register" value="<?php echo esc_attr( $text ); ?>"><?php echo esc_html( $text ); ?></button>
		</div>
		<?php do_action( 'tgwcfb_register_form_end' ); ?>
	</form>
	<?php do_action( 'tgwcfb_after_customer_registration_form' ); ?>
</div>

