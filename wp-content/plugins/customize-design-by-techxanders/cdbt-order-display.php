<?php
/**
 * CDBT Order Display Enhancement
 * Shows both Front and Back designs on Order Received and Admin Order pages
 * 
 * Add this code to your theme's functions.php OR create a new file in your plugin
 * 
 * Version: 1.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add Front/Back design modal to Order Received (Thank You) page
 */
add_action('woocommerce_order_item_meta_end', 'cdbt_display_order_designs_modal', 10, 4);

function cdbt_display_order_designs_modal($item_id, $item, $order, $plain_text) {
    if ($plain_text) return;
    
    // Get customization data from order item meta
    $customization_data = $item->get_meta('_cdbt_customization_data');
    
    if (empty($customization_data)) return;
    
    // Parse JSON if needed
    if (is_string($customization_data)) {
        $customization_data = json_decode($customization_data, true);
    }
    
    if (!is_array($customization_data)) return;
    
    // Get front and back designs
    $front_design = isset($customization_data['front_design']) ? $customization_data['front_design'] : '';
    $back_design = isset($customization_data['back_design']) ? $customization_data['back_design'] : '';
    $design_image = isset($customization_data['design_image']) ? $customization_data['design_image'] : '';
    
    // Check if designs exist and have content
    $has_front = !empty($front_design) && $front_design !== 'null';
    $has_back = !empty($back_design) && $back_design !== 'null';
    
    // Fallback to design_image if no front/back
    if (!$has_front && !$has_back && !empty($design_image)) {
        $front_design = $design_image;
        $has_front = true;
    }
    
    if (!$has_front && !$has_back) return;
    
    // Determine button text
    if ($has_front && $has_back) {
        $button_text = '🖼️ View Customized Designs (Front + Back)';
    } elseif ($has_front) {
        $button_text = '🖼️ View Customized Design (Front)';
    } else {
        $button_text = '🖼️ View Customized Design (Back)';
    }
    
    // Generate unique modal ID
    $modal_id = 'cdbt-order-modal-' . $item_id;
    
    ?>
    <div class="cdbt-order-designs" style="margin-top: 15px;">
        <button type="button" 
                class="cdbt-view-designs-btn" 
                onclick="document.getElementById('<?php echo esc_attr($modal_id); ?>').style.display='flex';"
                style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                       color: white; 
                       border: none; 
                       padding: 12px 20px; 
                       border-radius: 8px; 
                       cursor: pointer; 
                       font-size: 14px; 
                       font-weight: 600;
                       box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                       transition: all 0.3s ease;">
            <?php echo $button_text; ?>
        </button>
    </div>
    
    <!-- Modal -->
    <div id="<?php echo esc_attr($modal_id); ?>" 
         class="cdbt-designs-modal" 
         style="display: none; 
                position: fixed; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                background: rgba(0,0,0,0.8); 
                z-index: 999999; 
                justify-content: center; 
                align-items: center;
                padding: 20px;
                box-sizing: border-box;">
        <div class="cdbt-modal-content" 
             style="background: white; 
                    border-radius: 16px; 
                    max-width: 900px; 
                    width: 100%; 
                    max-height: 90vh; 
                    overflow-y: auto; 
                    position: relative;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.3);">
            
            <!-- Close Button -->
            <button type="button" 
                    onclick="document.getElementById('<?php echo esc_attr($modal_id); ?>').style.display='none';"
                    style="position: absolute; 
                           top: 15px; 
                           right: 15px; 
                           background: #ff4757; 
                           color: white; 
                           border: none; 
                           width: 40px; 
                           height: 40px; 
                           border-radius: 50%; 
                           cursor: pointer; 
                           font-size: 24px; 
                           line-height: 1;
                           z-index: 10;
                           box-shadow: 0 4px 15px rgba(255,71,87,0.3);">
                ×
            </button>
            
            <!-- Modal Header -->
            <div style="padding: 25px 30px; border-bottom: 1px solid #eee;">
                <h2 style="margin: 0; color: #333; font-size: 24px;">Your Customized Design</h2>
            </div>
            
            <!-- Modal Body -->
            <div style="padding: 30px; display: flex; flex-wrap: wrap; gap: 30px; justify-content: center;">
                
                <?php if ($has_front): ?>
                <!-- Front Design -->
                <div style="flex: 1; min-width: 280px; max-width: 400px; text-align: center;">
                    <h3 style="color: #28a745; margin-bottom: 15px; font-size: 18px; font-weight: 600;">
                        FRONT DESIGN
                    </h3>
                    <div style="border: 3px solid #28a745; 
                                border-radius: 12px; 
                                padding: 15px; 
                                background: #f8f9fa;">
                        <img src="<?php echo esc_url($front_design); ?>" 
                             alt="Front Design" 
                             style="max-width: 100%; 
                                    height: auto; 
                                    border-radius: 8px;
                                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    </div>
                    <a href="<?php echo esc_url($front_design); ?>" 
                       download="front-design.png"
                       style="display: inline-block; 
                              margin-top: 15px; 
                              background: #28a745; 
                              color: white; 
                              padding: 10px 25px; 
                              border-radius: 25px; 
                              text-decoration: none;
                              font-weight: 600;
                              box-shadow: 0 4px 15px rgba(40,167,69,0.3);">
                        📥 Download Front
                    </a>
                </div>
                <?php endif; ?>
                
                <?php if ($has_back): ?>
                <!-- Back Design -->
                <div style="flex: 1; min-width: 280px; max-width: 400px; text-align: center;">
                    <h3 style="color: #007bff; margin-bottom: 15px; font-size: 18px; font-weight: 600;">
                        BACK DESIGN
                    </h3>
                    <div style="border: 3px solid #007bff; 
                                border-radius: 12px; 
                                padding: 15px; 
                                background: #f8f9fa;">
                        <img src="<?php echo esc_url($back_design); ?>" 
                             alt="Back Design" 
                             style="max-width: 100%; 
                                    height: auto; 
                                    border-radius: 8px;
                                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    </div>
                    <a href="<?php echo esc_url($back_design); ?>" 
                       download="back-design.png"
                       style="display: inline-block; 
                              margin-top: 15px; 
                              background: #007bff; 
                              color: white; 
                              padding: 10px 25px; 
                              border-radius: 25px; 
                              text-decoration: none;
                              font-weight: 600;
                              box-shadow: 0 4px 15px rgba(0,123,255,0.3);">
                        📥 Download Back
                    </a>
                </div>
                <?php endif; ?>
                
            </div>
        </div>
    </div>
    
    <!-- Close modal when clicking outside -->
    <script>
    (function() {
        var modal = document.getElementById('<?php echo esc_js($modal_id); ?>');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    })();
    </script>
    <?php
}


