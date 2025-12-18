<?php
namespace Barn2\Plugin\WC_Product_Options;

use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Registerable;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Admin\Notices;
use Barn2\Plugin\WC_Product_Options\Dependencies\Lib\Service\Standard_Service;

/**
 * Handles the protection of custom upload directories.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Upload_Directory implements Registerable, Standard_Service {

	/**
	 * {@inheritdoc}
	 */
	public function register(): void {
		if ( $this->is_apache() ) {
			add_action( 'init', [ $this, 'create_apache_protection_files' ] );
		}
	}

	/**
	 * Show a notice if the user is using Nginx.
	 */
	public function maybe_show_nginx_notice(): void {
		$dismissed = get_option( 'wptrt_notice_dismissed_wpo_nginx_notice', false );

		if ( ! $dismissed ) {
			$admin_notice = new Notices();
			$admin_notice->add(
				'nginx_notice',
				__( 'The files uploaded via WooCommerce Product Options are not currently protected.', 'woocommerce-product-options' ),
				__( 'To protect them, you must add this <a href="https://barn2.com/kb/">NGINX redirect rule</a>. If you have already done this, or it does not apply to your site, you may permanently dismiss this notice.', 'woocommerce-product-options' ),
				[
					'type'          => 'warning',
					'scope'         => 'global',
					'capability'    => 'install_plugins',
					'option_prefix' => 'wpo_notice_dismissed',
				]
			);
			$admin_notice->boot();
		}
	}

	/**
	 * Creates the Apache protection files.
	 *
	 * Graciously borrowed from EDD (GPL).
	 *
	 * @param bool $force Whether to force the creation of the files.
	 */
	public function create_apache_protection_files( $force = false ) {
		if ( false === get_transient( 'wpo_check_uploaded_file_protection' ) || $force ) {

			$upload_path = $this->get_upload_dir();

			// Top level .htaccess file
			$rules = "Options -Indexes\n";

			if ( $this->htaccess_exists() ) {
				$contents = @file_get_contents( $upload_path . '/.htaccess' );
				if ( $contents !== $rules || ! $contents ) {
					// Update the .htaccess rules if they don't match
					@file_put_contents( $upload_path . '/.htaccess', $rules );
				}
			} elseif ( wp_is_writable( $upload_path ) ) {
				// Create the file if it doesn't exist
				@file_put_contents( $upload_path . '/.htaccess', $rules );
			}

			// Top level blank index.php
			if ( ! file_exists( $upload_path . '/index.php' ) && wp_is_writable( $upload_path ) ) {
				@file_put_contents( $upload_path . '/index.php', '<?php' . PHP_EOL . '// Silence is golden.' );
			}

			// Now place index.php files in all sub folders
			$folders = $this->scan_folders( $upload_path );
			foreach ( $folders as $folder ) {
				// Create index.php, if it doesn't exist
				if ( ! file_exists( $folder . 'index.php' ) && wp_is_writable( $folder ) ) {
					@file_put_contents( $folder . 'index.php', '<?php' . PHP_EOL . '// Silence is golden.' );
				}
			}

			// Check for the files once per day
			set_transient( 'wpo_check_uploaded_file_protection', true, DAY_IN_SECONDS );
		}
	}

	/**
	 * Retrives the upload directory path.
	 *
	 * @return string
	 */
	public function get_upload_dir() {
		$wp_upload_dir = wp_upload_dir();
		$path          = $wp_upload_dir['basedir'] . '/wpo-uploads';

		// Create the directory if it doesn't exist.
		wp_mkdir_p( $path );

		return $path;
	}


	/**
	 * Scans all folders inside of /uploads/wpo-uploads
	 *
	 * @param string $path   Path to scan
	 * @param array  $return Results of previous recursion
	 *
	 * @return array $return List of files inside directory
	 */
	private function scan_folders( string $path = '', array $return = [] ): array {
		$path  = ( $path === '' ) ? __DIR__ : $path;
		$lists = @scandir( $path );

		// Bail early if nothing to scan
		if ( empty( $lists ) ) {
			return $return;
		}

		// Loop through directory items
		foreach ( $lists as $f ) {
			$dir = $path . DIRECTORY_SEPARATOR . $f;

			// Skip if not a directory
			if ( ! is_dir( $dir ) || ( $f === '.' ) || ( $f === '..' ) ) {
				continue;
			}

			// Maybe add directory to return array
			if ( ! in_array( $dir, $return, true ) ) {
				$return[] = trailingslashit( $dir );
			}

			// Recursively scan
			$this->scan_folders( $dir, $return );
		}

		return $return;
	}

	/**
	 * Checks if the .htaccess file exists.
	 *
	 * @return bool
	 */
	private function htaccess_exists(): bool {
		$upload_path = $this->get_upload_dir();

		return file_exists( $upload_path . '/.htaccess' );
	}

	/**
	 * Checks if the server is running Apache.
	 *
	 * @return bool
	 */
	private function is_nginx(): bool {
		return stripos( $_SERVER['SERVER_SOFTWARE'], 'nginx' ) !== false;
	}

	/**
	 * Checks if the server is running Nginx.
	 *
	 * @return bool
	 */
	private function is_apache(): bool {
		return stripos( $_SERVER['SERVER_SOFTWARE'], 'Apache' ) !== false;
	}
}
