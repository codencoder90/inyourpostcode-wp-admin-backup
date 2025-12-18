<?php
/**
 * Login form template.
 *
 * @since 1.0.0
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

use function ThemeGrill\WooCommerceRegistrationFormBuilder\get_blocks;
use function ThemeGrill\WooCommerceRegistrationFormBuilder\render_blocks;
use function ThemeGrill\WooCommerceRegistrationFormBuilder\recaptcha;
use function ThemeGrill\WooCommerceRegistrationFormBuilder\translate_dynamic_string;

$reg_username = '';
$reg_email    = '';

if ( ( isset( $_POST['tgwcfb-register-nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['tgwcfb-register-nonce'] ) ), 'tgwcfb-register' ) ) ||
	( isset( $_POST['woocommerce-register-nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['woocommerce-register-nonce'] ) ), 'woocommerce-register' ) )
) {
	$reg_username = ! empty( $_POST['username'] ) ? sanitize_text_field( wp_unslash( $_POST['username'] ) ) : '';
	$reg_email    = ! empty( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
}
?>

<?php do_action( 'tgwcfb_before_customer_login_form' ); ?>
<?php if ( 'yes' === get_option( 'woocommerce_enable_myaccount_registration' ) ) : ?>
<div class="u-columns col2-set" id="customer_login">
	<div class="u-column1 col-1">
		<?php endif; ?>
		<h2><?php esc_html_e( 'Login', 'registration-form-for-woocommerce' ); ?></h2>
		<form class="woocommerce-form woocommerce-form-login login" method="post">
			<?php do_action( 'tgwcfb_login_form_start' ); ?>
			<p class="form-row">
				<label for="username"><?php esc_html_e( 'Username or email address', 'registration-form-for-woocommerce' ); ?>&nbsp;<span class="required">*</span></label>
				<input type="text" class="input-text" name="username" id="username" autocomplete="username" value="<?php echo esc_attr( $reg_username ); ?>" />
			</p>
			<p class="form-row">
				<label for="password"><?php esc_html_e( 'Password', 'registration-form-for-woocommerce' ); ?>&nbsp;<span class="required">*</span></label>
				<input class="input-text" type="password" name="password" id="password" autocomplete="current-password" />
			</p>
			<?php do_action( 'tgwcfb_login_form' ); ?>
			<p class="form-row">
				<label class="woocommerce-form__label woocommerce-form__label-for-checkbox woocommerce-form-login__rememberme">
					<input class="woocommerce-form__input woocommerce-form__input-checkbox" name="rememberme" type="checkbox" id="rememberme" value="forever" /> <span><?php esc_html_e( 'Remember me', 'registration-form-for-woocommerce' ); ?></span>
				</label>
				<?php wp_nonce_field( 'woocommerce-login', 'woocommerce-login-nonce' ); ?>
				<button type="submit" class="woocommerce-button button woocommerce-form-login__submit" name="login" value="<?php esc_attr_e( 'Log in', 'registration-form-for-woocommerce' ); ?>"><?php esc_html_e( 'Log in', 'registration-form-for-woocommerce' ); ?></button>
			</p>
			<p class="woocommerce-LostPassword lost_password">
				<a href="<?php echo esc_url( wp_lostpassword_url() ); ?>"><?php esc_html_e( 'Lost your password?', 'registration-form-for-woocommerce' ); ?></a>
			</p>
			<?php do_action( 'tgwcfb_login_form_end' ); ?>
		</form>
		<?php if ( 'yes' === get_option( 'woocommerce_enable_myaccount_registration' ) ) : ?>
	</div>
	<div class="u-column2 col-2">
		<h2><?php esc_html_e( 'Register', 'registration-form-for-woocommerce' ); ?></h2>
		<form method="post" class="woocommerce-form woocommerce-form-register register tgwcfb-register" <?php do_action( 'tgwcfb_register_form_tag' ); ?> >
			<?php do_action( 'tgwcfb_register_form_start' ); ?>
			<?php
			$form_id = get_option( '_tgwcfb_form_id' );
			if ( ! empty( $form_id ) ) :
				$blocks = get_blocks( $form_id );
				echo do_shortcode( render_blocks( $blocks ) );
				recaptcha( $form_id );
			else :
				?>
				<?php if ( 'no' === get_option( 'woocommerce_registration_generate_username' ) ) : ?>
					<p class="form-row">
						<label for="reg_username"><?php esc_html_e( 'Username', 'registration-form-for-woocommerce' ); ?>&nbsp;<span class="required">*</span></label>
						<input type="text" class="input-text" name="username" id="reg_username" autocomplete="username" value="<?php echo esc_attr( $reg_username ); ?>" />
					</p>
				<?php endif; ?>
				<p class="form-row">
					<label for="reg_email"><?php esc_html_e( 'Email address', 'registration-form-for-woocommerce' ); ?>&nbsp;<span class="required">*</span></label>
					<input type="email" class="input-text" name="email" id="reg_email" autocomplete="email" value="<?php echo esc_attr( $reg_email ); ?>" />
				</p>
				<?php if ( 'no' === get_option( 'woocommerce_registration_generate_password' ) ) : ?>
					<p class="form-row">
						<label for="reg_password"><?php esc_html_e( 'Password', 'registration-form-for-woocommerce' ); ?>&nbsp;<span class="required">*</span></label>
						<input type="password" class="input-text" name="password" id="reg_password" autocomplete="new-password" />
					</p>
				<?php else : ?>
					<p><?php esc_html_e( 'A link to set a new password will be sent to your email address.', 'registration-form-for-woocommerce' ); ?></p>
				<?php endif; ?>
			<?php endif; ?>
			<?php do_action( 'tgwcfb_register_form' ); ?>
			<p class="woocommerce-form-row form-row">
				<?php wp_nonce_field( 'woocommerce-register', 'woocommerce-register-nonce' ); ?>
				<?php wp_nonce_field( 'tgwcfb-register', 'tgwcfb-register-nonce' ); ?>
				<input type="hidden" value="<?php echo esc_attr( $form_id ); ?>" name="tgwcfb_id" />
				<?php
					$text = get_post_meta( $form_id, '_tgwcfb_submit_btn_text', true );
					$text = empty( $text ) ? __( 'Register', 'registration-form-for-woocommerce' ) : $text;
					$text = translate_dynamic_string( $text, "tgwcfb_form_{$form_id}_submit_btn_text" );
				?>
				<button type="submit" class="woocommerce-Button woocommerce-button button woocommerce-form-register__submit" name="register" value="<?php echo esc_attr( $text ); ?>"><?php echo esc_html( $text ); ?></button>
			</p>
			<?php do_action( 'tgwcfb_register_form_end' ); ?>
		</form>
	</div>
</div>
<?php endif; ?>

<?php do_action( 'tgwcfb_after_customer_login_form' ); ?>