/**
 * Add Front/Back design modal to Admin Order page
 */
add_action('woocommerce_admin_order_item_values', 'cdbt_admin_order_designs_modal', 10, 3);

function cdbt_admin_order_designs_modal($product, $item, $item_id) {
    // Get customization data
    $customization_data = $item->get_meta('_cdbt_customization_data');
    
    if (empty($customization_data)) return;
    
    // Parse JSON if needed
    if (is_string($customization_data)) {
        $customization_data = json_decode($customization_data, true);
    }
    
    if (!is_array($customization_data)) return;
    
    // Get front and back designs
    $front_design = isset($customization_data['front_design']) ? $customization_data['front_design'] : '';
    $back_design = isset($customization_data['back_design']) ? $customization_data['back_design'] : '';
    $design_image = isset($customization_data['design_image']) ? $customization_data['design_image'] : '';
    
    // Check if designs exist
    $has_front = !empty($front_design) && $front_design !== 'null';
    $has_back = !empty($back_design) && $back_design !== 'null';
    
    // Fallback
    if (!$has_front && !$has_back && !empty($design_image)) {
        $front_design = $design_image;
        $has_front = true;
    }
    
    if (!$has_front && !$has_back) return;
    
    // Button text
    if ($has_front && $has_back) {
        $button_text = '🖼️ View Both Designs';
    } elseif ($has_front) {
        $button_text = '🖼️ View Front Design';
    } else {
        $button_text = '🖼️ View Back Design';
    }
    
    $modal_id = 'cdbt-admin-modal-' . $item_id;
    
    ?>
    <td class="cdbt-admin-designs" colspan="1">
        <button type="button" 
                class="button button-primary cdbt-admin-view-btn"
                onclick="document.getElementById('<?php echo esc_attr($modal_id); ?>').style.display='flex';"
                style="margin-top: 10px;">
            <?php echo $button_text; ?>
        </button>
        
        <!-- Admin Modal -->
        <div id="<?php echo esc_attr($modal_id); ?>" 
             style="display: none; 
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    width: 100%; 
                    height: 100%; 
                    background: rgba(0,0,0,0.8); 
                    z-index: 999999; 
                    justify-content: center; 
                    align-items: center;">
            <div style="background: white; 
                        border-radius: 12px; 
                        max-width: 900px; 
                        width: 90%; 
                        max-height: 90vh; 
                        overflow-y: auto; 
                        position: relative;
                        padding: 30px;">
                
                <button type="button" 
                        onclick="document.getElementById('<?php echo esc_attr($modal_id); ?>').style.display='none';"
                        style="position: absolute; 
                               top: 10px; 
                               right: 10px; 
                               background: #dc3545; 
                               color: white; 
                               border: none; 
                               width: 35px; 
                               height: 35px; 
                               border-radius: 50%; 
                               cursor: pointer; 
                               font-size: 20px;">
                    ×
                </button>
                
                <h2 style="margin-top: 0; margin-bottom: 25px; color: #23282d;">Customer's Customized Design</h2>
                
                <div style="display: flex; flex-wrap: wrap; gap: 25px; justify-content: center;">
                    
                    <?php if ($has_front): ?>
                    <div style="flex: 1; min-width: 250px; max-width: 380px; text-align: center;">
                        <h4 style="color: #28a745; margin-bottom: 10px;">FRONT DESIGN</h4>
                        <div style="border: 2px solid #28a745; border-radius: 8px; padding: 10px; background: #f1f1f1;">
                            <img src="<?php echo esc_url($front_design); ?>" 
                                 alt="Front" 
                                 style="max-width: 100%; height: auto; border-radius: 4px;">
                        </div>
                        <a href="<?php echo esc_url($front_design); ?>" 
                           target="_blank"
                           class="button"
                           style="margin-top: 10px;">
                            Open Front Image
                        </a>
                    </div>
                    <?php endif; ?>
                    
                    <?php if ($has_back): ?>
                    <div style="flex: 1; min-width: 250px; max-width: 380px; text-align: center;">
                        <h4 style="color: #007bff; margin-bottom: 10px;">BACK DESIGN</h4>
                        <div style="border: 2px solid #007bff; border-radius: 8px; padding: 10px; background: #f1f1f1;">
                            <img src="<?php echo esc_url($back_design); ?>" 
                                 alt="Back" 
                                 style="max-width: 100%; height: auto; border-radius: 4px;">
                        </div>
                        <a href="<?php echo esc_url($back_design); ?>" 
                           target="_blank"
                           class="button"
                           style="margin-top: 10px;">
                            Open Back Image
                        </a>
                    </div>
                    <?php endif; ?>
                    
                </div>
            </div>
        </div>
        
        <script>
        (function() {
            var modal = document.getElementById('<?php echo esc_js($modal_id); ?>');
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            }
        })();
        </script>
    </td>
    <?php
}


