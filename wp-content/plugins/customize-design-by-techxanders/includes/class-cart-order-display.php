<?php
/**
 * Cart and Order Display Handler - FIXED VERSION
 * IMPORTANT: This class DOES NOT modify prices - only displays information
 *
 * @package CustomizeDesignByTechxanders
 */

if (!defined('ABSPATH')) {
    exit;
}

class CDBT_Cart_Order_Display {
    
    public function __construct() {
        // Cart hooks - display only
        add_filter('woocommerce_cart_item_name', array($this, 'display_cart_item_customization'), 10, 3);
        add_action('woocommerce_cart_item_removed', array($this, 'cleanup_cart_item_images'), 10, 2);
        
        // Checkout hooks - save data only, NO PRICE MODIFICATION
        add_action('woocommerce_checkout_create_order_line_item', array($this, 'save_customization_to_order'), 10, 4);
        
        // Order display hooks
        add_action('woocommerce_order_item_meta_end', array($this, 'display_order_item_customization'), 10, 3);
        add_action('woocommerce_admin_order_item_headers', array($this, 'add_admin_order_item_header'));
        add_action('woocommerce_admin_order_item_values', array($this, 'display_admin_order_item_customization'), 10, 3);
        
        // Email hooks
        add_action('woocommerce_order_item_meta_end', array($this, 'display_email_order_item_customization'), 5, 3);
    }
    
    /**
     * Display customization in cart item name with design preview
     */
    public function display_cart_item_customization($item_name, $cart_item, $cart_item_key) {
        if (isset($cart_item['cdbt_customization'])) {
            $customization = $cart_item['cdbt_customization'];
            
            $item_name .= '<div class="cdbt-cart-customization" style="margin-top: 10px;">';
            
            // Display frame size
            if (isset($customization['frame_size'])) {
                $frame = $customization['frame_size'];
                $item_name .= '<p style="margin: 5px 0;"><strong>' . __('Frame Size:', CDBT_TEXT_DOMAIN) . '</strong> ' . 
                             esc_html($frame['size']) . ' <span style="color: #666;">(+' . wc_price($frame['price']) . ')</span></p>';
            }
            
            // Display design image BELOW the thumbnail
            if (isset($customization['design_image']) && !empty($customization['design_image'])) {
                $item_name .= '<div class="cdbt-cart-design-preview" style="margin: 10px 0;">';
                $item_name .= '<p style="margin: 5px 0;"><strong>' . __('Your Custom Design:', CDBT_TEXT_DOMAIN) . '</strong></p>';
                $item_name .= '<img src="' . esc_url($customization['design_image']) . '" alt="' . __('Custom Design Preview', CDBT_TEXT_DOMAIN) . '" style="max-width: 200px; height: auto; border: 2px solid #ddd; border-radius: 4px; padding: 5px; background: #f9f9f9;" />';
                $item_name .= '</div>';
            }
            
            // Display text elements count
            if (isset($customization['text_elements']) && is_array($customization['text_elements']) && count($customization['text_elements']) > 0) {
                $item_name .= '<p style="margin: 5px 0;"><strong>' . __('Text Elements:', CDBT_TEXT_DOMAIN) . '</strong> ' . count($customization['text_elements']) . '</p>';
            }
            
            // Display uploaded images count
            if (isset($customization['uploaded_images']) && is_array($customization['uploaded_images']) && count($customization['uploaded_images']) > 0) {
                $item_name .= '<p style="margin: 5px 0;"><strong>' . __('Custom Images:', CDBT_TEXT_DOMAIN) . '</strong> ' . count($customization['uploaded_images']) . '</p>';
            }
            
            $item_name .= '</div>';
        }
        
        return $item_name;
    }
    
    /**
     * Clean up design images when cart item is removed
     */
    public function cleanup_cart_item_images($cart_item_key, $cart) {
        $cart_item = $cart->removed_cart_contents[$cart_item_key];
        
        if (isset($cart_item['cdbt_customization']['design_image'])) {
            $image_url = $cart_item['cdbt_customization']['design_image'];
            $upload_dir = wp_upload_dir();
            $file_path = str_replace($upload_dir['url'], $upload_dir['path'], $image_url);
            
            if (file_exists($file_path)) {
                wp_delete_file($file_path);
            }
        }
    }
    
    /**
     * CRITICAL FIX: Save customization data to order line item
     * DOES NOT MODIFY PRICE - Price already correct from cart!
     */
    public function save_customization_to_order($item, $cart_item_key, $values, $order) {
        if (isset($values['cdbt_customization'])) {
            // Save customization data for reference
            $item->add_meta_data('_cdbt_customization', $values['cdbt_customization'], true);
            
            // CRITICAL: DO NOT MODIFY PRICE HERE!
            // The price is already correctly calculated in the cart
            // WooCommerce automatically uses the cart price for the order
            // Adding the frame price here would DOUBLE it!
            
            // This was the bug - removed these lines:
            // $item->set_total($item->get_total() + $frame_price);  // REMOVED
            // $item->set_subtotal($item->get_subtotal() + $frame_price);  // REMOVED
        }
    }
    
