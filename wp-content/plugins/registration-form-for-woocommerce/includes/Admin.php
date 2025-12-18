<?php
/**
 * Class Admin.
 *
 * @since 1.0.0
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 */

namespace ThemeGrill\WooCommerceRegistrationFormBuilder;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

use Exception;
use WP_User;

/**
 * Class Admin.
 *
 * @since 1.0.0
 */
class Admin {

	/**
	 * Admin constructor.
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
		add_filter( 'manage_users_columns', array( $this, 'add_column_head' ) );
		add_filter( 'manage_users_custom_column', array( $this, 'add_column_content' ), 10, 3 );
		add_action( 'edit_user_profile', array( $this, 'show_fields' ) );
		add_action( 'show_user_profile', array( $this, 'show_fields' ) );
		add_action( 'edit_user_profile_update', array( $this, 'save_meta_fields' ) );
		add_action( 'personal_options_update', array( $this, 'save_meta_fields' ) );
		add_filter( 'user_row_actions', array( $this, 'add_row_actions' ), 10, 2 );
		add_action( 'load-users.php', array( $this, 'trigger_actions' ) );
		add_filter( 'bulk_actions-users', array( $this, 'bulk_actions' ) );
		add_filter( 'load-users.php', array( $this, 'trigger_bulk_actions' ) );
		do_action( 'tgwcfb_admin_unhook' );
	}

	/**
	 * Add column head to the users table.
	 *
	 * @since 1.0.0
	 * @param array $columns Columns head.
	 * @return array
	 */
	public function add_column_head( $columns ) {
		if ( ! current_user_can( 'edit_user' ) ) {
			return $columns;
		}
		return array_merge( $columns, array( 'user_status' => __( 'User Status', 'registration-form-for-woocommerce' ) ) );
	}

	/**
	 * Add column content to the users table.
	 *
	 * @since 1.0.0
	 * @param mixed  $value Column value.
	 * @param string $column Column slug.
	 * @param int    $id User id.
	 * @return mixed
	 */
	public function add_column_content( $value, $column, $id ) {
		if ( 'user_status' === $column ) {
			$status   = get_user_meta( $id, 'user_status', true );
			$status   = empty( $status ) ? 'approved' : $status;
			$statuses = array(
				'approved' => __( 'Approved', 'registration-form-for-woocommerce' ),
				'pending'  => __( 'Pending', 'registration-form-for-woocommerce' ),
				'denied'   => __( 'Denied', 'registration-form-for-woocommerce' ),
			);

			return $statuses[ $status ];
		}

		return $value;
	}

