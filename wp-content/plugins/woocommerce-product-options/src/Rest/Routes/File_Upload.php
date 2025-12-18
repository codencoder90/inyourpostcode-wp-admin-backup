<?php

namespace Barn2\Plugin\WC_Product_Options\Rest\Routes;

use Barn2\Plugin\WC_Product_Options\Model\Option as Option_Model;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Rest\Base_Route;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Rest\Route;
use WP_Error;
use WP_REST_Response;
use WP_REST_Server;

/**
 * REST controller for the uploading files from the frontend.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class File_Upload extends Base_Route implements Route {

	protected $rest_base = 'file-upload';
	private $extension   = '';
	private $mime_type   = '';

	/**
	 * Register the REST routes.
	 */
	public function register_routes() {

		// CREATE.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'create' ],
					'permission_callback' => [ $this, 'permission_callback' ]
				]
			]
		);
	}

	/**
	 * Upload file.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function create( $request ) {
		$option_id = $request->get_param( 'option_id' );
		$files     = $request->get_file_params();

		$file_data = $files['file'];

		if ( ! $option_id ) {
			return new WP_Error( 'wpo_file_upload_error', __( 'Insufficient data supplied.', 'woocommerce-product-options' ) );
		}

		if ( ! $file_data ) {
			return new WP_Error( 'wpo_file_upload_error', __( 'Insufficient data supplied.', 'woocommerce-product-options' ) );
		}

		$option = Option_Model::where( 'id', $option_id )->first();

		if ( ! $option ) {
			return new WP_Error( 'wpo_file_upload_error', __( 'Insufficient data supplied', 'woocommerce-product-options' ) );
		}

		if ( $option->type !== 'file_upload' ) {
			return new WP_Error( 'wpo_file_upload_error', __( 'Insufficient data supplied', 'woocommerce-product-options' ) );
		}

		if ( ! $this->is_allowed_file_type( $file_data, $option ) ) {
			return new WP_Error( 'wpo_file_upload_error', __( 'File type is not allowed.', 'woocommerce-product-options' ) );
		}

		$this->extension = pathinfo( $file_data['name'], PATHINFO_EXTENSION );
		$this->mime_type = $file_data['type'];

		// Include filesystem functions to get access to wp_handle_upload().
		require_once ABSPATH . 'wp-admin/includes/file.php';

		add_filter( 'upload_dir', [ $this, 'custom_upload_dir' ] );
		add_filter( 'upload_mimes', [ $this, 'add_allowed_mime_type' ] );

		$file = wp_handle_upload( $file_data, [ 'test_form' => false ] );

		if ( ! $file || isset( $file['error'] ) ) {
			return new WP_Error(
				'rest_upload_unknown_error',
				$file,
				[ 'status' => 500 ]
			);
		}

		remove_filter( 'upload_dir', [ $this, 'custom_upload_dir' ] );
		remove_filter( 'upload_mimes', [ $this, 'add_allowed_mime_type' ] );

		// add path to unlinked files option
		$unlinked_files = get_option( 'wpo_unlinked_files', [] );

		if ( ! in_array( $file, $unlinked_files, true ) ) {
			$unlinked_files[] = $file['url'];
			update_option( 'wpo_unlinked_files', $unlinked_files );
		}

		/**
		 * Filter the thumbnail dimensions.
		 *
		 * Specify an array the width and height of the thumbnail in pixels.
		 * If either width or height is null, the thumbnail will be resized proportionally.
		 * Returning null will effectively prevent the thumbnail from being generated.
		 *
		 * @param array $size The size of the thumbnail as an array of width and height.
		 * @param array $file The file data.
		 */
		$thumbnail_size = apply_filters( 'wc_product_options_uploads_thumbnail_size', [ 120, null ], $file );

		if ( strpos( $file['type'], 'image' ) === 0 && ! is_null( $thumbnail_size ) ) {
			$thumbnail = wp_get_image_editor( $file['file'] );

			if ( ! is_wp_error( $thumbnail ) ) {
				/**
				 * Filter the quality for the thumbnail.
				 *
				 * @param int $quality The quality of the thumbnail.
				 * @param array $file The file data.
				 */
				$thumbnail_quality = apply_filters( 'wc_product_options_uploads_thumbnail_quality', 60, $file );

				$parsed_file = pathinfo( $file['file'] );
				$thumbnail->set_quality( $thumbnail_quality );
				$thumbnail->resize( $thumbnail_size[0], $thumbnail_size[1], false );
				$thumbnail->save( $parsed_file['dirname'] . '/' . $parsed_file['filename'] . '-thumb.' . $parsed_file['extension'] );
			}
		}

		return new WP_REST_Response( $file, 200 );
	}

	/**
	 * Custom upload directory.
	 *
	 * @param array $path_data
	 * @return array $path_data
	 */
	public function custom_upload_dir( $path_data ): array {

		// require wc-cart-functions for session shutdown
		require_once WC_ABSPATH . 'includes/wc-cart-functions.php';
		require_once WC_ABSPATH . 'includes/wc-notice-functions.php';

		if ( null === WC()->session ) {
			$session_class = apply_filters( 'woocommerce_session_handler', 'WC_Session_Handler' );

			// Prefix session class with global namespace if not already namespaced
			if ( false === strpos( $session_class, '\\' ) ) {
				$session_class = '\\' . $session_class;
			}

			WC()->session = new $session_class();
			WC()->session->init();
		}

		$wpo_dir = '/wpo-uploads';

		/**
		 * Filter whether to use year/month folders for uploaded files.
		 *
		 * Example:
		 * ```
		 * add_filter( 'wc_product_options_uploads_use_year_month', '__return_true' );
		 * ```
		 *
		 * @param bool $use_year_month Whether to use year/month folders for uploaded files. Default false.
		 */
		if ( apply_filters( 'wc_product_options_uploads_use_year_month', false ) ) {
			$wpo_dir .= '/' . date( 'Y/m' );
		}

		$session_dir = hash( 'md5', WC()->session->get_customer_id() );

		$path_data['path']   = $path_data['basedir'] . $wpo_dir . '/' . $session_dir;
		$path_data['url']    = $path_data['baseurl'] . $wpo_dir . '/' . $session_dir;
		$path_data['subdir'] = '';

		return $path_data;
	}

	/**
	 * Check if the file extension is allowed for the option.
	 *
	 * @param array $file_data
	 * @param Option_Model $option
	 */
	private function is_allowed_file_type( $file_data, $option ) {
		if ( ! isset( $option->settings ) || ! isset( $option->settings['file_upload_allowed_types'] ) || empty( $option->settings['file_upload_allowed_types'] ) ) {
			$allowed_extensions = [ 'jpg|jpeg|jpe', 'png', 'docx', 'xlsx', 'pptx', 'pdf' ];
		} else {
			$allowed_extensions = $option->settings['file_upload_allowed_types'];
		}

		foreach ( $allowed_extensions as $ext_preg ) {
			$ext_preg = '!\.(' . $ext_preg . ')$!i';
			if ( preg_match( $ext_preg, $file_data['name'], $ext_matches ) ) {
				return true;
			}
		}

		return false;
	}

	public function add_allowed_mime_type( $mime_types ) {
		$mime_types[ $this->extension ] = $this->mime_type;

		return $mime_types;
	}

	/**
	 * Permission callback.
	 *
	 * @return bool
	 */
	public function permission_callback() {
		return true;
	}
}