    /**
     * Display customization in order item meta (frontend/emails)
     */
    public function display_order_item_customization($item_id, $item, $order) {
        $customization = $item->get_meta('_cdbt_customization');
        
        if ($customization) {
            echo '<div class="cdbt-order-customization" style="margin-top: 10px;">';
            
            // Display frame size
            if (isset($customization['frame_size'])) {
                $frame = $customization['frame_size'];
                echo '<p style="margin: 5px 0;"><strong>' . __('Frame Size:', CDBT_TEXT_DOMAIN) . '</strong> ' . 
                     esc_html($frame['size']) . ' <span style="color: #666;">(+' . wc_price($frame['price']) . ')</span></p>';
            }
            
            // Display design image
            if (isset($customization['design_image']) && !empty($customization['design_image'])) {
                echo '<div class="cdbt-order-design-preview" style="margin: 10px 0;">';
                echo '<p style="margin: 5px 0;"><strong>' . __('Custom Design:', CDBT_TEXT_DOMAIN) . '</strong></p>';
                echo '<img src="' . esc_url($customization['design_image']) . '" alt="' . __('Custom Design', CDBT_TEXT_DOMAIN) . '" style="max-width: 200px; height: auto; border: 2px solid #ddd; border-radius: 4px; padding: 5px;" />';
                echo '</div>';
            }
            
            // Display text count
            if (isset($customization['text_elements']) && is_array($customization['text_elements']) && count($customization['text_elements']) > 0) {
                echo '<p style="margin: 5px 0; font-size: 0.9em; color: #666;"><em>' . 
                     count($customization['text_elements']) . ' ' . __('text elements', CDBT_TEXT_DOMAIN) . '</em></p>';
            }
            
            echo '</div>';
        }
    }
    
    /**
     * Add header for admin order items
     */
    public function add_admin_order_item_header() {
        echo '<th class="cdbt-customization-header">' . __('Customization', CDBT_TEXT_DOMAIN) . '</th>';
    }
    
    /**
     * Display customization in admin order item
     */
    public function display_admin_order_item_customization($product, $item, $item_id) {
        $customization = $item->get_meta('_cdbt_customization');
        
        echo '<td class="cdbt-customization-cell">';
        
        if ($customization) {
            // Display frame size
            if (isset($customization['frame_size'])) {
                $frame = $customization['frame_size'];
                echo '<div style="margin-bottom: 5px;"><strong>' . __('Frame:', CDBT_TEXT_DOMAIN) . '</strong> ' . 
                     esc_html($frame['size']) . ' (+' . wc_price($frame['price']) . ')</div>';
            }
            
            // Display design image
            if (isset($customization['design_image']) && !empty($customization['design_image'])) {
                echo '<div class="cdbt-admin-design-image" style="margin: 10px 0;">';
                echo '<strong>' . __('Custom Design:', CDBT_TEXT_DOMAIN) . '</strong><br>';
                echo '<a href="' . esc_url($customization['design_image']) . '" target="_blank">';
                echo '<img src="' . esc_url($customization['design_image']) . '" alt="' . __('Custom Design', CDBT_TEXT_DOMAIN) . '" style="max-width: 120px; height: auto; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; margin-top: 5px;" />';
                echo '</a>';
                echo '<br><small style="color: #666;">' . __('Click to view full size', CDBT_TEXT_DOMAIN) . '</small>';
                echo '</div>';
            }
            
            // Display customization details
            $details = array();
            if (isset($customization['text_elements']) && is_array($customization['text_elements'])) {
                $details[] = count($customization['text_elements']) . ' ' . __('text elements', CDBT_TEXT_DOMAIN);
            }
            if (isset($customization['uploaded_images']) && is_array($customization['uploaded_images'])) {
                $details[] = count($customization['uploaded_images']) . ' ' . __('custom images', CDBT_TEXT_DOMAIN);
            }
            
            if (!empty($details)) {
                echo '<div style="margin-top: 5px;"><small style="color: #666;">' . implode(', ', $details) . '</small></div>';
            }
        } else {
            echo '<em style="color: #999;">' . __('No customization', CDBT_TEXT_DOMAIN) . '</em>';
        }
        
        echo '</td>';
    }
    
    /**
     * Display customization in email order item
     */
    public function display_email_order_item_customization($item_id, $item, $order) {
        // Only show in emails (not on my-account page)
        if (!is_admin() && !is_wc_endpoint_url()) {
            $this->display_order_item_customization($item_id, $item, $order);
        }
    }
}

new CDBT_Cart_Order_Display();