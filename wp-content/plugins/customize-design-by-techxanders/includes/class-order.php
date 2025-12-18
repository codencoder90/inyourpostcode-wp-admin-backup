<?php
/**
 * Order functionality
 */

if (!defined('ABSPATH')) {
    exit;
}

class CDBT_Order {
    
    public function __construct() {
        add_action('woocommerce_admin_order_data_after_order_details', array($this, 'display_order_customizations'));
        add_action('woocommerce_order_item_meta_end', array($this, 'display_order_item_customization'), 10, 4);
        add_filter('woocommerce_hidden_order_itemmeta', array($this, 'hide_order_item_meta'));
    }
    
    /**
     * Display customizations in admin order details
     */
    public function display_order_customizations($order) {
        $has_customizations = false;
        
        foreach ($order->get_items() as $item_id => $item) {
            $customization_data = wc_get_order_item_meta($item_id, '_cdbt_customization_data', true);
            if ($customization_data) {
                $has_customizations = true;
                break;
            }
        }
        
        if (!$has_customizations) {
            return;
        }
        ?>
        <div class="cdbt-order-customizations">
            <h3><?php _e('Product Customizations', CDBT_TEXT_DOMAIN); ?></h3>
            <?php foreach ($order->get_items() as $item_id => $item): ?>
                <?php
                $customization_data = wc_get_order_item_meta($item_id, '_cdbt_customization_data', true);
                if (!$customization_data) {
                    continue;
                }
                
               
                ?>
                <div class="cdbt-order-item-customization">
                    <h4><?php echo $item->get_name(); ?></h4>
                    
                    <?php if (isset($customization_data['frame_size'])): ?>
                        <p><strong><?php _e('Frame Size:', CDBT_TEXT_DOMAIN); ?></strong> 
                           <?php echo esc_html($customization_data['frame_size']['size']); ?>
                           (+<?php echo wc_price($customization_data['frame_size']['price']); ?>)
                        </p>
                    <?php endif; ?>
                    
                    <?php if (isset($customization_data['design_image'])): ?>
                        <p><strong><?php _e('Custom Design:', CDBT_TEXT_DOMAIN); ?></strong></p>
                        <img src="<?php echo esc_url($customization_data['design_image']); ?>" 
                             style="max-width: 300px; height: auto; border: 1px solid #ddd; padding: 5px;" />
                    <?php endif; ?>
                    
                      
                    <?php if (isset($customization_data['attachment_url'])): ?>
                        <p><strong><?php _e('Attachement URL:', CDBT_TEXT_DOMAIN); ?></strong></p>
                        <a href="<?php echo esc_url($customization_data['attachment_url']); ?>" target="_blank" download>Download Attachment</a>
                    <?php endif; ?>
                    
                    
                    <?php if (isset($customization_data['text_elements']) && !empty($customization_data['text_elements'])): ?>
                        <p><strong><?php _e('Text Elements:', CDBT_TEXT_DOMAIN); ?></strong></p>
                        <ul>
                            <?php foreach ($customization_data['text_elements'] as $text): ?>
                                <li>
                                    "<?php echo esc_html($text['content']); ?>" 
                                    (<?php echo esc_html($text['font_family']); ?>, 
                                     <?php echo esc_html($text['font_size']); ?>px, 
                                     <?php echo esc_html($text['color']); ?>)
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    <?php endif; ?>
                    
                    <?php if (isset($customization_data['uploaded_images']) && !empty($customization_data['uploaded_images'])): ?>
                        <p><strong><?php _e('Uploaded Images:', CDBT_TEXT_DOMAIN); ?></strong></p>
                        <div class="cdbt-uploaded-images">
                            <?php foreach ($customization_data['uploaded_images'] as $image): ?>
                                <img src="<?php echo esc_url($image['url']); ?>" 
                                     style="max-width: 100px; height: auto; margin: 5px; border: 1px solid #ddd;" />
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
                <hr />
            <?php endforeach; ?>
        </div>
        <?php
    }
    
    /**
     * Display customization in order item meta
     */
    public function display_order_item_customization($item_id, $item, $order, $plain_text) {
        $customization_data = wc_get_order_item_meta($item_id, '_cdbt_customization_data', true);
        
        if (!$customization_data) {
            return;
        }
        
        if ($plain_text) {
            if (isset($customization_data['frame_size'])) {
                echo "\n" . __('Frame Size:', CDBT_TEXT_DOMAIN) . ' ' . $customization_data['frame_size']['size'];
            }
            
            if (isset($customization_data['text_elements']) && !empty($customization_data['text_elements'])) {
                $texts = array();
                foreach ($customization_data['text_elements'] as $text) {
                    $texts[] = '"' . $text['content'] . '"';
                }
                echo "\n" . __('Custom Text:', CDBT_TEXT_DOMAIN) . ' ' . implode(', ', $texts);
            }
        } else {
            ?>
            <div class="cdbt-order-item-meta">
                <?php if (isset($customization_data['frame_size'])): ?>
                    <p><strong><?php _e('Frame Size:', CDBT_TEXT_DOMAIN); ?></strong> 
                       <?php echo esc_html($customization_data['frame_size']['size']); ?>
                    </p>
                <?php endif; ?>
                
                <?php if (isset($customization_data['design_image'])): ?>
                    <p><strong><?php _e('Custom Design:', CDBT_TEXT_DOMAIN); ?></strong></p>
                    <img src="<?php echo esc_url($customization_data['design_image']); ?>" 
                         style="max-width: 150px; height: auto;" />
                <?php endif; ?>
            </div>
            <?php
        }
    }
    
    /**
     * Hide internal order item meta
     */
    public function hide_order_item_meta($hidden_meta) {
        $hidden_meta[] = '_cdbt_customization_data';
        return $hidden_meta;
    }
}