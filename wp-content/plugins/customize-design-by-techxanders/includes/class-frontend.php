<?php
/**
 * Frontend functionality
 */

if (!defined('ABSPATH')) {
    exit;
}

class CDBT_Frontend {
    
    public function __construct() {
        add_action('woocommerce_single_product_summary', array($this, 'add_design_button'), 25);
        add_action('init', array($this, 'add_rewrite_rules'));
        add_action('template_redirect', array($this, 'handle_design_page'));
        add_filter('query_vars', array($this, 'add_query_vars'));
    }
    
    /**
     * Add design button to product page
     */
    public function add_design_button() {
        global $product;
        
        if (!$product) {
            return;
        }
        
        $enable_customize = get_post_meta($product->get_id(), '_cdbt_enable_customize', true);
        
        if ($enable_customize === 'yes') {
            ?>
            <div class="cdbt-design-button-wrapper">
                <a href="<?php echo esc_url($this->get_design_url($product->get_id())); ?>" class="button cdbt-design-button" id="cdbt-design-button" data-product-id="<?php echo $product->get_id(); ?>">
                    <?php _e('Design Product', CDBT_TEXT_DOMAIN); ?>
                </a>
                <?php if ($product->is_type('variable')) : ?>
                    <p class="cdbt-design-info" style="color: #666; font-size: 0.9em; margin-top: 5px;">
                        <?php _e('Select product options and frame size on the design page.', CDBT_TEXT_DOMAIN); ?>
                    </p>
                <?php endif; ?>
            </div>
            <?php
        }
    }
    
    /**
     * Get design page URL
     */
    private function get_design_url($product_id, $variation_id = 0) {
        $url = home_url('/customize-design/' . $product_id . '/');
        if ($variation_id) {
            $url .= '?variation_id=' . $variation_id;
        }
        return $url;
    }
    
    /**
     * Add rewrite rules for design page
     */
    public function add_rewrite_rules() {
        add_rewrite_rule(
            '^customize-design/([0-9]+)/?$',
            'index.php?cdbt_design=1&product_id=$matches[1]',
            'top'
        );
    }
    
    /**
     * Add query vars
     */
    public function add_query_vars($vars) {
        $vars[] = 'cdbt_design';
        $vars[] = 'product_id';
        $vars[] = 'variation_id';
        return $vars;
    }
    
    /**
     * Handle design page template
     */
    public function handle_design_page() {
        if (get_query_var('cdbt_design')) {
            $product_id = get_query_var('product_id');
            $variation_id = get_query_var('variation_id') ?: (isset($_GET['variation_id']) ? intval($_GET['variation_id']) : 0);
            
            if (!$product_id || !get_post($product_id)) {
                wp_redirect(home_url());
                exit;
            }
            
            $product = wc_get_product($product_id);
            $enable_customize = get_post_meta($product_id, '_cdbt_enable_customize', true);
            
            if ($enable_customize !== 'yes') {
                wp_redirect($product->get_permalink());
                exit;
            }
            
            // For variable products, try to get variation ID from different sources
            if ($product->is_type('variable')) {
                if (!$variation_id) {
                    // Try to get from URL parameters
                    $variation_id = isset($_GET['variation_id']) ? intval($_GET['variation_id']) : 0;
                }
                
                // If still no variation ID, try to get the first available variation
                if (!$variation_id) {
                    $available_variations = $product->get_available_variations();
                    if (!empty($available_variations)) {
                        $variation_id = $available_variations[0]['variation_id'];
                        error_log('CDBT Debug: Using first available variation: ' . $variation_id);
                    }
                }
                
                // If we still don't have a variation ID, redirect back
                if (!$variation_id) {
                    error_log('CDBT Debug: No variation ID found, redirecting back');
                    wp_redirect($product->get_permalink());
                    exit;
                }
            }
            
            $this->load_design_template($product_id, $variation_id);
            exit;
        }
    }
    
