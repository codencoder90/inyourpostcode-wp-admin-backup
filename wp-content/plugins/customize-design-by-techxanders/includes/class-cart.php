<?php
/**
 * Cart - SUPER DEBUG VERSION
 * Shows EXACTLY what data is received from frontend
 */

if (!defined('ABSPATH')) {
    exit;
}

class CDBT_Cart {
    
    public function __construct() {
        add_filter('woocommerce_add_cart_item_data', array($this, 'add_cart_item_data'), 10, 3);
        add_filter('woocommerce_get_cart_item_from_session', array($this, 'get_cart_item_from_session'), 10, 3);
        add_filter('woocommerce_get_item_data', array($this, 'display_cart_item_data'), 10, 2);
        add_action('woocommerce_add_order_item_meta', array($this, 'add_order_item_meta'), 10, 3);
        add_filter('woocommerce_add_to_cart_validation', array($this, 'validate_add_to_cart'), 10, 6);
        add_action('woocommerce_before_calculate_totals', array($this, 'calculate_custom_price'), 10, 1);
        add_filter('woocommerce_cart_item_name', array($this, 'add_design_preview_to_name'), 10, 3);
        add_action('wp_footer', array($this, 'add_image_modal_and_script'));
        
        // V12.12: Add admin order display for uploaded images
        add_action('woocommerce_after_order_itemmeta', array($this, 'display_uploaded_images_in_admin'), 10, 3);
    }
    
    public function add_cart_item_data($cart_item_data, $product_id, $variation_id) {
        if (isset($cart_item_data['cdbt_customization'])) {
            return $cart_item_data;
        }
        
        if (isset($_POST['cdbt_customization_data'])) {
            $customization_data = json_decode(stripslashes($_POST['cdbt_customization_data']), true);
            
            if ($customization_data) {
                $cart_item_data['cdbt_customization'] = $customization_data;
                $cart_item_data['unique_key'] = md5(microtime() . rand());
                
                error_log('========== CDBT: DATA RECEIVED FROM FRONTEND ==========');
                error_log('FULL DATA: ' . print_r($customization_data, true));
                error_log('front_design: ' . (isset($customization_data['front_design']) ? $customization_data['front_design'] : 'NOT SET'));
                error_log('back_design: ' . (isset($customization_data['back_design']) ? $customization_data['back_design'] : 'NOT SET'));
                error_log('both_customized: ' . (isset($customization_data['both_customized']) ? ($customization_data['both_customized'] ? 'TRUE' : 'FALSE') : 'NOT SET'));
                error_log('=======================================================');
            }
        }
        
        return $cart_item_data;
    }
    
    public function get_cart_item_from_session($cart_item, $values, $key) {
        if (isset($values['cdbt_customization'])) {
            $cart_item['cdbt_customization'] = $values['cdbt_customization'];
        }
        return $cart_item;
    }
    
