<?php
/**
 * Admin functionality - ENHANCED with color-wise photos
 * All original features preserved
 */

if (!defined('ABSPATH')) {
    exit;
}

class CDBT_Admin {
    
    public function __construct() {
        add_action('woocommerce_product_data_panels', array($this, 'add_product_data_panel'));
        add_action('woocommerce_product_data_tabs', array($this, 'add_product_data_tab'));
        add_action('woocommerce_process_product_meta', array($this, 'save_product_data'));
        
        // Settings page
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    /**
     * Add settings page
     */
    public function add_settings_page() {
        add_submenu_page(
            'woocommerce',
            __('Customize Design Settings', CDBT_TEXT_DOMAIN),
            __('Design Settings', CDBT_TEXT_DOMAIN),
            'manage_options',
            'cdbt-settings',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('cdbt_settings', 'cdbt_removebg_api_key');
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Customize Design Settings', CDBT_TEXT_DOMAIN); ?></h1>
            
            <form method="post" action="options.php">
                <?php settings_fields('cdbt_settings'); ?>
                <?php do_settings_sections('cdbt_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="cdbt_removebg_api_key">
                                <?php _e('Remove.bg API Key', CDBT_TEXT_DOMAIN); ?>
                            </label>
                        </th>
                        <td>
                            <input type="text" 
                                   id="cdbt_removebg_api_key" 
                                   name="cdbt_removebg_api_key" 
                                   value="<?php echo esc_attr(get_option('cdbt_removebg_api_key', '')); ?>" 
                                   class="regular-text" 
                                   placeholder="Enter your remove.bg API key"
                            />
                            <p class="description">
                                <?php _e('Enter your remove.bg API key to enable background removal feature. ', CDBT_TEXT_DOMAIN); ?>
                                <a href="https://www.remove.bg/api" target="_blank"><?php _e('Get your API key here', CDBT_TEXT_DOMAIN); ?></a>
                            </p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
    
    public function add_product_data_tab($tabs) {
        $tabs['customize_design'] = array(
            'label'    => __('Customize Design Settings', CDBT_TEXT_DOMAIN),
            'target'   => 'customize_design_product_data',
            'class'    => array('show_if_simple', 'show_if_variable'),
            'priority' => 80,
        );
        return $tabs;
    }
    
    public function add_product_data_panel() {
        global $post;
        
        $product = wc_get_product($post->ID);
        $enable_customize = get_post_meta($post->ID, '_cdbt_enable_customize', true);
        $frame_sizes = get_post_meta($post->ID, '_cdbt_frame_sizes', true);
        $design_photos = get_post_meta($post->ID, '_cdbt_design_photos', true);
        $color_photos = get_post_meta($post->ID, '_cdbt_color_photos', true); // NEW
        
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
        if ($product && $product->is_type('variable')) {
            $variation_ids = $product->get_children();
            
            if (!empty($variation_ids)) {
                foreach ($variation_ids as $variation_id) {
                    $variation = wc_get_product($variation_id);
                    if (!$variation) continue;
                    
                    $attributes = $variation->get_variation_attributes();
                    
                    foreach ($attributes as $attr_key => $attr_value) {
                        $clean_key = str_replace('attribute_', '', strtolower($attr_key));
                        
                        if (stripos($clean_key, 'color') !== false || stripos($clean_key, 'colour') !== false) {
                            if (!empty($attr_value) && !isset($color_variations[$attr_value])) {
                                $color_variations[$attr_value] = array(
                                    'name' => ucfirst($attr_value),
                                    'slug' => $attr_value,
                                    'variation_id' => $variation_id
                                );
                            }
                        }
                    }
                }
            }
        }
        ?>
        <div id="customize_design_product_data" class="panel woocommerce_options_panel">
            <div class="options_group">
                <?php
                woocommerce_wp_checkbox(array(
                    'id'          => '_cdbt_enable_customize',
                    'label'       => __('Enable Customize Design', CDBT_TEXT_DOMAIN),
                    'description' => __('Check this to enable design customization for this product.', CDBT_TEXT_DOMAIN),
                    'value'       => $enable_customize
                ));
                ?>
            </div>
            
            <div id="cdbt_customize_settings" style="<?php echo $enable_customize ? '' : 'display:none;'; ?>">
                <!-- Frame Sizes Section -->
                <div class="options_group">
                    <h4><?php _e('Frame Sizes', CDBT_TEXT_DOMAIN); ?></h4>
                    <div id="cdbt_frame_sizes">
                        <?php if (!empty($frame_sizes)): ?>
                            <?php foreach ($frame_sizes as $index => $frame): ?>
                                <div class="cdbt_frame_size_row" data-index="<?php echo $index; ?>">
                                    <p class="form-field">
                                        <label><?php _e('Frame Size', CDBT_TEXT_DOMAIN); ?></label>
                                        <input type="text" name="_cdbt_frame_sizes[<?php echo $index; ?>][size]" value="<?php echo esc_attr($frame['size']); ?>" placeholder="<?php _e('e.g., 8x10 inches', CDBT_TEXT_DOMAIN); ?>" />
                                    </p>
                                    <p class="form-field">
                                        <label><?php _e('Frame Price', CDBT_TEXT_DOMAIN); ?></label>
                                        <input type="number" step="0.01" name="_cdbt_frame_sizes[<?php echo $index; ?>][price]" value="<?php echo esc_attr($frame['price']); ?>" placeholder="0.00" />
                                    </p>
                                    <p class="form-field">
                                        <button type="button" class="button cdbt_remove_frame_size"><?php _e('Remove', CDBT_TEXT_DOMAIN); ?></button>
                                    </p>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                    <p class="form-field">
                        <button type="button" id="cdbt_add_frame_size" class="button"><?php _e('Add Frame Size', CDBT_TEXT_DOMAIN); ?></button>
                    </p>
                </div>
                
                <!-- Design Photos Section - ENHANCED -->
                <div class="options_group">
                    <?php if (!empty($color_variations)): ?>
                        <!-- NEW: Color-wise Front/Back Photos -->
                        <h4><?php _e('Front & Back Photos for Each Color', CDBT_TEXT_DOMAIN); ?></h4>
                        <p class="description"><?php _e('Upload front and back photos for each color variation.', CDBT_TEXT_DOMAIN); ?></p>
                        
                        <?php foreach ($color_variations as $color_slug => $color_data): ?>
                            <?php
                            $front_photo = isset($color_photos[$color_slug]['front']) ? $color_photos[$color_slug]['front'] : '';
                            $back_photo = isset($color_photos[$color_slug]['back']) ? $color_photos[$color_slug]['back'] : '';
                            ?>
                            <div class="cdbt_color_photo_section" style="border: 1px solid #ddd; padding: 15px; margin: 15px 0; background: #f9f9f9;">
                                <h5 style="margin-top: 0; color: #333;">
                                    <?php echo esc_html($color_data['name']); ?> Color
                                </h5>
                                
                                <!-- Front Photo -->
                                <div class="cdbt_photo_upload" style="display: inline-block; margin-right: 20px; vertical-align: top;">
                                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">
                                        <?php _e('Front Photo', CDBT_TEXT_DOMAIN); ?>
                                    </label>
                                    <input type="hidden" 
                                           class="cdbt_color_photo_input" 
                                           name="_cdbt_color_photos[<?php echo esc_attr($color_slug); ?>][front]" 
                                           value="<?php echo esc_attr($front_photo); ?>" />
                                    <button type="button" 
                                            class="button cdbt_select_color_photo" 
                                            data-color="<?php echo esc_attr($color_slug); ?>" 
                                            data-side="front">
                                        <?php _e('Select Front Photo', CDBT_TEXT_DOMAIN); ?>
                                    </button>
                                    <div class="cdbt_color_photo_preview" style="margin-top: 10px;">
                                        <?php if ($front_photo): ?>
                                            <?php $image = wp_get_attachment_image_src($front_photo, 'thumbnail'); ?>
                                            <?php if ($image): ?>
                                                <div class="cdbt_photo_thumb" style="position: relative; display: inline-block;">
                                                    <img src="<?php echo $image[0]; ?>" style="max-width: 100px; border: 2px solid #0073aa;" />
                                                    <button type="button" class="cdbt_remove_color_photo" data-color="<?php echo esc_attr($color_slug); ?>" data-side="front" style="position: absolute; top: -5px; right: -5px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;">&times;</button>
                                                </div>
                                            <?php endif; ?>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                
                                <!-- Back Photo -->
                                <div class="cdbt_photo_upload" style="display: inline-block; vertical-align: top;">
                                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">
                                        <?php _e('Back Photo', CDBT_TEXT_DOMAIN); ?>
                                    </label>
                                    <input type="hidden" 
                                           class="cdbt_color_photo_input" 
                                           name="_cdbt_color_photos[<?php echo esc_attr($color_slug); ?>][back]" 
                                           value="<?php echo esc_attr($back_photo); ?>" />
                                    <button type="button" 
                                            class="button cdbt_select_color_photo" 
                                            data-color="<?php echo esc_attr($color_slug); ?>" 
                                            data-side="back">
                                        <?php _e('Select Back Photo', CDBT_TEXT_DOMAIN); ?>
                                    </button>
                                    <div class="cdbt_color_photo_preview" style="margin-top: 10px;">
                                        <?php if ($back_photo): ?>
                                            <?php $image = wp_get_attachment_image_src($back_photo, 'thumbnail'); ?>
                                            <?php if ($image): ?>
                                                <div class="cdbt_photo_thumb" style="position: relative; display: inline-block;">
                                                    <img src="<?php echo $image[0]; ?>" style="max-width: 100px; border: 2px solid #0073aa;" />
                                                    <button type="button" class="cdbt_remove_color_photo" data-color="<?php echo esc_attr($color_slug); ?>" data-side="back" style="position: absolute; top: -5px; right: -5px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;">&times;</button>
                                                </div>
                                            <?php endif; ?>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <!-- ORIGINAL: Regular Photo Upload (when no color variations) -->
                        <h4><?php _e('Choose Photos for Design', CDBT_TEXT_DOMAIN); ?></h4>
                        <p class="form-field">
                            <label><?php _e('Design Photos', CDBT_TEXT_DOMAIN); ?></label>
                            <input type="hidden" id="cdbt_design_photos" name="_cdbt_design_photos" value="<?php echo esc_attr(implode(',', $design_photos)); ?>" />
                            <button type="button" id="cdbt_select_photos" class="button"><?php _e('Select Photos', CDBT_TEXT_DOMAIN); ?></button>
                            <span class="description"><?php _e('Choose multiple photos that customers can customize.', CDBT_TEXT_DOMAIN); ?></span>
                        </p>
                        <div id="cdbt_selected_photos">
                            <?php if (!empty($design_photos)): ?>
                                <?php foreach ($design_photos as $photo_id): ?>
                                    <?php $image = wp_get_attachment_image_src($photo_id, 'thumbnail'); ?>
                                    <?php if ($image): ?>
                                        <div class="cdbt_photo_preview" data-id="<?php echo $photo_id; ?>">
                                            <img src="<?php echo $image[0]; ?>" alt="" />
                                            <button type="button" class="cdbt_remove_photo">&times;</button>
                                        </div>
                                    <?php endif; ?>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        
        <script type="text/template" id="cdbt_frame_size_template">
            <div class="cdbt_frame_size_row" data-index="{{index}}">
                <p class="form-field">
                    <label><?php _e('Frame Size', CDBT_TEXT_DOMAIN); ?></label>
                    <input type="text" name="_cdbt_frame_sizes[{{index}}][size]" value="" placeholder="<?php _e('e.g., 8x10 inches', CDBT_TEXT_DOMAIN); ?>" />
                </p>
                <p class="form-field">
                    <label><?php _e('Frame Price', CDBT_TEXT_DOMAIN); ?></label>
                    <input type="number" step="0.01" name="_cdbt_frame_sizes[{{index}}][price]" value="" placeholder="0.00" />
                </p>
                <p class="form-field">
                    <button type="button" class="button cdbt_remove_frame_size"><?php _e('Remove', CDBT_TEXT_DOMAIN); ?></button>
                </p>
            </div>
        </script>
        
        <script type="text/javascript">
        jQuery(document).ready(function($) {
            var colorPhotoFrame;
            var currentColorSide = {color: '', side: ''};
            
            // NEW: Select color photo
            $(document).on('click', '.cdbt_select_color_photo', function(e) {
                e.preventDefault();
                var $btn = $(this);
                currentColorSide.color = $btn.data('color');
                currentColorSide.side = $btn.data('side');
                
                if (colorPhotoFrame) {
                    colorPhotoFrame.open();
                    return;
                }
                
                colorPhotoFrame = wp.media({
                    title: 'Select ' + currentColorSide.side + ' Photo',
                    button: {text: 'Use this photo'},
                    multiple: false
                });
                
                colorPhotoFrame.on('select', function() {
                    var attachment = colorPhotoFrame.state().get('selection').first().toJSON();
                    var $input = $('button[data-color="' + currentColorSide.color + '"][data-side="' + currentColorSide.side + '"]').siblings('input');
                    var $preview = $('button[data-color="' + currentColorSide.color + '"][data-side="' + currentColorSide.side + '"]').siblings('.cdbt_color_photo_preview');
                    
                    $input.val(attachment.id);
                    $preview.html('<div class="cdbt_photo_thumb" style="position: relative; display: inline-block;"><img src="' + attachment.url + '" style="max-width: 100px; border: 2px solid #0073aa;" /><button type="button" class="cdbt_remove_color_photo" data-color="' + currentColorSide.color + '" data-side="' + currentColorSide.side + '" style="position: absolute; top: -5px; right: -5px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;">&times;</button></div>');
                });
                
                colorPhotoFrame.open();
            });
            
            // NEW: Remove color photo
            $(document).on('click', '.cdbt_remove_color_photo', function(e) {
                e.preventDefault();
                var $btn = $(this);
                var color = $btn.data('color');
                var side = $btn.data('side');
                
                $('button[data-color="' + color + '"][data-side="' + side + '"]').siblings('input').val('');
                $btn.closest('.cdbt_photo_thumb').remove();
            });
            
            // ORIGINAL: Frame size management
            var frameIndex = <?php echo count($frame_sizes); ?>;
            
            $('#cdbt_add_frame_size').on('click', function() {
                var template = $('#cdbt_frame_size_template').html();
                template = template.replace(/{{index}}/g, frameIndex);
                $('#cdbt_frame_sizes').append(template);
                frameIndex++;
            });
            
            $(document).on('click', '.cdbt_remove_frame_size', function() {
                $(this).closest('.cdbt_frame_size_row').remove();
            });
            
            // ORIGINAL: Toggle customize settings
            $('#_cdbt_enable_customize').on('change', function() {
                if ($(this).is(':checked')) {
                    $('#cdbt_customize_settings').show();
                } else {
                    $('#cdbt_customize_settings').hide();
                }
            });
            
            // ORIGINAL: Photo selector (for non-variable products)
            var photoFrame;
            
            $('#cdbt_select_photos').on('click', function(e) {
                e.preventDefault();
                
                if (photoFrame) {
                    photoFrame.open();
                    return;
                }
                
                photoFrame = wp.media({
                    title: 'Select Design Photos',
                    button: {text: 'Use these photos'},
                    multiple: true
                });
                
                photoFrame.on('select', function() {
                    var attachments = photoFrame.state().get('selection').toJSON();
                    var photoIds = $('#cdbt_design_photos').val().split(',').filter(Boolean);
                    
                    attachments.forEach(function(attachment) {
                        if (photoIds.indexOf(attachment.id.toString()) === -1) {
                            photoIds.push(attachment.id);
                            $('#cdbt_selected_photos').append(
                                '<div class="cdbt_photo_preview" data-id="' + attachment.id + '">' +
                                '<img src="' + attachment.url + '" alt="" />' +
                                '<button type="button" class="cdbt_remove_photo">&times;</button>' +
                                '</div>'
                            );
                        }
                    });
                    
                    $('#cdbt_design_photos').val(photoIds.join(','));
                });
                
                photoFrame.open();
            });
            
            $(document).on('click', '.cdbt_remove_photo', function() {
                var $preview = $(this).closest('.cdbt_photo_preview');
                var photoId = $preview.data('id');
                var photoIds = $('#cdbt_design_photos').val().split(',').filter(Boolean);
                
                photoIds = photoIds.filter(function(id) {
                    return id != photoId;
                });
                
                $('#cdbt_design_photos').val(photoIds.join(','));
                $preview.remove();
            });
        });
        </script>
        <?php
    }
    
    public function save_product_data($post_id) {
        // Enable customize
        $enable_customize = isset($_POST['_cdbt_enable_customize']) ? 'yes' : 'no';
        update_post_meta($post_id, '_cdbt_enable_customize', $enable_customize);
        
        // Frame sizes
        if (isset($_POST['_cdbt_frame_sizes']) && is_array($_POST['_cdbt_frame_sizes'])) {
            $frame_sizes = array();
            foreach ($_POST['_cdbt_frame_sizes'] as $frame) {
                if (!empty($frame['size']) && !empty($frame['price'])) {
                    $frame_sizes[] = array(
                        'size' => sanitize_text_field($frame['size']),
                        'price' => floatval($frame['price'])
                    );
                }
            }
            update_post_meta($post_id, '_cdbt_frame_sizes', $frame_sizes);
        } else {
            delete_post_meta($post_id, '_cdbt_frame_sizes');
        }
        
        // ORIGINAL: Design photos
        if (isset($_POST['_cdbt_design_photos'])) {
            $photo_ids = array_filter(array_map('intval', explode(',', $_POST['_cdbt_design_photos'])));
            update_post_meta($post_id, '_cdbt_design_photos', $photo_ids);
        } else {
            delete_post_meta($post_id, '_cdbt_design_photos');
        }
        
        // NEW: Color photos
        if (isset($_POST['_cdbt_color_photos']) && is_array($_POST['_cdbt_color_photos'])) {
            $color_photos = array();
            foreach ($_POST['_cdbt_color_photos'] as $color => $photos) {
                $color_photos[$color] = array(
                    'front' => !empty($photos['front']) ? intval($photos['front']) : '',
                    'back' => !empty($photos['back']) ? intval($photos['back']) : ''
                );
            }
            update_post_meta($post_id, '_cdbt_color_photos', $color_photos);
        } else {
            delete_post_meta($post_id, '_cdbt_color_photos');
        }
    }
}
