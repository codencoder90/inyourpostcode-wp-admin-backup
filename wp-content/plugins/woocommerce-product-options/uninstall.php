<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */

// If uninstall not called from WordPress, then exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

$settings      = get_option( 'wpo_settings', [] );
$preserve_data = ! filter_var( $settings['delete_data'] ?? false, FILTER_VALIDATE_BOOLEAN );

if ( $preserve_data ) {
	return;
}

/**
 * 1. DELETE ALL THE CUSTOM TABLES
 */
global $wpdb;

$tables_to_delete = [
	"{$wpdb->prefix}wpo_groups",
	"{$wpdb->prefix}wpo_options",
];

foreach ( $tables_to_delete as $table ) {
	$wpdb->query( "DROP TABLE IF EXISTS {$table}" );
}

/**
 * 2. DELETE ALL THE TRANSIENTS
 */
$transients_to_delete = [
	'wpo_check_uploaded_file_protection',
	'barn2_plugin_review_banner_461766',
	'barn2_plugin_promo_461766',
	'barn2_notice_dismissed_first_activation_461766',
];

foreach ( $transients_to_delete as $transient ) {
	delete_transient( $transient );
}

/**
 * 3. DELETE ANY ACTION REGISTERED WITH THE WOOCOMMERCE ACTION SCHEDULER
 */
$wpdb->query(
	$wpdb->prepare( "DELETE FROM {$wpdb->prefix}actionscheduler_actions WHERE hook = %s", 'wpo-file-cleanup' )
);

/**
 * 4. DELETE ALL THE UPLOADED FILES
 */
global $wp_filesystem;
$upload_dir         = wp_upload_dir();
$upload_dir         = trailingslashit( $upload_dir['basedir'] );
$wpo_uploads_folder = $upload_dir . 'wpo-uploads/';

if ( empty( $wp_filesystem ) ) {
	require_once ABSPATH . 'wp-admin/includes/file.php';
	WP_Filesystem();
}

$wp_filesystem->delete( $wpo_uploads_folder, true );

/**
 * 5. DELETE ALL THE OPTIONS
 */
delete_option( 'wpo_settings' );
delete_option( 'woocommerce_product_options_version' );
delete_option( 'barn2_plugin_license_461766' );
delete_option( 'barn2_notice_dismissed_missing_wlp' );

$settings = get_option( 'wlp_live_preview', [] );

if ( empty( $settings ) ) {
	return;
}

/**
 * 6. DELETE ALL THE LIVE PREVIEW OPTIONS
 */
delete_option( 'wlp_live_preview' );

/**
 * 7. DELETE ALL THE LIVE PREVIEW PRINTABLE AREA META
 */
$wpdb->query(
	$wpdb->prepare(
		"DELETE FROM {$wpdb->prefix}postmeta WHERE meta_key = %s",
		'_wlp_printable_areas'
	)
);
