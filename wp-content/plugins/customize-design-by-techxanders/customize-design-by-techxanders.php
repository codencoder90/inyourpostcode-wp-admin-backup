<?php
/**
 * Plugin Name: Customize Design By Code N Coders
 * Plugin URI: https://codencoder.com/
 * Description: A comprehensive WooCommerce plugin that allows customers to customize product designs with text, images, and frame options.
 * Version: 1.0.0
 * Author: Techxanders
 * Author URI: https://codencoder.com/
 * Requires at least: 5.0
 * Tested up to: 6.3
 * WC requires at least: 5.0
 * WC tested up to: 8.0
 * Text Domain: customize-design-codencoders
 * Domain Path: /languages
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('CDBT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CDBT_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('CDBT_PLUGIN_VERSION', '1.0.0');
define('CDBT_TEXT_DOMAIN', 'customize-design-techxanders');

/**
 * Main plugin class
 */
class CustomizeDesignByTechxanders {
    
    /**
     * Single instance of the class
     */
    private static $instance = null;
    
    /**
     * Get single instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        add_action('plugins_loaded', array($this, 'init'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        register_activation_hook(__FILE__, array($this, 'cdbt_activate_plugin'));

    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        // Check if WooCommerce is active
        if (!$this->is_woocommerce_active()) {
            add_action('admin_notices', array($this, 'woocommerce_missing_notice'));
            return;
        }
        
        // Load plugin files
        $this->load_includes();
        
        // Initialize hooks
        $this->init_hooks();
    }
    
    /**
     * Check if WooCommerce is active
     */
    private function is_woocommerce_active() {
        return class_exists('WooCommerce');
    }
    
    /**
     * Show notice if WooCommerce is not active
     */
    public function woocommerce_missing_notice() {
        ?>
        <div class="notice notice-error">
            <p><?php _e('Customize Design By Techxanders requires WooCommerce to be installed and active.', CDBT_TEXT_DOMAIN); ?></p>
        </div>
        <?php
    }
    
    /**
     * Load plugin includes
     */
    private function load_includes() {
        require_once CDBT_PLUGIN_PATH . 'install.php';
        require_once CDBT_PLUGIN_PATH . 'includes/class-admin.php';
        require_once CDBT_PLUGIN_PATH . 'includes/class-frontend.php';
        require_once CDBT_PLUGIN_PATH . 'includes/class-cart.php';
        require_once CDBT_PLUGIN_PATH . 'includes/class-order.php';
        require_once CDBT_PLUGIN_PATH . 'includes/class-ajax.php';
        require_once CDBT_PLUGIN_PATH . 'includes/class-cart-order-display.php';
        require_once CDBT_PLUGIN_PATH. 'includes/class-db-schema.php';
require_once CDBT_PLUGIN_PATH . 'includes/class-artwork-handler.php';
require_once CDBT_PLUGIN_PATH . 'includes/class-artwork-api.php';
require_once CDBT_PLUGIN_PATH . 'cdbt-order-display.php';

        // Check for updates
        CDBT_Installer::maybe_update();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Enqueue scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        
        // Initialize classes
        new CDBT_Admin();
        new CDBT_Frontend();
        new CDBT_Cart();
        new CDBT_Order();
        new CDBT_Ajax();
        
        // Initialize Artwork API
        if (class_exists('CDBT_Artwork_API')) {
            new CDBT_Artwork_API();
        }
    }
    
    /**
     * Enqueue frontend scripts and styles
     */
    public function enqueue_frontend_scripts() {
        wp_enqueue_style('cdbt-frontend', CDBT_PLUGIN_URL . 'assets/css/frontend.css?time='.time(), array(), CDBT_PLUGIN_VERSION);
        wp_enqueue_style('cdbt-artwork-frontend', CDBT_PLUGIN_URL . 'assets/css/frontend-artwork.css', array(), CDBT_PLUGIN_VERSION);
        wp_enqueue_script('cdbt-frontend', CDBT_PLUGIN_URL . 'assets/js/frontend.js?time='.time(), array('jquery'), CDBT_PLUGIN_VERSION, true);
        
        // Localize script for AJAX
        wp_localize_script('cdbt-frontend', 'cdbt_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('cdbt_nonce'),
            'plugin_url' => CDBT_PLUGIN_URL
        ));
    }
    
    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        global $post_type;
        
        if ('product' === $post_type || 'shop_order' === $post_type) {
            wp_enqueue_style('cdbt-admin', CDBT_PLUGIN_URL . 'assets/css/admin.css', array(), CDBT_PLUGIN_VERSION);
            wp_enqueue_script('cdbt-admin', CDBT_PLUGIN_URL . 'assets/js/admin.js', array('jquery'), CDBT_PLUGIN_VERSION, true);
            
            // Enqueue media scripts for image selection
            wp_enqueue_media();
            
            wp_localize_script('cdbt-admin', 'cdbt_admin_ajax', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('cdbt_admin_nonce')
            ));
        }
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Check WooCommerce dependency
        if (!$this->is_woocommerce_active()) {
            deactivate_plugins(plugin_basename(__FILE__));
            wp_die(__('Customize Design By Techxanders requires WooCommerce to be installed and active.', CDBT_TEXT_DOMAIN));
        }
        
        // Load installer
        require_once CDBT_PLUGIN_PATH . 'install.php';
        
        // Run installation
        CDBT_Installer::install();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clean up if needed
    }
    
    /**
     * Artwork plugin activation
     * Create database table for artworks
     */
    public function cdbt_activate_plugin() {
        // Create artworks table
        if (class_exists('CDBT_Database_Schema')) {
            CDBT_Database_Schema::create_artworks_table();
        }
        
        // Flush rewrite rules for REST API
        flush_rewrite_rules();
    }

}

// Initialize the plugin
CustomizeDesignByTechxanders::get_instance();