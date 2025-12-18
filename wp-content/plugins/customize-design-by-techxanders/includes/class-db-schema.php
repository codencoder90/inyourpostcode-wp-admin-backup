<?php
/**
 * Database Schema - Artwork Management
 * 
 * Purpose: Creates wp_cdbt_artworks table automatically on plugin activation
 * یہ فائل plugin activate ہونے پر automatically table بنا دے گی
 * 
 * @package CustomizeDesignByTechXanders
 * @version 1.0
 */

if (!defined('ABSPATH')) {
    exit; // Direct access not allowed
}

class CDBT_Database_Schema {
    
    /**
     * Create artworks table
     * Table automatically بنے گی plugin activation پر
     */
    public static function create_artworks_table() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'cdbt_artworks';
        $charset_collate = $wpdb->get_charset_collate();
        
        // SQL query to create table
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            title varchar(255) NOT NULL,
            image_url varchar(500) NOT NULL,
            thumbnail_url varchar(500) DEFAULT NULL,
            file_name varchar(255) NOT NULL,
            file_size bigint(20) DEFAULT NULL,
            dimensions varchar(50) DEFAULT NULL,
            mime_type varchar(100) DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            status varchar(20) DEFAULT 'active',
            display_order int(11) DEFAULT 0,
            PRIMARY KEY (id),
            KEY status (status),
            KEY display_order (display_order)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        // Check if table created successfully
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") == $table_name) {
            error_log('CDBT: Artworks table created successfully');
            return true;
        } else {
            error_log('CDBT: Failed to create artworks table');
            return false;
        }
    }
    
    /**
     * Drop artworks table (for uninstall)
     * Plugin delete ہونے پر table remove کرنے کے لیے
     */
    public static function drop_artworks_table() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'cdbt_artworks';
        $wpdb->query("DROP TABLE IF EXISTS $table_name");
        error_log('CDBT: Artworks table dropped');
    }
    
    /**
     * Get table name
     */
    public static function get_table_name() {
        global $wpdb;
        return $wpdb->prefix . 'cdbt_artworks';
    }
}
