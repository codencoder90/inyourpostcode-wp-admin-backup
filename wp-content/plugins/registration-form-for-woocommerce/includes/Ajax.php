<?php
/**
 * Ajax.
 *
 * @package ThemeGrill\WooCommerceRegistrationFormBuilder
 * @since 1.0.0
 */

namespace ThemeGrill\WooCommerceRegistrationFormBuilder;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Ajax.
 *
 * @since 1.0.0
 */
class Ajax {

	/**
	 * Ajax constructor.
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
		add_action( 'wp_ajax_nopriv_upload_profile_picture', array( $this, 'upload_profile_picture' ) );
		add_action( 'wp_ajax_upload_profile_picture', array( $this, 'upload_profile_picture' ) );
		do_action( 'tgwcfb_ajax_unhook' );
	}

	/**
	 * Upload profile picture.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function upload_profile_picture() {
		check_ajax_referer( 'tgwcfb_profile_picture_upload_nonce', 'security' );

		$upload               = isset( $_FILES['file'] ) ? array_map( 'sanitize_text_field', $_FILES['file'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- wp_unslash() breaks upload on Windows.
		$valid_extensions     = isset( $_REQUEST['valid_extension'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['valid_extension'] ) ) : 'image/jpeg,image/jpg,image/gif,image/png';
		$valid_extension_type = explode( ',', $valid_extensions );
		$valid_ext            = array();

		foreach ( $valid_extension_type as $key => $value ) {
			$image_extension   = explode( '/', $value );
			$valid_ext[ $key ] = $image_extension[1];
		}

		$src_file_name  = isset( $upload['name'] ) ? $upload['name'] : '';
		$file_extension = strtolower( pathinfo( $src_file_name, PATHINFO_EXTENSION ) );

		if ( ! in_array( $file_extension, $valid_ext, true ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'Invalid file type, please contact with site administrator.', 'registration-form-for-woocommerce' ),
				)
			);
		}

		$max_size                       = wp_max_upload_size();
		$value                          = isset( $_REQUEST['cropped_image'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['cropped_image'] ) ) : '';
		$cropped_image_size             = json_decode( $value, true );
		$max_uploaded_size_option_value = isset( $_REQUEST['max_uploaded_size'] ) ? intval( wp_unslash( $_REQUEST['max_uploaded_size'] ) ) : '';

		if ( '' !== $max_uploaded_size_option_value ) {
			$max_upload_size_options_value = $max_uploaded_size_option_value * 1024;
		} else {
			$max_upload_size_options_value = $max_size;
		}

		if ( ! isset( $upload['size'] ) || ( $upload['size'] < 1 ) ) {
			wp_send_json_error(
				array(
					/* translators: %s - Min Size */
					'message' => sprintf( __( 'Please upload a picture with size more than %s', 'registration-form-for-woocommerce' ), size_format( $max_size ) ),
				)
			);
		} elseif ( $upload['size'] > $max_upload_size_options_value ) {
			wp_send_json_error(
				array(
					/* translators: %s - Max Size */
					'message' => sprintf( __( 'Please upload a picture with size less than %s', 'registration-form-for-woocommerce' ), size_format( $max_upload_size_options_value ) ),
				)
			);
		}

		$uploads = apply_filters( 'tgwcfb_file_upload_url', wp_upload_dir() );

		if ( ! is_writable( $uploads['path'] ) ) {  /*Check if upload dir is writable*/
			wp_send_json_error(
				array(
					'message' => __( 'Upload path permission deny.', 'registration-form-for-woocommerce' ),
				)
			);

		}
		$post_overrides = array(
			'post_status' => 'publish',
			'post_title'  => $upload['name'],
		);
		$attachment_id  = media_handle_sideload( $upload, (int) 0, $post_overrides['post_title'], $post_overrides );

		if ( is_wp_error( $attachment_id ) ) {
			wp_send_json_error(
				array(
					'message' => $attachment_id->get_error_message(),
				)
			);
		}
		$url = wp_get_attachment_url( $attachment_id );

		// Retrieves the directory path of uploaded picture.
		$pic_path = wp_get_upload_dir()['path'] . '/' . basename( get_attached_file( $attachment_id ) );

		// Retrieves original picture height and width.
		list( $original_image_width, $original_image_height ) = getimagesize( $pic_path );

		// Determines the type of uploaded picture and treats them differently.
		switch ( $upload['type'] ) {
			case 'image/png':
				$img_r = imagecreatefrompng( $pic_path );
				break;
			case 'image/gif':
				$img_r = imagecreatefromgif( $pic_path );
				break;
			default:
				$img_r = imagecreatefromjpeg( $pic_path );
		}

		$cropped_image_holder_width  = rtrim( $cropped_image_size['holder_width'], 'px' );
		$cropped_image_holder_height = rtrim( $cropped_image_size['holder_height'], 'px' );

		// Calculates the actual portion of original picture where the cropping is applied.
		$cropped_image_width  = absint( $cropped_image_size['w'] * $original_image_width / $cropped_image_holder_width );
		$cropped_image_left   = absint( $cropped_image_size['x'] * $original_image_width / $cropped_image_holder_width );
		$cropped_image_height = absint( $cropped_image_size['h'] * $original_image_height / $cropped_image_holder_height );
		$cropped_image_right  = absint( $cropped_image_size['y'] * $original_image_height / $cropped_image_holder_height );

		$dst_r = wp_imageCreateTrueColor( $original_image_width, $original_image_height );
		imagecopyresampled( $dst_r, $img_r, 0, 0, $cropped_image_left, $cropped_image_right, $original_image_width, $original_image_height, $cropped_image_width, $cropped_image_height );

		// Retrieves and Resizes the cropped picture to a size defined by user in filter or default of 150 by 150.
		list(
			$image_width,
			$image_height
		)       = apply_filters( 'tgwcfb_cropped_image_size', array( 150, 150 ) );
		$dest_r = wp_imageCreateTrueColor( $image_width, $image_height );

		imagecopyresampled( $dest_r, $dst_r, 0, 0, 0, 0, $image_width, $image_height, $original_image_width, $original_image_height );

		// Replaces the original picture with the cropped picture.
		$img_r = imagejpeg( $dest_r, wp_get_upload_dir()['path'] . '/' . basename( get_attached_file( $attachment_id ) ) );

		if ( empty( $url ) ) {
			$url = home_url() . '/wp-includes/images/media/text.png';
		}

		wp_send_json_success(
			array(
				'attachmentId'      => $attachment_id,
				'profilePictureURL' => $url,
			)
		);
	}
}