    public function display_cart_item_data($item_data, $cart_item) {
        if (isset($cart_item['cdbt_customization'])) {
            $customization = $cart_item['cdbt_customization'];
            
            // Frame sizes: show per-side sizes with prices if available AND side has content
            $currency_symbol = function_exists('get_woocommerce_currency_symbol') ? get_woocommerce_currency_symbol() : '';
            // Front: content ONLY if uploaded images exist (ignore base product URL)
            $has_front_uploads = !empty($customization['front_uploaded_images']) && is_array($customization['front_uploaded_images']) && count($customization['front_uploaded_images']) > 0;
            $has_front_content = $has_front_uploads;

            if (!empty($customization['frame_size_front']) && $has_front_content) {
                $fs = $customization['frame_size_front'];
                $size = is_array($fs) && isset($fs['size']) ? $fs['size'] : '';
                $price = is_array($fs) && isset($fs['price']) ? floatval($fs['price']) : 0;
                $text = $size;
                if ($price > 0) {
                    $text .= ' (+' . $currency_symbol . number_format($price, 2) . ')';
                }
                $item_data[] = array(
                    'key'   => __('Frame Size (Front)', CDBT_TEXT_DOMAIN),
                    'value' => $text
                );
            }
            // Back: content ONLY if uploaded images exist (ignore base product URL)
            $has_back_uploads = !empty($customization['back_uploaded_images']) && is_array($customization['back_uploaded_images']) && count($customization['back_uploaded_images']) > 0;
            $has_back_content = $has_back_uploads;

            if (!empty($customization['frame_size_back']) && $has_back_content) {
                $fs = $customization['frame_size_back'];
                $size = is_array($fs) && isset($fs['size']) ? $fs['size'] : '';
                $price = is_array($fs) && isset($fs['price']) ? floatval($fs['price']) : 0;
                $text = $size;
                if ($price > 0) {
                    $text .= ' (+' . $currency_symbol . number_format($price, 2) . ')';
                }
                $item_data[] = array(
                    'key'   => __('Frame Size (Back)', CDBT_TEXT_DOMAIN),
                    'value' => $text
                );
            }
            
            // DEBUG: Show RAW data in cart
            $debug_info = '';
            //$debug_info = '<div style="background: #fff3cd; border: 2px solid #ffc107; padding: 10px; margin: 10px 0; border-radius: 5px;">';
          //  $debug_info .= '<strong style="color: #856404;">🔍 DEBUG - Data from Frontend:</strong><br>';
          //  $debug_info .= '<strong>front_design:</strong> ' . (isset($customization['front_design']) && !empty($customization['front_design']) ? '✅ EXISTS' : '❌ MISSING') . '<br>'//;
          //  $debug_info .= '<strong>back_design:</strong> ' . (isset($customization['back_design']) && !empty($customization['back_design']) ? '✅ EXISTS' : '❌ MISSING') . '<br>';
         //   $debug_info .= '<strong>both_customized:</strong> ' . (isset($customization['both_customized']) && $customization['both_customized'] === true ? '✅ TRUE' : '❌ FALSE/MISSING') . '<br>';
          //  $debug_info .= '</div>';
            
            $item_data[] = array(
                'key'   => '',
                'value' => $debug_info
            );
            
            // Image button marker
            $front_design = isset($customization['front_design']) && !empty($customization['front_design']) 
                          ? $customization['front_design'] : null;
            $back_design = isset($customization['back_design']) && !empty($customization['back_design']) 
                         ? $customization['back_design'] : null;
            $design_image = isset($customization['design_image']) && !empty($customization['design_image']) 
                          ? $customization['design_image'] : null;
            
            if ($front_design || $back_design || $design_image) {
                $sides_text = '';
                if ($front_design && $back_design) {
                    $sides_text = '(Front + Back)';
                } elseif ($front_design) {
                    $sides_text = '(Front Only)';
                } elseif ($back_design) {
                    $sides_text = '(Back Only)';
                }
                
                // Include per-side frame sizes and prices for modal display
                $front_size = '';
                $front_price = 0;
                if (!empty($has_front_content) && !empty($customization['frame_size_front']['size'])) {
                    $front_size = $customization['frame_size_front']['size'];
                    if (!empty($customization['frame_size_front']['price'])) {
                        $front_price = floatval($customization['frame_size_front']['price']);
                    }
                }

                $back_size = '';
                $back_price = 0;
                if (!empty($has_back_content) && !empty($customization['frame_size_back']['size'])) {
                    $back_size = $customization['frame_size_back']['size'];
                    if (!empty($customization['frame_size_back']['price'])) {
                        $back_price = floatval($customization['frame_size_back']['price']);
                    }
                }
                
                $currency = function_exists('get_woocommerce_currency_symbol') ? get_woocommerce_currency_symbol() : '';

                $data_json = json_encode(array(
                    'front' => $front_design ? esc_url($front_design) : '',
                    'back' => $back_design ? esc_url($back_design) : '',
                    'fallback' => $design_image ? esc_url($design_image) : '',
                    'front_size' => $front_size,
                    'front_price' => $front_price,
                    'back_size' => $back_size,
                    'back_price' => $back_price,
                    'currency' => $currency
                ));
                
                $marker_text = '🖼️ CDBT_IMAGE_MARKER ' . base64_encode($data_json);
                
                $item_data[] = array(
                    'key'     => '',
                    'value'   => $marker_text
                );
            }
        }
        
        return $item_data;
    }
    
