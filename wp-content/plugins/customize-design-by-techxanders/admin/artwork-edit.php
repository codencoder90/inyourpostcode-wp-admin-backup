<?php
/**
 * Admin Edit Artwork Page
 * 
 * Purpose: Edit existing artwork
 * Existing artwork کو edit کرنا
 * 
 * @package CustomizeDesignByTechXanders
 * @version 1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// Get artwork ID
$artwork_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$artwork_id) {
    wp_die(__('Invalid artwork ID', CDBT_TEXT_DOMAIN));
}

$handler = new CDBT_Artwork_Handler();
$artwork = $handler->get_artwork($artwork_id);

if (!$artwork) {
    wp_die(__('Artwork not found', CDBT_TEXT_DOMAIN));
}

// Handle form submission
if (isset($_POST['cdbt_update_artwork']) && check_admin_referer('cdbt_update_artwork_action', 'cdbt_update_artwork_nonce')) {
    
    if (empty($_POST['artwork_title'])) {
        $error = __('Please enter artwork title.', CDBT_TEXT_DOMAIN);
    } else {
        $file = isset($_FILES['artwork_image']) && $_FILES['artwork_image']['size'] > 0 ? $_FILES['artwork_image'] : null;
        
        $result = $handler->update_artwork(
            $artwork_id,
            array(
                'title' => $_POST['artwork_title'],
                'display_order' => isset($_POST['display_order']) ? $_POST['display_order'] : 0
            ),
            $file
        );
        
        if ($result['success']) {
            $success = $result['message'];
            // Reload artwork data
            $artwork = $handler->get_artwork($artwork_id);
        } else {
            $error = $result['message'];
        }
    }
}
?>

<div class="wrap cdbt-artwork-admin">
    <h1><?php _e('Edit Artwork', CDBT_TEXT_DOMAIN); ?></h1>
    
    <?php if (isset($success)): ?>
        <div class="notice notice-success is-dismissible">
            <p><?php echo $success; ?></p>
        </div>
    <?php endif; ?>
    
    <?php if (isset($error)): ?>
        <div class="notice notice-error is-dismissible">
            <p><?php echo $error; ?></p>
        </div>
    <?php endif; ?>
    
    <form method="post" enctype="multipart/form-data" class="cdbt-artwork-form">
        <?php wp_nonce_field('cdbt_update_artwork_action', 'cdbt_update_artwork_nonce'); ?>
        
        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="artwork_title">
                        <?php _e('Artwork Title', CDBT_TEXT_DOMAIN); ?> *
                    </label>
                </th>
                <td>
                    <input type="text" 
                           name="artwork_title" 
                           id="artwork_title" 
                           class="regular-text" 
                           required
                           value="<?php echo esc_attr($artwork->title); ?>">
                    <p class="description">
                        <?php _e('Enter a descriptive title for this artwork', CDBT_TEXT_DOMAIN); ?>
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <?php _e('Current Image', CDBT_TEXT_DOMAIN); ?>
                </th>
                <td>
                    <img src="<?php echo esc_url($artwork->image_url); ?>" 
                         alt="<?php echo esc_attr($artwork->title); ?>" 
                         style="max-width: 300px; max-height: 300px; border: 1px solid #ddd; padding: 5px;">
                    <p class="description">
                        <?php echo $artwork->dimensions; ?> | 
                        <?php 
                        $size = $artwork->file_size;
                        if ($size >= 1048576) {
                            echo number_format($size / 1048576, 2) . ' MB';
                        } elseif ($size >= 1024) {
                            echo number_format($size / 1024, 2) . ' KB';
                        } else {
                            echo $size . ' B';
                        }
                        ?>
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="artwork_image">
                        <?php _e('Replace Image', CDBT_TEXT_DOMAIN); ?>
                    </label>
                </th>
                <td>
                    <input type="file" 
                           name="artwork_image" 
                           id="artwork_image" 
                           accept="image/jpeg,image/jpg,image/png,image/gif">
                    <p class="description">
                        <?php _e('Leave empty to keep current image. Allowed formats: JPG, PNG, GIF. Maximum file size: 5MB', CDBT_TEXT_DOMAIN); ?>
                    </p>
                    
                    <!-- Image preview -->
                    <div id="image-preview" style="margin-top: 15px; display: none;">
                        <strong><?php _e('New Image Preview:', CDBT_TEXT_DOMAIN); ?></strong><br>
                        <img id="preview-img" src="" alt="Preview" style="max-width: 300px; max-height: 300px; border: 1px solid #ddd; padding: 5px; margin-top: 10px;">
                    </div>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="display_order">
                        <?php _e('Display Order', CDBT_TEXT_DOMAIN); ?>
                    </label>
                </th>
                <td>
                    <input type="number" 
                           name="display_order" 
                           id="display_order" 
                           class="small-text" 
                           value="<?php echo esc_attr($artwork->display_order); ?>"
                           min="0">
                    <p class="description">
                        <?php _e('Lower numbers appear first. Default is 0.', CDBT_TEXT_DOMAIN); ?>
                    </p>
                </td>
            </tr>
        </table>
        
        <p class="submit">
            <input type="submit" 
                   name="cdbt_update_artwork" 
                   class="button button-primary" 
                   value="<?php _e('Update Artwork', CDBT_TEXT_DOMAIN); ?>">
            <a href="<?php echo admin_url('admin.php?page=cdbt-artworks'); ?>" 
               class="button">
                <?php _e('Cancel', CDBT_TEXT_DOMAIN); ?>
            </a>
        </p>
    </form>
</div>

<script>
jQuery(document).ready(function($) {
    // Image preview
    $('#artwork_image').on('change', function(e) {
        var file = e.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                $('#preview-img').attr('src', e.target.result);
                $('#image-preview').show();
            };
            reader.readAsDataURL(file);
        } else {
            $('#image-preview').hide();
        }
    });
    
    // Form validation
    $('form.cdbt-artwork-form').on('submit', function(e) {
        var title = $('#artwork_title').val().trim();
        var file = $('#artwork_image')[0].files[0];
        
        if (!title) {
            alert('<?php _e('Please enter artwork title.', CDBT_TEXT_DOMAIN); ?>');
            e.preventDefault();
            return false;
        }
        
        // If new file selected, validate it
        if (file) {
            // Check file size
            var maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                alert('<?php _e('File size too large. Maximum 5MB allowed.', CDBT_TEXT_DOMAIN); ?>');
                e.preventDefault();
                return false;
            }
            
            // Check file type
            var allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (allowedTypes.indexOf(file.type) === -1) {
                alert('<?php _e('Invalid file type. Only JPG, PNG, GIF allowed.', CDBT_TEXT_DOMAIN); ?>');
                e.preventDefault();
                return false;
            }
        }
        
        return true;
    });
});
</script>

<style>
.cdbt-artwork-form {
    background: #fff;
    padding: 20px;
    margin-top: 20px;
    border: 1px solid #c3c4c7;
}

.cdbt-artwork-form .form-table th {
    width: 200px;
}

#image-preview {
    background: #f6f7f7;
    padding: 10px;
    border-radius: 4px;
}

#preview-img {
    border-radius: 4px;
}
</style>
