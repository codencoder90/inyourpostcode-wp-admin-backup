<?php
/**
 * Installation helper script
 * This file helps with plugin installation and setup
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Plugin installation helper
 */
class CDBT_Installer {
    
    /**
     * Run installation
     */
    public static function install() {
        self::create_tables();
        self::set_default_options();
        self::create_pages();
        self::flush_rewrite_rules();
    }
    
    /**
     * Create database tables
     */
    private static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Customizations table
        $table_name = $wpdb->prefix . 'cdbt_customizations';
        
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            order_id mediumint(9) NOT NULL,
            product_id mediumint(9) NOT NULL,
            customization_data longtext NOT NULL,
            design_image_url varchar(255) DEFAULT '',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY order_id (order_id),
            KEY product_id (product_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        // Design templates table (for future use)
        $templates_table = $wpdb->prefix . 'cdbt_design_templates';
        
        $sql_templates = "CREATE TABLE $templates_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            template_data longtext NOT NULL,
            preview_image varchar(255) DEFAULT '',
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        dbDelta($sql_templates);
    }
    
    /**
     * Set default options
     */
    private static function set_default_options() {
        add_option('cdbt_version', CDBT_PLUGIN_VERSION);
        add_option('cdbt_install_date', current_time('mysql'));
        
        // Default settings
        $default_settings = array(
            'max_upload_size' => 5, // MB
            'allowed_file_types' => array('jpg', 'jpeg', 'png', 'gif'),
            'canvas_width' => 600,
            'canvas_height' => 400,
            'enable_text_customization' => true,
            'enable_image_upload' => true,
            'default_font_family' => 'Arial',
            'default_font_size' => 24,
            'default_font_color' => '#000000'
        );
        
        add_option('cdbt_settings', $default_settings);
    }
    
    /**
     * Create necessary pages
     */
    private static function create_pages() {
        // Create design page (if needed for future use)
        $design_page = get_page_by_path('customize-design');
        
        if (!$design_page) {
            $page_data = array(
                'post_title' => 'Customize Design',
                'post_content' => '[cdbt_design_interface]', // Shortcode for future use
                'post_status' => 'publish',
                'post_type' => 'page',
                'post_slug' => 'customize-design'
            );
            
            $page_id = wp_insert_post($page_data);
            
            if ($page_id) {
                add_option('cdbt_design_page_id', $page_id);
            }
        }
    }
    
    /**
     * Flush rewrite rules
     */
    private static function flush_rewrite_rules() {
        // Add rewrite rules
        add_rewrite_rule(
            '^customize-design/([0-9]+)/?$',
            'index.php?cdbt_design=1&product_id=$matches[1]',
            'top'
        );
        
        // Flush rules
        flush_rewrite_rules();
    }
    
    /**
     * Uninstall plugin
     */
    public static function uninstall() {
        global $wpdb;
        
        // Remove tables
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}cdbt_customizations");
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}cdbt_design_templates");
        
        // Remove options
        delete_option('cdbt_version');
        delete_option('cdbt_install_date');
        delete_option('cdbt_settings');
        delete_option('cdbt_design_page_id');
        
        // Remove pages
        $design_page_id = get_option('cdbt_design_page_id');
        if ($design_page_id) {
            wp_delete_post($design_page_id, true);
        }
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Check if plugin needs update
     */
    public static function maybe_update() {
        $installed_version = get_option('cdbt_version');
        
        if (version_compare($installed_version, CDBT_PLUGIN_VERSION, '<')) {
            self::install();
        }
    }
}