    public function add_design_preview_to_name($product_name, $cart_item, $cart_item_key) {
        if (isset($cart_item['cdbt_customization'])) {
            $product_name .= '<div style="margin-top: 5px;">';
            $product_name .= '<span style="display: inline-block; background: #4CAF50; color: white; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">✓ CUSTOM DESIGN</span>';
            $product_name .= '</div>';
        }
        return $product_name;
    }
    
    public function add_order_item_meta($item_id, $values, $cart_item_key) {
        if (isset($values['cdbt_customization'])) {
            wc_add_order_item_meta($item_id, '_cdbt_customization_data', $values['cdbt_customization']);
        }
    }
    
    public function validate_add_to_cart($passed, $product_id, $quantity, $variation_id = '', $variations = array(), $cart_item_data = array()) {
        return $passed;
    }
    
    public function calculate_custom_price($cart) {
        if (is_admin() && !defined('DOING_AJAX')) {
            return;
        }
        
        if (did_action('woocommerce_before_calculate_totals') >= 2) {
            return;
        }
        
        error_log('====== CDBT PRICE CALCULATION ======');
        
        foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
            if (isset($cart_item['cdbt_customization'])) {
                $custom = $cart_item['cdbt_customization'];
                
                // Determine which sides actually have user content: ONLY uploaded images
                $frontDesign = (!empty($custom['front_uploaded_images']) && is_array($custom['front_uploaded_images']) && count($custom['front_uploaded_images']) > 0);
                $backDesign  = (!empty($custom['back_uploaded_images']) && is_array($custom['back_uploaded_images']) && count($custom['back_uploaded_images']) > 0);
                
                $both_customized = !empty($custom['both_customized']);
                
                // Per-side pricing ONLY: sum per-side prices (no legacy fallback)
                $frontPrice = ($frontDesign && !empty($custom['frame_size_front']['price'])) ? floatval($custom['frame_size_front']['price']) : 0.0;
                $backPrice  = ($backDesign  && !empty($custom['frame_size_back']['price']))  ? floatval($custom['frame_size_back']['price'])  : 0.0;
                $frame_price = $frontPrice + $backPrice;
                error_log('Per-side pricing only: front £' . $frontPrice . ' + back £' . $backPrice . ' = £' . $frame_price);
                
                // Base product price
                $product = $cart_item['data'];
                $sale_price = $product->get_sale_price();
                $regular_price = $product->get_regular_price();
                
                if (!empty($sale_price) && $sale_price > 0) {
                    $base_price = floatval($sale_price);
                    error_log('Using SALE price: £' . $base_price);
                } else {
                    $base_price = floatval($regular_price);
                    error_log('Using REGULAR price: £' . $base_price);
                }
                
                $new_price = $base_price + $frame_price;
                error_log('CALCULATION: £' . $base_price . ' + £' . $frame_price . ' = £' . $new_price);
                
                $cart_item['data']->set_price($new_price);
            }
        }
        
