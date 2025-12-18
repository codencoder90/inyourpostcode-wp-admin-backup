<?php
/**
 * AJAX functionality
 */

if (!defined('ABSPATH')) {
    exit;
}

class CDBT_Ajax {
    
    public function __construct() {
        add_action('wp_ajax_cdbt_add_to_cart', array($this, 'add_to_cart'));
        add_action('wp_ajax_nopriv_cdbt_add_to_cart', array($this, 'add_to_cart'));
        add_action('wp_ajax_cdbt_upload_image', array($this, 'upload_image'));
        add_action('wp_ajax_nopriv_cdbt_upload_image', array($this, 'upload_image'));
        add_action('wp_ajax_cdbt_save_design', array($this, 'save_design'));
        add_action('wp_ajax_nopriv_cdbt_save_design', array($this, 'save_design'));
        // NEW: Add background removal action
        add_action('wp_ajax_cdbt_remove_background', array($this, 'remove_background'));
        add_action('wp_ajax_nopriv_cdbt_remove_background', array($this, 'remove_background'));
    }
    
    /**
     * Add customized product to cart
     */
    public function add_to_cart() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'cdbt_nonce')) {
            wp_send_json_error(__('Security check failed.', CDBT_TEXT_DOMAIN));
        }

        $product_id = intval($_POST['product_id']);
        $variation_id = isset($_POST['variation_id']) ? intval($_POST['variation_id']) : 0;
        $customization_data = $_POST['customization_data'];

        if (!$product_id || !$customization_data) {
            wp_send_json_error(__('Invalid data provided. Product ID: ' . $product_id . ', Has customization data: ' . (!empty($customization_data) ? 'yes' : 'no'), CDBT_TEXT_DOMAIN));
        }

        // Decode customization data if it's JSON
        if (is_string($customization_data)) {
            $customization_data = json_decode(stripslashes($customization_data), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                wp_send_json_error(__('Invalid customization data format.', CDBT_TEXT_DOMAIN));
            }
        }

        // Validate customization data
        if (!is_array($customization_data) || empty($customization_data['frame_size'])) {
            wp_send_json_error(__('Invalid customization data structure.', CDBT_TEXT_DOMAIN));
        }

        $product = wc_get_product($product_id);
        if (!$product) {
            wp_send_json_error(__('Product not found.', CDBT_TEXT_DOMAIN));
        }

        if ($product->is_type('variable')) {
            if (!$variation_id) {
                wp_send_json_error(__('Please select product options before customizing.', CDBT_TEXT_DOMAIN));
            }

            $variation = wc_get_product($variation_id);
            if (!$variation || $variation->get_parent_id() !== $product_id) {
                wp_send_json_error(__('Invalid product variation.', CDBT_TEXT_DOMAIN));
            }
        }

        // ✅ Detect custom image to use in cart thumbnail
        $cart_thumbnail = '';
        if (!empty($customization_data['uploaded_images'][0]['url'])) {
            // Use uploaded image as thumbnail
            $cart_thumbnail = esc_url($customization_data['uploaded_images'][0]['url']);
        } elseif (!empty($customization_data['design_image'])) {
            // Or use saved design image
            $cart_thumbnail = esc_url($customization_data['design_image']);
        } else {
            // Fallback to product image
            $cart_thumbnail = wp_get_attachment_url($product->get_image_id());
        }

        // Add to cart
        $cart_item_key = WC()->cart->add_to_cart(
            $product_id,
            1,
            $variation_id,
            array(),
            array(
                'cdbt_customization' => $customization_data,
                'cdbt_thumbnail'     => $cart_thumbnail,
                'unique_key'         => md5(microtime() . rand())
            )
        );

        if ($cart_item_key) {
            wp_send_json_success(array(
                'message'  => __('Product added to cart successfully!', CDBT_TEXT_DOMAIN),
                'cart_url' => wc_get_cart_url(),
                'thumb'    => $cart_thumbnail
            ));
        } else {
            $notices = wc_get_notices('error');
            $error_message = __('Failed to add product to cart.', CDBT_TEXT_DOMAIN);
            if (!empty($notices)) {
                $error_message .= ' ' . implode(' ', array_column($notices, 'notice'));
                wc_clear_notices();
            }
            wp_send_json_error($error_message);
        }
    }

    /**
     * Upload custom image - UPDATED to support more formats
     */
    public function upload_image() {
        check_ajax_referer('cdbt_nonce', 'nonce');
        
        if (!isset($_FILES['image'])) {
            wp_send_json_error(__('No image uploaded.', CDBT_TEXT_DOMAIN));
        }
        
        $file = $_FILES['image'];
        
        // UPDATED: Extended list of allowed image types
        $allowed_types = array(
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp',
            'image/avif',
            'image/bmp',
            'image/tiff',
            'image/svg+xml'
        );
        
        if (!in_array($file['type'], $allowed_types)) {
            wp_send_json_error(__('Invalid file type. Allowed formats: JPG, PNG, GIF, WEBP, AVIF, BMP, TIFF, SVG', CDBT_TEXT_DOMAIN));
        }
        
        // Validate file size (max 10MB - increased for higher quality formats)
        if ($file['size'] > 10 * 1024 * 1024) {
            wp_send_json_error(__('File size too large. Maximum 10MB allowed.', CDBT_TEXT_DOMAIN));
        }
        
        // Upload file
        $upload_overrides = array('test_form' => false);
        $uploaded_file = wp_handle_upload($file, $upload_overrides);
        
        if (isset($uploaded_file['error'])) {
            wp_send_json_error($uploaded_file['error']);
        }
        
        wp_send_json_success(array(
            'url' => $uploaded_file['url'],
            'file' => $uploaded_file['file']
        ));
    }
    
    /**
     * NEW: Remove background from image
     * Uses remove.bg API - requires API key to be configured
     */
    public function remove_background() {
        check_ajax_referer('cdbt_nonce', 'nonce');
        
        if (!isset($_POST['image_url'])) {
            wp_send_json_error(__('No image URL provided.', CDBT_TEXT_DOMAIN));
        }
        
        $image_url = esc_url_raw($_POST['image_url']);
        
        // Get API key from WordPress options
        $api_key ='WoW4bvf4w5sgRNjP6bqS2FAN';
        
        if (empty($api_key)) {
            wp_send_json_error(__('Background removal is not configured. Please add your remove.bg API key in plugin settings.', CDBT_TEXT_DOMAIN));
        }
        
        // Download the original image first
        $image_data = wp_remote_get($image_url);
        
        if (is_wp_error($image_data)) {
            wp_send_json_error(__('Failed to download image.', CDBT_TEXT_DOMAIN));
        }
        
        $image_content = wp_remote_retrieve_body($image_data);
        
        // Call remove.bg API
        $response = wp_remote_post('https://api.remove.bg/v1.0/removebg', array(
            'headers' => array(
                'X-Api-Key' => $api_key,
            ),
            'body' => array(
                'image_file_b64' => base64_encode($image_content),
                'size' => 'auto',
                'format' => 'png'
            ),
            'timeout' => 60
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error(__('Failed to remove background: ' . $response->get_error_message(), CDBT_TEXT_DOMAIN));
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        
        if ($response_code !== 200) {
            $body = json_decode(wp_remote_retrieve_body($response), true);
            $error_message = isset($body['errors'][0]['title']) ? $body['errors'][0]['title'] : 'Unknown error';
            wp_send_json_error(__('Background removal failed: ' . $error_message, CDBT_TEXT_DOMAIN));
        }
        
        // Save the processed image
        $processed_image = wp_remote_retrieve_body($response);
        
        // Generate unique filename
        $filename = 'nobg-' . uniqid() . '.png';
        $upload_dir = wp_upload_dir();
        $file_path = $upload_dir['path'] . '/' . $filename;
        
        // Save file
        if (file_put_contents($file_path, $processed_image)) {
            $file_url = $upload_dir['url'] . '/' . $filename;
            
            wp_send_json_success(array(
                'url' => $file_url,
                'path' => $file_path,
                'message' => __('Background removed successfully!', CDBT_TEXT_DOMAIN)
            ));
        } else {
            wp_send_json_error(__('Failed to save processed image.', CDBT_TEXT_DOMAIN));
        }
    }
    
    /**
     * Save design as image
     */
    public function save_design() {
        check_ajax_referer('cdbt_nonce', 'nonce');

        $image_data = isset($_POST['image_data']) ? $_POST['image_data'] : '';

        if (!$image_data) {
            wp_send_json_error(__('No image data provided.', CDBT_TEXT_DOMAIN));
        }

        // Remove data URL prefix
        $image_data = str_replace('data:image/png;base64,', '', $image_data);
        $image_data = str_replace(' ', '+', $image_data);
        $decoded_image = base64_decode($image_data);

        // Generate unique filename
        $filename = 'custom-design-' . uniqid() . '.png';
        $upload_dir = wp_upload_dir();
        $file_path = $upload_dir['path'] . '/' . $filename;

        // Save the image
        if (!file_put_contents($file_path, $decoded_image)) {
            wp_send_json_error(__('Failed to save design image.', CDBT_TEXT_DOMAIN));
        }

        $file_url = $upload_dir['url'] . '/' . $filename;
        $attachment_url = '';

        // ✅ Handle attachment (if any)
        if (!empty($_FILES['attachment']['name'])) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
            require_once(ABSPATH . 'wp-admin/includes/media.php');
            require_once(ABSPATH . 'wp-admin/includes/image.php');

            $uploaded = wp_handle_upload($_FILES['attachment'], ['test_form' => false]);

            if (isset($uploaded['url']) && empty($uploaded['error'])) {
                $attachment_url = $uploaded['url'];
            } else {
                error_log('Attachment upload failed: ' . print_r($uploaded, true));
            }
        }

        // ✅ Build response
        $response = [
            'url' => $file_url,
            'path' => $file_path,
        ];

        if ($attachment_url) {
            $response['attachment_url'] = $attachment_url;
        }

        wp_send_json_success($response);
    }
}