	/**
	 * Show fields in user edit and profile screen.
	 *
	 * @since 1.0.0
	 * @param object $user User.
	 * @return void
	 */
	public function show_fields( $user ) {
		$form_id = get_user_meta( $user->ID, 'tgwcfb_form_id', true );
		$form_id = empty( $form_id ) ? get_option( '_tgwcfb_form_id' ) : $form_id;

		if ( empty( $form_id ) ) {
			return;
		}
		?>
		<input type="hidden" name="tgwcfb_id" value="<?php echo esc_attr( $form_id ); ?>">
		<?php wp_nonce_field( 'tgwcfb-edit-user', 'tgwcfb-edit-user-nonce' ); ?>
		<h2><?php esc_html_e( 'Extra Information', 'registration-form-for-woocommerce' ); ?></h2>
		<table class="form-table" id="tgwcfb-extra-fields">
			<?php if ( get_current_user_id() !== $user->ID ) : ?>
				<tr>
					<th>
						<label for="user_status"><?php esc_html_e( 'User status', 'registration-form-for-woocommerce' ); ?></label>
					</th>
					<td>
						<select class="regular-text tgwcfb-select" name="user_status" id="user_status">
							<option value=""><?php esc_html_e( 'Select', 'registration-form-for-woocommerce' ); ?></option>
							<?php
								$status      = array(
									'approved' => __( 'Approved', 'registration-form-for-woocommerce' ),
									'pending'  => __( 'Pending', 'registration-form-for-woocommerce' ),
									'denied'   => __( 'Deny', 'registration-form-for-woocommerce' ),
								);
								$user_status = get_user_meta( $user->ID, 'user_status', true );
								$user_status = empty( $user_status ) ? 'approved' : $user_status;

								foreach ( $status as $k => $v ) {
									$selected = '';
									if ( $user_status === $k ) {
										$selected = 'selected';
									}
									?>
									<option value="<?php echo esc_attr( $k ); ?>" <?php echo esc_attr( $selected ); ?>><?php echo esc_html( $v ); ?></option>
									<?php
								}
								?>
						</select>
					</td>
				</tr>
			<?php endif; ?>
			<?php
				$blocks = get_blocks( $form_id );
				$fields = $this->get_meta_fields( $blocks );
			foreach ( $fields as $key => $value ) {
				?>
					<tr>
						<th>
							<label for="<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $value['label'] ); ?></label>
						</th>
						<td>
						<?php if ( 'user_status' === $key || in_array( $value['type'], array( 'tgwcfb/select', 'tgwcfb/multi-select' ), true ) ) : ?>
								<select class="regular-text tgwcfb-select" name="<?php echo 'tgwcfb/multi-select' === $value['type'] ? esc_attr( "{$key}[]" ) : esc_attr( $key ); ?>" id="<?php echo esc_attr( $key ); ?>" <?php 'tgwcfb/multi-select' === $value['type'] && print( 'multiple' ); ?>>
									<?php 'tgwcfb/select' === $value['type'] && print( '<option value="">' . esc_html__( 'Select', 'registration-form-for-woocommerce' ) . '</option>' ); ?>
									<?php if ( ! empty( $value['attrs']['options'] ) ) : ?>
										<?php foreach ( array_filter( $value['attrs']['options'] ) as $option ) : ?>
											<?php
											$selected = '';
											if ( 'tgwcfb/select' === $value['type'] && get_user_meta( $user->ID, $key, true ) === $option ) {
												$selected = 'selected';
											} elseif ( 'tgwcfb/multi-select' === $value['type'] ) {
												$array = ! empty( get_user_meta( $user->ID, $key, true ) ) ? get_user_meta( $user->ID, $key, true ) : array();
												if ( in_array( $option, $array, true ) ) {
													$selected = 'selected';
												}
											}
											?>
											<option value="<?php echo esc_attr( $option ); ?>" <?php echo esc_attr( $selected ); ?>><?php echo esc_html( $option ); ?></option>
										<?php endforeach; ?>
									<?php endif; ?>
								</select>
							<?php elseif ( 'tgwcfb/number' === $value['type'] ) : ?>
								<input type="number" class="regular-text" name="<?php echo esc_attr( $key ); ?>" id="<?php echo esc_attr( $key ); ?>" value="<?php echo esc_attr( get_user_meta( $user->ID, $key, true ) ); ?>" />
							<?php elseif ( 'tgwcfb/textarea' === $value['type'] ) : ?>
								<textarea name="<?php echo esc_attr( $key ); ?>" id="<?php echo esc_attr( $key ); ?>" cols="30" rows="5"><?php echo esc_attr( get_user_meta( $user->ID, $key, true ) ); ?></textarea>
							<?php elseif ( 'tgwcfb/checkbox' === $value['type'] || 'tgwcfb/radio' === $value['type'] ) : ?>
								<?php if ( ! empty( $value['attrs']['options'] ) ) : ?>
									<ul>
										<?php foreach ( $value['attrs']['options'] as $option ) : ?>
											<?php
											$checked = '';
											$array   = ! empty( get_user_meta( $user->ID, $key, true ) ) ? (array) get_user_meta( $user->ID, $key, true ) : array();
											if ( in_array( $option, $array, true ) ) {
												$checked = 'checked';
											}
											?>
											<li class="regular-text">
												<input value="<?php echo esc_attr( $option ); ?>" <?php echo esc_attr( $checked ); ?> type="<?php printf( '%s', 'tgwcfb/checkbox' === $value['type'] ? 'checkbox' : 'radio' ); ?>" name="<?php echo 'tgwcfb/checkbox' === $value['type'] ? esc_attr( "{$key}[]" ) : esc_attr( $key ); ?>" id="<?php echo esc_attr( $key . '_' . str_replace( ' ', '_', strtolower( $option ) ) ); ?>">
												<label for="<?php echo esc_attr( $key . '_' . str_replace( ' ', '_', strtolower( $option ) ) ); ?>">
													<?php echo esc_html( $option ); ?>
												</label>
											</li>
										<?php endforeach; ?>
									</ul>
								<?php endif; ?>
							<?php elseif ( 'tgwcfb/range' === $value['type'] ) : ?>
								<?php
								$min  = isset( $block['attrs']['min'] ) ? $block['attrs']['min'] : 0;
								$max  = isset( $block['attrs']['max'] ) ? $block['attrs']['max'] : 100;
								$step = isset( $block['attrs']['step'] ) ? $block['attrs']['step'] : 1;
								?>
								<p class="regular-text tgwcfb-range">
									<input type="range" name="<?php echo esc_attr( $key ); ?>" min="<?php echo esc_attr( $min ); ?>" max="<?php echo esc_attr( $max ); ?>" step="<?php echo esc_attr( $step ); ?>" value="<?php echo esc_attr( get_user_meta( $user->ID, $key, true ) ); ?>">
									<input type="number" name="<?php echo esc_attr( $key ); ?>" id="<?php echo esc_attr( $key ); ?>" value="<?php echo esc_attr( get_user_meta( $user->ID, $key, true ) ); ?>">
								</p>
							<?php elseif ( 'tgwcfb/date-picker' === $value['type'] ) : ?>
								<input type="text" class="regular-text tgwcfb-date" name="<?php echo esc_attr( $key ); ?>" id="<?php echo esc_attr( $key ); ?>" value="<?php echo esc_attr( get_user_meta( $user->ID, $key, true ) ); ?>" />
							<?php elseif ( 'tgwcfb/time-picker' === $value['type'] ) : ?>
								<input type="text" class="regular-text tgwcfb-time" name="<?php echo esc_attr( $key ); ?>" id="<?php echo esc_attr( $key ); ?>" value="<?php echo esc_attr( get_user_meta( $user->ID, $key, true ) ); ?>" />
							<?php else : ?>
								<input type="text" class="regular-text" name="<?php echo esc_attr( $key ); ?>" id="<?php echo esc_attr( $key ); ?>" value="<?php echo esc_attr( get_user_meta( $user->ID, $key, true ) ); ?>" />
							<?php endif; ?>
						</td>
					</tr>
					<?php
			}
			?>
		</table>
		<?php
	}