/**
 * Also add to order emails (optional - shows images directly, no modal)
 */
add_action('woocommerce_order_item_meta_end', 'cdbt_email_order_designs', 20, 4);

function cdbt_email_order_designs($item_id, $item, $order, $plain_text) {
    // Only for emails
    if (!doing_action('woocommerce_email_order_items_args') && !wp_doing_ajax()) {
        // Check if this is being rendered in email context
        if (!did_action('woocommerce_email_header')) return;
    }
    
    $customization_data = $item->get_meta('_cdbt_customization_data');
    
    if (empty($customization_data)) return;
    
    if (is_string($customization_data)) {
        $customization_data = json_decode($customization_data, true);
    }
    
    if (!is_array($customization_data)) return;
    
    $front_design = isset($customization_data['front_design']) ? $customization_data['front_design'] : '';
    $back_design = isset($customization_data['back_design']) ? $customization_data['back_design'] : '';
    
    $has_front = !empty($front_design) && $front_design !== 'null';
    $has_back = !empty($back_design) && $back_design !== 'null';
    
    if (!$has_front && !$has_back) return;
    
    if ($plain_text) {
        // Plain text email
        echo "\n\n--- Custom Designs ---\n";
        if ($has_front) {
            echo "Front Design: " . $front_design . "\n";
        }
        if ($has_back) {
            echo "Back Design: " . $back_design . "\n";
        }
    }
}


/**
 * CSS for hover effects (added to footer)
 */
add_action('wp_footer', 'cdbt_order_modal_styles');
add_action('admin_footer', 'cdbt_order_modal_styles');

function cdbt_order_modal_styles() {
    ?>
    <style>
    .cdbt-view-designs-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4) !important;
    }
    .cdbt-designs-modal img {
        transition: transform 0.3s ease;
    }
    .cdbt-designs-modal img:hover {
        transform: scale(1.02);
    }
    @media (max-width: 768px) {
        .cdbt-modal-content {
            margin: 10px;
            max-height: 95vh !important;
        }
    }
    </style>
    <?php
}