        error_log('====== END CALCULATION ======');
    }
    
    public function add_image_modal_and_script() {
        ?>
        <style>
        #cdbt-image-modal {
            display: none;
            position: fixed;
            z-index: 999999;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.95);
        }
        
        #cdbt-image-modal.active {
            display: flex !important;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        #cdbt-modal-content {
            position: relative;
            background: #fff;
            border-radius: 12px;
            padding: 30px;
            max-width: 900px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 50px rgba(0,0,0,0.5);
        }
        
        #cdbt-modal-close {
            position: absolute;
            top: 15px;
            right: 15px;
            background: #f44336;
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 24px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
        }
        
        #cdbt-modal-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #333;
        }
        
        #cdbt-modal-images {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .cdbt-modal-image-box {
            flex: 1;
            min-width: 250px;
            max-width: 400px;
            text-align: center;
        }
        
        .cdbt-modal-image-box h3 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .cdbt-modal-image-box.front h3 {
            color: #4CAF50;
        }
        
        .cdbt-modal-image-box.back h3 {
            color: #2196F3;
        }
        
        .cdbt-modal-image-box img {
            width: 100%;
            max-height: 400px;
            object-fit: contain;
            border: 3px solid;
            border-radius: 8px;
            padding: 10px;
            cursor: pointer;
            background: #f9f9f9;
        }
        
        .cdbt-modal-image-box.front img {
            border-color: #4CAF50;
        }
        
        .cdbt-modal-image-box.back img {
            border-color: #2196F3;
        }
        
        .cdbt-download-btn {
            display: inline-block;
            margin-top: 10px;
            padding: 8px 16px;
            background: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
        }
        
        .cdbt-show-images-btn {
            background: #4CAF50 !important;
            color: white !important;
            border: none !important;
            padding: 10px 20px !important;
            border-radius: 4px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            font-size: 14px !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 8px !important;
            margin: 5px 0 !important;
        }
        </style>
        
        <div id="cdbt-image-modal" onclick="cdbtCloseImageModal()">
            <div id="cdbt-modal-content" onclick="event.stopPropagation()">
                <button id="cdbt-modal-close" onclick="cdbtCloseImageModal()">&times;</button>
                <div id="cdbt-modal-title">Your Customized Design</div>
                <div id="cdbt-modal-images"></div>
            </div>
        </div>
        
        <script>
        function cdbtOpenImageModal(frontUrl, backUrl, fallbackUrl, meta) {
            console.log('=== MODAL DATA ===');
            console.log('Front:', frontUrl);
            console.log('Back:', backUrl);
            console.log('Fallback:', fallbackUrl);
            console.log('Meta:', meta);
            
            const imagesContainer = document.getElementById('cdbt-modal-images');
            if (!imagesContainer) return;
            
            imagesContainer.innerHTML = '';
            
            if (frontUrl && frontUrl.trim() !== '' && frontUrl !== 'null') {
                var frontInfo = '';
                try {
                    if (meta && (meta.front_size || meta.front_price)) {
                        var fprice = meta.front_price ? Number(meta.front_price).toFixed(2) : null;
                        var cs = meta.currency || '';
                        frontInfo = `<div style="margin-top:8px;font-size:12px;color:#333;">Frame: ${meta.front_size || ''}${fprice && fprice>0 ? ' (+'+cs+fprice+')' : ''}</div>`;
                    }
                } catch (e) {}
                imagesContainer.innerHTML += `
                    <div class="cdbt-modal-image-box front">
                        <h3>FRONT DESIGN</h3>
                        <img src="${frontUrl}" onclick="window.open('${frontUrl}', '_blank')">
                        <a href="${frontUrl}" download class="cdbt-download-btn">📥 Download Front</a>
                        ${frontInfo}
                    </div>
                `;
            }
            
            if (backUrl && backUrl.trim() !== '' && backUrl !== 'null') {
                var backInfo = '';
                try {
                    if (meta && (meta.back_size || meta.back_price)) {
                        var bprice = meta.back_price ? Number(meta.back_price).toFixed(2) : null;
                        var cs2 = meta.currency || '';
                        backInfo = `<div style="margin-top:8px;font-size:12px;color:#333;">Frame: ${meta.back_size || ''}${bprice && bprice>0 ? ' (+'+cs2+bprice+')' : ''}</div>`;
                    }
                } catch (e) {}
                imagesContainer.innerHTML += `
                    <div class="cdbt-modal-image-box back">
                        <h3>BACK DESIGN</h3>
                        <img src="${backUrl}" onclick="window.open('${backUrl}', '_blank')">
                        <a href="${backUrl}" download class="cdbt-download-btn">📥 Download Back</a>
                        ${backInfo}
                    </div>
                `;
            }
            
            if (imagesContainer.innerHTML === '' && fallbackUrl && fallbackUrl.trim() !== '') {
                imagesContainer.innerHTML += `
                    <div class="cdbt-modal-image-box">
                        <h3>YOUR DESIGN</h3>
                        <img src="${fallbackUrl}" onclick="window.open('${fallbackUrl}', '_blank')">
                        <a href="${fallbackUrl}" download class="cdbt-download-btn">📥 Download</a>
                    </div>
                `;
            }
            
            document.getElementById('cdbt-image-modal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        function cdbtCloseImageModal() {
            document.getElementById('cdbt-image-modal').classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') cdbtCloseImageModal();
        });
        
        function cdbtInjectImageButtons() {
            const allElements = document.querySelectorAll('span, dt, dd, p, div');
            
            allElements.forEach(function(element) {
                const text = element.textContent || element.innerText;
                
                if (text && text.includes('🖼️ CDBT_IMAGE_MARKER')) {
                    try {
                        const parts = text.split('CDBT_IMAGE_MARKER ');
                        if (parts.length < 2) return;
                        
                        const base64Data = parts[1].trim();
                        const jsonData = JSON.parse(atob(base64Data));
                        
                        console.log('Button data:', jsonData);
                        
                        // Check if designs actually have content (not just empty strings)
                        const hasFront = jsonData.front && jsonData.front.trim() !== '' && jsonData.front !== 'null';
                        const hasBack = jsonData.back && jsonData.back.trim() !== '' && jsonData.back !== 'null';
                        
                        console.log('Has front design:', hasFront);
                        console.log('Has back design:', hasBack);
                        
                        let sidesText = '';
                        if (hasFront && hasBack) {
                            sidesText = '(Front + Back)';
                        } else if (hasFront) {
                            sidesText = '(Front Only)';
                        } else if (hasBack) {
                            sidesText = '(Back Only)';
                        }
                        
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = 'cdbt-show-images-btn';
                        button.onclick = function() {
                            cdbtOpenImageModal(jsonData.front || '', jsonData.back || '', jsonData.fallback || '', jsonData);
                        };
                        button.innerHTML = `
                            <span style="font-size: 18px;">🖼️</span>
                            <span>Show Customized Images ${sidesText}</span>
                        `;
                        
                        element.innerHTML = '';
                        element.appendChild(button);
                    } catch(e) {
                        console.error('Error:', e);
                    }
                }
            });
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', cdbtInjectImageButtons);
        } else {
            cdbtInjectImageButtons();
        }
        
        setTimeout(cdbtInjectImageButtons, 1000);
        setTimeout(cdbtInjectImageButtons, 2000);
        
        const observer = new MutationObserver(cdbtInjectImageButtons);
        observer.observe(document.body, { childList: true, subtree: true });
        </script>
        <?php
    }
    
    /**
     * V12.12: Display uploaded images in admin order view
     */
    public function display_uploaded_images_in_admin($item_id, $item, $product) {
        // Only run in admin
        if (!is_admin()) {
            return;
        }
        
        // Get customization data
        $customization_data = wc_get_order_item_meta($item_id, '_cdbt_customization_data', true);
        
        if (empty($customization_data)) {
            return;
        }
        
        // Check for uploaded images
        $front_uploads = isset($customization_data['front_uploaded_images']) ? $customization_data['front_uploaded_images'] : array();
        $back_uploads = isset($customization_data['back_uploaded_images']) ? $customization_data['back_uploaded_images'] : array();
        
        // Debug log
        error_log('V12.12 Admin Display - Front uploads: ' . print_r($front_uploads, true));
        error_log('V12.12 Admin Display - Back uploads: ' . print_r($back_uploads, true));
        
        // If no uploads, return
        if (empty($front_uploads) && empty($back_uploads)) {
            return;
        }
        
        echo '<div class="cdbt-admin-uploaded-images" style="margin-top: 20px; padding: 20px; background: #f0f7ff; border: 2px solid #0073aa; border-radius: 8px;">';
        echo '<h4 style="margin: 0 0 15px 0; color: #0073aa; font-size: 16px; font-weight: bold;">📎 Customer Uploaded Images (Original Files)</h4>';
        echo '<p style="margin: 0 0 15px 0; color: #666; font-size: 12px;">These are the original images uploaded by the customer. Click to download or view full size.</p>';
        
        // Front uploads
        if (!empty($front_uploads) && is_array($front_uploads)) {
            echo '<div class="cdbt-front-uploads" style="margin-bottom: 20px; padding: 15px; background: #e8f5e9; border: 1px solid #4caf50; border-radius: 5px;">';
            echo '<h5 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 14px;">🎨 FRONT Side Uploads (' . count($front_uploads) . ')</h5>';
            echo '<div style="display: flex; flex-wrap: wrap; gap: 15px;">';
            foreach ($front_uploads as $index => $url) {
                if (empty($url)) continue;
                $filename = basename(parse_url($url, PHP_URL_PATH));
                echo '<div style="background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px; text-align: center;">';
                echo '<a href="' . esc_url($url) . '" target="_blank">';
                echo '<img src="' . esc_url($url) . '" style="max-width: 120px; max-height: 120px; display: block; margin: 0 auto 10px; border: 1px solid #eee;">';
                echo '</a>';
                echo '<div style="margin-top: 8px;">';
                echo '<a href="' . esc_url($url) . '" target="_blank" style="display: inline-block; background: #4caf50; color: #fff; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 11px; margin: 2px;">👁 View</a>';
                echo '<a href="' . esc_url($url) . '" download style="display: inline-block; background: #2196f3; color: #fff; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 11px; margin: 2px;">⬇ Download</a>';
                echo '</div>';
                echo '<div style="margin-top: 5px; font-size: 10px; color: #999; word-break: break-all;">' . esc_html($filename) . '</div>';
                echo '</div>';
            }
            echo '</div>';
            echo '</div>';
        }
        
        // Back uploads
        if (!empty($back_uploads) && is_array($back_uploads)) {
            echo '<div class="cdbt-back-uploads" style="padding: 15px; background: #e3f2fd; border: 1px solid #2196f3; border-radius: 5px;">';
            echo '<h5 style="margin: 0 0 10px 0; color: #1565c0; font-size: 14px;">🎨 BACK Side Uploads (' . count($back_uploads) . ')</h5>';
            echo '<div style="display: flex; flex-wrap: wrap; gap: 15px;">';
            foreach ($back_uploads as $index => $url) {
                if (empty($url)) continue;
                $filename = basename(parse_url($url, PHP_URL_PATH));
                echo '<div style="background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px; text-align: center;">';
                echo '<a href="' . esc_url($url) . '" target="_blank">';
                echo '<img src="' . esc_url($url) . '" style="max-width: 120px; max-height: 120px; display: block; margin: 0 auto 10px; border: 1px solid #eee;">';
                echo '</a>';
                echo '<div style="margin-top: 8px;">';
                echo '<a href="' . esc_url($url) . '" target="_blank" style="display: inline-block; background: #4caf50; color: #fff; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 11px; margin: 2px;">👁 View</a>';
                echo '<a href="' . esc_url($url) . '" download style="display: inline-block; background: #2196f3; color: #fff; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 11px; margin: 2px;">⬇ Download</a>';
                echo '</div>';
                echo '<div style="margin-top: 5px; font-size: 10px; color: #999; word-break: break-all;">' . esc_html($filename) . '</div>';
                echo '</div>';
            }
            echo '</div>';
            echo '</div>';
        }
        
        // Add JavaScript for force download (handles cross-origin issues)
        echo '<script>
        document.querySelectorAll(".cdbt-admin-uploaded-images a[download]").forEach(function(link) {
            link.addEventListener("click", function(e) {
                e.preventDefault();
                var url = this.href;
                var filename = url.split("/").pop();
                
                // Try fetch + blob for same-origin, fallback to window.open
                fetch(url)
                    .then(function(response) { return response.blob(); })
                    .then(function(blob) {
                        var a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(a.href);
                    })
                    .catch(function() {
                        // Fallback: open in new tab
                        window.open(url, "_blank");
                    });
            });
        });
        </script>';
        
        echo '</div>';
    }
}