    /**
     * Load design template - ENHANCED for color-wise photos
     */
    private function load_design_template($product_id, $variation_id = 0) {
        $product = wc_get_product($product_id);
        $frame_sizes = get_post_meta($product_id, '_cdbt_frame_sizes', true);
        $design_photos = get_post_meta($product_id, '_cdbt_design_photos', true);
        $color_photos = get_post_meta($product_id, '_cdbt_color_photos', true); // NEW
        
        if (!is_array($frame_sizes)) {
            $frame_sizes = array();
        }
        
        if (!is_array($design_photos)) {
            $design_photos = array();
        }
        
        if (!is_array($color_photos)) {
            $color_photos = array();
        }
        
        // NEW: Get color variations
        $color_variations = array();
        if ($product->is_type('variable')) {
            $variation_ids = $product->get_children();
            
            if (!empty($variation_ids)) {
                foreach ($variation_ids as $var_id) {
                    $variation = wc_get_product($var_id);
                    if (!$variation) continue;
                    
                    $attributes = $variation->get_variation_attributes();
                    
                    foreach ($attributes as $attr_key => $attr_value) {
                        $clean_key = str_replace('attribute_', '', strtolower($attr_key));
                        
                        if (stripos($clean_key, 'color') !== false || stripos($clean_key, 'colour') !== false) {
                            if (!empty($attr_value)) {
                                // Normalize slug to lowercase for consistent matching
                                $normalized_slug = strtolower($attr_value);
                                if (!isset($color_variations[$normalized_slug])) {
                                    $color_variations[$normalized_slug] = array(
                                        'name' => ucfirst($attr_value),
                                        'slug' => $normalized_slug,
                                        'variation_id' => $var_id
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // NEW: Prepare color-wise photos with URLs (CASE-INSENSITIVE)
        $color_photos_with_urls = array();
        foreach ($color_photos as $color_slug => $photos) {
            $front_url = '';
            $back_url = '';
            
            if (!empty($photos['front'])) {
                $front_image = wp_get_attachment_image_src($photos['front'], 'large');
                if ($front_image) {
                    $front_url = $front_image[0];
                }
            }
            
            if (!empty($photos['back'])) {
                $back_image = wp_get_attachment_image_src($photos['back'], 'large');
                if ($back_image) {
                    $back_url = $back_image[0];
                }
            }
            
            // Normalize slug to lowercase for case-insensitive matching
            $normalized_slug = strtolower($color_slug);
            $color_photos_with_urls[$normalized_slug] = array(
                'front' => $front_url,
                'back' => $back_url
            );
        }
        
        // ORIGINAL: Get photo URLs (fallback for non-variable products)
        $photo_urls = array();
        foreach ($design_photos as $photo_id) {
            $image_url = wp_get_attachment_image_src($photo_id, 'large');
            if ($image_url) {
                $photo_urls[] = array(
                    'id' => $photo_id,
                    'url' => $image_url[0],
                    'width' => $image_url[1],
                    'height' => $image_url[2]
                );
            }
        }
        
        get_header();
        ?>
<!-- V12.12: Google Fonts for mobile compatibility -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel&family=Dancing+Script&family=Great+Vibes&family=Lato&family=Lobster&family=Montserrat&family=Open+Sans&family=Oswald&family=Pacifico&family=Permanent+Marker&family=Playfair+Display&family=Poppins&family=Raleway&family=Roboto&family=Satisfy&display=swap" rel="stylesheet">
<style>
header.elementor.elementor-17.elementor-location-header {
    display: none;
}

footer.elementor.elementor-30.elementor-location-footer {
    display: none;
}
.et-mobile-panel-wrapper.dt-hide.etheme-sticky-panel.et_element.pos-fixed.bottom.full-width {
    display: none;
}
</style>
        <div id="cdbt-design-page" class="cdbt-design-container">
            <div class="cdbt-design-header">
                <h1><?php echo sprintf(__('Customize %s', CDBT_TEXT_DOMAIN), $product->get_name()); ?></h1>
                <div class="cdbt-design-actions">
                    <button id="cdbt-add-to-cart" class="button cdbt-add-to-cart-btn" data-product-id="<?php echo $product_id; ?>">
                        <?php _e('Add to Cart', CDBT_TEXT_DOMAIN); ?>
                    </button>
                    <a href="<?php echo $product->get_permalink(); ?>" class="button cdbt-back-btn">
                        <?php _e('Back to Product', CDBT_TEXT_DOMAIN); ?>
                    </a>
                </div>
            </div>
            
            <div class="cdbt-design-content">
                <!-- Left Sidebar - Controls -->
                <div class="cdbt-design-sidebar cdbt-design-left">

	<div class="customize-tabs"> 
	<ul>
		<li  class="item-s">
		<img src="https://inyourpostcode.co.uk/wp-content/uploads/2025/11/tshirt.png"> 
<span>Item</span>
</li>
	
		<li class="text-s">  <img src="https://inyourpostcode.co.uk/wp-content/uploads/2025/11/font.png">
		<span>Text</span>
		</li>
	<li class="artwork-s"><img src="https://inyourpostcode.co.uk/wp-content/uploads/2025/11/frame-1.png"> <span> My Artwork</span></li>
	</ul>
	</div>
                    <!-- Product Variations (for variable products) -->
                    <?php if ($product->is_type('variable')): ?>
                    <div class="cdbt-control-section item">
						<div class="close-removed">X</div>
                        <h3><?php _e('Select Product Options', CDBT_TEXT_DOMAIN); ?></h3>
                        <div id="cdbt-product-variations">
                            <?php
                            $available_variations = $product->get_available_variations();
                            $variation_attributes = $product->get_variation_attributes();
                            
                            foreach ($variation_attributes as $attribute_name => $options) {
                                $attribute_label = wc_attribute_label($attribute_name);
                                ?>
                                <div class="cdbt-variation-option">
                                    <label for="<?php echo sanitize_title($attribute_name); ?>">
                                        <?php echo esc_html($attribute_label); ?>:
                                    </label>
                                    <select name="attribute_<?php echo sanitize_title($attribute_name); ?>" id="<?php echo sanitize_title($attribute_name); ?>" class="cdbt-variation-select">
                                        <option value=""><?php echo sprintf(__('Choose %s', CDBT_TEXT_DOMAIN), $attribute_label); ?></option>
                                        <?php foreach ($options as $option): ?>
                                            <option value="<?php echo esc_attr($option); ?>" <?php selected($variation_id && isset($_GET['variation_id']) ? get_post_meta($_GET['variation_id'], 'attribute_' . sanitize_title($attribute_name), true) : '', $option); ?>>
                                                <?php echo esc_html($option); ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                <?php
                            }
                            ?>
                            <input type="hidden" name="variation_id" id="cdbt-variation-id" value="" />
                            <div id="cdbt-variation-price" class="cdbt-price-display"></div>
                        </div>
  <h3><?php _e('Select Frame Size', CDBT_TEXT_DOMAIN); ?></h3>
                        <div id="cdbt-frame-sizes">
                            <?php foreach ($frame_sizes as $index => $frame): ?>
                                <div class="cdbt-frame-option" data-index="<?php echo $index; ?>" data-price="<?php echo $frame['price']; ?>">
                                    <input type="radio" name="cdbt_frame_size" id="frame_<?php echo $index; ?>" value="<?php echo $index; ?>" />
                                    <label for="frame_<?php echo $index; ?>">
                                        <?php echo esc_html($frame['size']); ?>
                                        <span class="cdbt-frame-price">+<?php echo wc_price($frame['price']); ?></span>
                                    </label>
                                </div>
                            <?php endforeach; ?>
                        </div>
                        <div id="cdbt-selected-frame-price" class="cdbt-price-display"></div>
                         <h3><?php _e('Add Image', CDBT_TEXT_DOMAIN); ?></h3>
                        <div class="cdbt-image-upload">
                            <input type="file" id="cdbt-image-upload" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif,image/bmp,image/tiff,image/svg+xml" />
                            <button id="cdbt-upload-image" class="button"><?php _e('Upload Image', CDBT_TEXT_DOMAIN); ?></button>
                        </div>
                        <p class="cdbt-help-text"><?php _e('Supported formats: JPG, PNG, GIF, WEBP, AVIF, BMP, TIFF, SVG', CDBT_TEXT_DOMAIN); ?></p>
                    </div>
                    <?php endif; ?>
                    
             
                    <!-- Add Text -->
                    <div class="cdbt-control-section text">
						<div class="close-removed">X</div>
                        <h3><?php _e('Add Text', CDBT_TEXT_DOMAIN); ?></h3>
                        <div class="cdbt-text-controls">
                            <input type="text" id="cdbt-text-input" placeholder="<?php _e('Enter your text', CDBT_TEXT_DOMAIN); ?>" />
                            <button id="cdbt-add-text" class="button"><?php _e('Add Text', CDBT_TEXT_DOMAIN); ?></button>
                        </div>
                        
                        <!-- Text Formatting Controls -->
                        <div id="cdbt-text-formatting" class="cdbt-formatting-controls" style="display:none;">
                            <h4><?php _e('Text Formatting', CDBT_TEXT_DOMAIN); ?></h4>
                            <div class="cdbt-format-row">
                                <label><?php _e('Font Size:', CDBT_TEXT_DOMAIN); ?></label>
                                <input type="range" id="cdbt-font-size" min="12" max="72" value="24" />
                                <span id="cdbt-font-size-value">24px</span>
                            </div>
                            <div class="cdbt-format-row">
                                <label><?php _e('Font Color:', CDBT_TEXT_DOMAIN); ?></label>
                                <input type="color" id="cdbt-font-color" value="#000000" />
                            </div>
                            <div class="cdbt-format-row">
                                <label><?php _e('Font Family:', CDBT_TEXT_DOMAIN); ?></label>
                                <select id="cdbt-font-family">
                                    <option value="Arial">Arial</option>
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Georgia">Georgia</option>
                                    <option value="Verdana">Verdana</option>
                                    <option value="Courier New">Courier New</option>
                                    <option value="Impact">Impact</option>
                                    <option value="Tahoma">Tahoma</option>
                                    <option value="Arial Black">Arial Black</option>
                                    <!-- Google Fonts - Work on ALL devices including mobile -->
                                    <option value="'Roboto', sans-serif">Roboto</option>
                                    <option value="'Open Sans', sans-serif">Open Sans</option>
                                    <option value="'Lato', sans-serif">Lato</option>
                                    <option value="'Montserrat', sans-serif">Montserrat</option>
                                    <option value="'Poppins', sans-serif">Poppins</option>
                                    <option value="'Playfair Display', serif">Playfair Display</option>
                                    <option value="'Dancing Script', cursive">Dancing Script</option>
                                    <option value="'Pacifico', cursive">Pacifico</option>
                                    <option value="'Lobster', cursive">Lobster</option>
                                    <option value="'Great Vibes', cursive">Great Vibes</option>
                                    <option value="'Satisfy', cursive">Satisfy</option>
                                    <option value="'Cinzel', serif">Cinzel</option>
                                    <option value="'Oswald', sans-serif">Oswald</option>
                                    <option value="'Raleway', sans-serif">Raleway</option>
                                    <option value="'Permanent Marker', cursive">Permanent Marker</option>
                                </select>
                                <button type="button" id="cdbt-apply-font-btn" style="margin-left:5px; padding:5px 10px; background:#28a745; color:white; border:none; border-radius:4px; font-size:12px;">Apply</button>
                            </div>
                            <div class="cdbt-format-row">
                                <button id="cdbt-bold" class="cdbt-format-btn" data-style="bold"><?php _e('B', CDBT_TEXT_DOMAIN); ?></button>
                                <button id="cdbt-italic" class="cdbt-format-btn" data-style="italic"><?php _e('I', CDBT_TEXT_DOMAIN); ?></button>
                                <button id="cdbt-underline" class="cdbt-format-btn" data-style="underline"><?php _e('U', CDBT_TEXT_DOMAIN); ?></button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- My Artwork -->
                    <div class="cdbt-control-section artwork">
						<div class="close-removed">X</div>
                        <h3><?php _e('My Artwork', CDBT_TEXT_DOMAIN); ?></h3>
                        
                        <!-- Artwork Header -->
                        <div class="cdbt-artwork-header">
                            <p class="cdbt-artwork-count" id="cdbt-artwork-count"><?php _e('Loading...', CDBT_TEXT_DOMAIN); ?></p>
                        </div>
                        
                        <!-- Disabled Message (shown when upload/text already added) -->
                        <div class="cdbt-artwork-disabled-message" id="cdbt-artwork-disabled-message" style="display: none;">
                            <strong><?php _e('Artwork Not Available', CDBT_TEXT_DOMAIN); ?></strong>
                            <p><?php _e('You already have an uploaded image or text on the canvas. Please delete it first to use artwork.', CDBT_TEXT_DOMAIN); ?></p>
                        </div>
                        
                        <!-- Artwork Grid Container -->
                        <div class="cdbt-artwork-container">
                            <div id="cdbt-artwork-grid-container">
                                <!-- Artworks will be loaded here via JavaScript -->
                                <div class="cdbt-artwork-loading">
                                    <div class="cdbt-artwork-loader"></div>
                                    <p><?php _e('Click the tab to load artworks...', CDBT_TEXT_DOMAIN); ?></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Delete Element -->
                    <div class="cdbt-control-section">
                        <h3><?php _e('Selected Element', CDBT_TEXT_DOMAIN); ?></h3>
                        <div id="cdbt-element-controls" style="display: none;">
                            <p id="cdbt-selected-element-info"><?php _e('No element selected', CDBT_TEXT_DOMAIN); ?></p>
                            <button id="cdbt-delete-element" class="button cdbt-delete-btn"><?php _e('Delete Selected Element', CDBT_TEXT_DOMAIN); ?></button>
                        </div>
                        <p id="cdbt-no-selection" class="cdbt-help-text"><?php _e('Click on text or image to select and delete it', CDBT_TEXT_DOMAIN); ?></p>
                    </div>
                </div>
                
                <!-- Middle - Canvas -->
                <div class="cdbt-design-canvas">
   <div class="cdbt-control-section options-element">
                        <h3><?php _e('Selected Element', CDBT_TEXT_DOMAIN); ?></h3>
                        <div id="cdbt-element-controls" style="display: none;">
                            <p id="cdbt-selected-element-info"><?php _e('No element selected', CDBT_TEXT_DOMAIN); ?></p>
                            <button id="cdbt-delete-element" class="button cdbt-delete-btn"><?php _e('Delete Selected Element', CDBT_TEXT_DOMAIN); ?></button>
                        </div>
                        <p id="cdbt-no-selection" class="cdbt-help-text"><?php _e('Click on text or image to select and delete it', CDBT_TEXT_DOMAIN); ?></p>
                    </div>
                    <div id="cdbt-canvas-container">
                        <canvas id="cdbt-design-canvas"></canvas>
                        <div id="cdbt-canvas-overlay"></div>
                    </div>
                </div>
                
                <!-- Right Sidebar - Photo Gallery ENHANCED -->
                <div class="cdbt-design-sidebar cdbt-design-right">
                    <?php if (!empty($color_variations) && !empty($color_photos_with_urls)): ?>
                        <!-- NEW: Color Selection -->
                        <h3><?php _e('Select Color', CDBT_TEXT_DOMAIN); ?></h3>
                        <div class="cdbt-color-selector" style="margin-bottom: 20px;">
                            <select id="cdbt-color-select" class="cdbt-select" style="width: 100%; padding: 8px; font-size: 14px;">
                                <option value=""><?php _e('Choose a color...', CDBT_TEXT_DOMAIN); ?></option>
                                <?php foreach ($color_variations as $color): ?>
                                    <option value="<?php echo esc_attr($color['slug']); ?>" data-variation-id="<?php echo $color['variation_id']; ?>">
                                        <?php echo esc_html($color['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        
                        <!-- NEW: Front/Back Photo Gallery -->
                        <h3><?php _e('Design Photos', CDBT_TEXT_DOMAIN); ?></h3>
                        <p class="cdbt-help-text" id="cdbt-photo-instruction" style="color: #666; font-size: 12px;">
                            <?php _e('Select a color to see available photos', CDBT_TEXT_DOMAIN); ?>
                        </p>
                        <div id="cdbt-photo-gallery" class="cdbt-photo-gallery">
                            <!-- Photos will be loaded dynamically based on color selection -->
                        </div>
                    <?php else: ?>
                        <!-- ORIGINAL: Regular Photo Gallery (fallback) -->
                        <h3><?php _e('Design Photos', CDBT_TEXT_DOMAIN); ?></h3>
                        <div id="cdbt-photo-gallery">
                            <?php foreach ($photo_urls as $photo): ?>
                                <div class="cdbt-gallery-photo" data-id="<?php echo $photo['id']; ?>" data-url="<?php echo $photo['url']; ?>">
                                    <img src="<?php echo $photo['url']; ?>" alt="" />
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        
        <script type="text/javascript">
            var cdbtDesignData = {
                productId: <?php echo $product_id; ?>,
                <?php if (!$product->is_type('variable')): ?>
                variationId: <?php echo $variation_id; ?>,
                <?php endif; ?>
                photos: <?php echo json_encode($photo_urls); ?>,
                colorPhotos: <?php echo json_encode($color_photos_with_urls); ?>, // NEW
                colorVariations: <?php echo json_encode(array_values($color_variations)); ?>, // NEW
                frameSizes: <?php echo json_encode($frame_sizes); ?>,
                basePrice: <?php echo $variation_id ? wc_get_product($variation_id)->get_price() : $product->get_price(); ?>,
                currency: '<?php echo get_woocommerce_currency_symbol(); ?>',
                <?php if ($product->is_type('variable')): ?>
                variations: <?php echo json_encode($product->get_available_variations()); ?>,
                <?php endif; ?>
                isVariable: <?php echo $product->is_type('variable') ? 'true' : 'false'; ?>,
                hasColorPhotos: <?php echo !empty($color_photos_with_urls) ? 'true' : 'false'; ?> // NEW
            };
            // danish js tabs start
// jQuery(document).ready(function($) {

//     // By default show item section
//     $('.cdbt-control-section.item').addClass('active-section');
//     $('.customize-tabs li.item-s').addClass('active');

//     $('.customize-tabs li').on('click', function(){

//         // Remove active from all
//         $('.customize-tabs li').removeClass('active');
//         $('.cdbt-control-section').removeClass('active-section');

//         // Add active to clicked
//         $(this).addClass('active');

//         // Get clicked class (item-s / artwork-s / text-s)
//         let tabClass = $(this).attr('class').split(' ')[0]; 
//         let sectionName = tabClass.replace('-s', '');  // item-s → item

//         // Show the matching section
//         $('.cdbt-control-section.' + sectionName).addClass('active-section');
//     });

// });
jQuery(document).ready(function($) {

    function isMobile() {
        return window.innerWidth <= 768;
    }

    // DESKTOP: default active
    if (!isMobile()) {
        $('.cdbt-control-section.item').addClass('active-section');
        $('.customize-tabs li.item-s').addClass('active');
    }

    // TAB CLICK
    $('.customize-tabs li').on('click', function(){

        // Mobile: If clicked tab is already open → close it
        if (isMobile() && $(this).hasClass('active')) {
            $(this).removeClass('active');
            $('.cdbt-control-section').removeClass('active-section');
            return;
        }

        // Remove active from all
        $('.customize-tabs li').removeClass('active');
        $('.cdbt-control-section').removeClass('active-section');

        // Add active to clicked tab
        $(this).addClass('active');

        // item-s → item (match class)
        let tabClass = $(this).attr('class').split(' ')[0];
        let sectionName = tabClass.replace('-s', '');

        // Show matched section
        $('.cdbt-control-section.' + sectionName).addClass('active-section');
    });

    // CLOSE BUTTON (X)
    $('.close-removed').on('click', function(){
        // Hide its parent section
        $(this).closest('.cdbt-control-section').removeClass('active-section');
        // Also remove active from tab
        $('.customize-tabs li').removeClass('active');
    });
});

// end js danish tabs 
        </script>
        <?php
        get_footer();
    }
}