	/**
	 * Get user meta fields.
	 *
	 * @since 1.0.0
	 * @param array $blocks Blocks.
	 * @return array
	 */
	private function get_meta_fields( $blocks ) {
		$fields = array();
		foreach ( $blocks as $block ) {
			if (
				in_array( $block['blockName'], array_merge( TGWCFB()->blocks->wp_default_blocks, TGWCFB()->blocks->wc_default_blocks ), true ) ||
				empty( $block['blockName'] ) ||
				in_array( $block['blockName'], array( 'core/paragraph', 'core/heading', 'tgwcfb/user-roles', 'tgwcfb/profile-picture', 'tgwcfb/separate-shipping' ), true )
			) {
				continue;
			}
			list ( $post_field, $label ) = get_field_data( $block );
			$block_name                  = $block['blockName'];
			$fields[ $post_field ]       = array(
				'type'  => $block_name,
				'label' => $label,
				'attrs' => $block['attrs'],
			);
		}

		return $fields;
	}

	/**
	 * Save meta fields from user edit and profile screen.
	 *
	 * @since 1.0.0
	 * @param int $user_id User id.
	 * @return void
	 */
	public function save_meta_fields( $user_id ) {
		if (
			! isset( $_POST['tgwcfb-edit-user-nonce'] ) ||
			! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['tgwcfb-edit-user-nonce'] ) ), 'tgwcfb-edit-user' ) ||
			! isset( $_POST['tgwcfb_id'] )
		) {
			return;
		}
		$id     = sanitize_key( wp_unslash( $_POST['tgwcfb_id'] ) );
		$blocks = get_blocks( $id );
		$fields = $this->get_meta_fields( $blocks );

		if ( ! empty( $_POST['user_status'] ) ) {
			$status = sanitize_text_field( wp_unslash( $_POST['user_status'] ) );
			$user   = new WP_User( $user_id );

			wc()->mailer();
			update_user_meta( $user_id, 'user_status', $status );
			do_action( "tgwcfb_registration_{$status}_email", $user, array() );
		}

		foreach ( $fields as $key => $value ) {
			if ( ! isset( $_POST[ $key ] ) || 'password' === $key ) {
				continue;
			}

			if ( in_array( $value['type'], array( 'tgwcfb/checkbox', 'tgwcfb/multi-select' ), true ) ) {
				update_user_meta( $user_id, $key, array_map( 'sanitize_text_field', wp_unslash( $_POST[ $key ] ) ) );
				continue;
			}
			if ( in_array( $value['type'], array( 'tgwcfb/description', 'tgwcfb/textarea' ), true ) ) {
				update_user_meta( $user_id, $key, sanitize_textarea_field( wp_unslash( $_POST[ $key ] ) ) );
				continue;
			}
			update_user_meta( $user_id, $key, sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) );
		}
	}

	/**
	 * Add row actions in users table.
	 *
	 * @since 1.0.0
	 * @param array   $actions Row actions.
	 * @param WP_User $user User object.
	 * @return array
	 */
	public function add_row_actions( $actions, $user ) {
		if ( get_current_user_id() === $user->ID || ! current_user_can( 'edit_users' ) ) {
			return $actions;
		}

		$form_id = get_user_meta( $user->ID, 'tgwcfb_form_id', true );

		$approve_link = add_query_arg(
			array(
				'action' => 'approve',
				'user'   => $user->ID,
			)
		);
		$deny_link    = add_query_arg(
			array(
				'action' => 'deny',
				'user'   => $user->ID,
			)
		);
		$approve_link = wp_nonce_url( $approve_link, 'tgwcfb_user_row_action' );
		$deny_link    = wp_nonce_url( $deny_link, 'tgwcfb_user_row_action' );

		$resend_verification_link = add_query_arg(
			array(
				'action' => 'resend_verification',
				'user'   => $user->ID,
			)
		);

		$resend_verification_link = remove_query_arg( array( 'new_role' ), $resend_verification_link );
		$resend_verification_link = wp_nonce_url( $resend_verification_link, 'tgwcfb_user_row_action' );

		$resend_verification_action = '<a href="' . esc_url( $resend_verification_link ) . '">' . _x( 'Resend Verification', 'The action on users list page', 'registration-form-for-woocommerce' ) . '</a>';
		$approve_action             = '<a href="' . esc_url( $approve_link ) . '">' . _x( 'Approve', 'The action on users list page', 'registration-form-for-woocommerce' ) . '</a>';
		$deny_action                = '<a style="color:#e20707" href="' . esc_url( $deny_link ) . '">' . _x( 'Deny', 'The action on users list page', 'registration-form-for-woocommerce' ) . '</a>';
		$status                     = get_user_meta( $user->ID, 'user_status', true );

		if ( 'denied' === $status ) {
			$actions['tgwcfb_user_status_approve_action'] = $approve_action;
		} elseif ( 'pending' === $status ) {
			$actions['tgwcfb_user_status_approve_action'] = $approve_action;
			$actions['tgwcfb_user_status_deny_action']    = $deny_action;
			if ( 'email_confirmation' === get_post_meta( $form_id, '_tgwcfb_user_approval', true ) ) {
				$actions['tgwcfb_user_resend_verification_action'] = $resend_verification_action;
			}
		} else {
			$actions['tgwcfb_user_status_deny_action'] = $deny_action;
		}

		return $actions;
	}

	/**
	 * Trigger user table custom actions.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function trigger_actions() {
		$action                   = isset( $_REQUEST['action'] ) ? sanitize_key( wp_unslash( $_REQUEST['action'] ) ) : false;
		$mode                     = isset( $_POST['mode'] ) ? sanitize_key( wp_unslash( $_POST['mode'] ) ) : false;
		$user_id                  = isset( $_GET['user'] ) ? absint( $_GET['user'] ) : 0;
		$resend_verification_sent = isset( $_REQUEST['resend_verification_sent'] ) && sanitize_key( $_REQUEST['resend_verification_sent'] );

		if ( $resend_verification_sent ) {
			TGWCFB()->notice->add_notice(
				'tgwcfb_resend_verification_sent',
				'success',
				'',
				__( 'Verification Email Sent Successfully !!', 'registration-form-for-woocommerce' )
			);
		}

		if ( 'list' === $mode || ! empty( $_GET['new_role'] ) || empty( $action ) ) {
			return;
		}

		if ( in_array( $action, array( 'approve', 'deny', 'resend_verification' ), true ) ) {
			check_admin_referer( 'tgwcfb_user_row_action' );
			$status = 'deny' === $action ? 'denied' : ( 'approve' === $action ? 'approved' : 'resend_verification_sent' );
			$user   = new WP_User( $user_id );

			wc()->mailer();

			if ( 'resend_verification_sent' === $status ) {
				update_user_meta( $user_id, 'tgwcfb_confirm_email', 0 );
				update_user_meta( $user_id, 'tgwcfb_confirm_email_token', get_token( $user_id ) );
				do_action( 'tgwcfb_user_confirmation_email', $user, array() );
			} else {
				update_user_meta( $user_id, 'user_status', $status );
				do_action( "tgwcfb_registration_{$status}_email", $user, array() );
			}

			wp_safe_redirect( esc_url_raw( add_query_arg( array( $status => 1 ), admin_url( 'users.php' ) ) ) );
			exit;
		}
	}

	/**
	 * Add bulk actions for users table.
	 *
	 * @since 1.0.0
	 * @param array $actions Bulk actions.
	 * @return array
	 */
	public function bulk_actions( $actions ) {

		if ( ! current_user_can( 'edit_users' ) ) {
			return $actions;
		}

		return array_merge(
			$actions,
			array(
				'approve' => __( 'Approve', 'registration-form-for-woocommerce' ),
				'deny'    => __( 'Deny', 'registration-form-for-woocommerce' ),
			)
		);
	}

	/**
	 * Trigger bulk actions.
	 *
	 * @since 1.0.0
	 * @throws Exception Exception.
	 */
	public function trigger_bulk_actions() {
		$wp_list_table = _get_list_table( 'WP_Users_List_Table' );
		$action        = $wp_list_table->current_action();
		$redirect      = 'users.php';

		if ( ! in_array( $action, array( 'approve', 'deny' ), true ) ) {
			return;
		}

		if ( ! current_user_can( 'edit_users' ) ) {
			throw new Exception( 'You do not have enough permissions to perform a bulk action on users approval status' );
		}

		check_admin_referer( 'bulk-users' );

		if ( empty( $_REQUEST['users'] ) ) {
			wp_safe_redirect( $redirect );
			exit();
		}

		$user_ids = array_map( 'sanitize_key', wp_unslash( $_REQUEST['users'] ) );

		if ( 'approve' === $action ) {
			$status    = 'approved';
			$query_arg = 'approved';
		} else {
			$status    = 'denied';
			$query_arg = 'denied';
		}

		$i = 0;

		foreach ( $user_ids as $user_id ) {
			$user_id = (int) $user_id;

			// Do not change status of current user.
			if ( get_current_user_id() === $user_id ) {
				continue;
			}

			$user = new WP_User( $user_id );

			wc()->mailer();
			update_user_meta( $user_id, 'user_status', $status );
			do_action( "tgwcfb_registration_{$status}_email", $user, array() );
			++$i;
		}

		wp_safe_redirect( add_query_arg( $query_arg, $i, $redirect ) );
		exit();
	}
}
