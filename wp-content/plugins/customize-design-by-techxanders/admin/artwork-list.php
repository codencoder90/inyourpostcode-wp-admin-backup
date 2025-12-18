<?php
/**
 * Admin Artwork List Page
 * 
 * Purpose: Display all artworks in admin with edit/delete options
 * Admin میں سب artworks کی list دیکھنا
 * 
 * @package CustomizeDesignByTechXanders
 * @version 1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// Handle delete action
if (isset($_GET['action']) && $_GET['action'] === 'delete' && isset($_GET['id'])) {
    check_admin_referer('delete_artwork_' . $_GET['id']);
    
    $handler = new CDBT_Artwork_Handler();
    $result = $handler->delete_artwork($_GET['id']);
    
    if ($result['success']) {
        echo '<div class="notice notice-success is-dismissible"><p>' . $result['message'] . '</p></div>';
    } else {
        echo '<div class="notice notice-error is-dismissible"><p>' . $result['message'] . '</p></div>';
    }
}

// Get all artworks
$handler = new CDBT_Artwork_Handler();
$artworks = $handler->get_all_artworks();
?>

<div class="wrap cdbt-artwork-admin">
    <h1 class="wp-heading-inline">
        <?php _e('Manage Artworks', CDBT_TEXT_DOMAIN); ?>
    </h1>
    <a href="<?php echo admin_url('admin.php?page=cdbt-artwork-add'); ?>" class="page-title-action">
        <?php _e('Add New', CDBT_TEXT_DOMAIN); ?>
    </a>
    <hr class="wp-header-end">
    
    <?php if (empty($artworks)): ?>
        <div class="cdbt-no-artworks">
            <p><?php _e('No artworks found. Add your first artwork!', CDBT_TEXT_DOMAIN); ?></p>
            <a href="<?php echo admin_url('admin.php?page=cdbt-artwork-add'); ?>" class="button button-primary">
                <?php _e('Add New Artwork', CDBT_TEXT_DOMAIN); ?>
            </a>
        </div>
    <?php else: ?>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th class="column-thumbnail"><?php _e('Thumbnail', CDBT_TEXT_DOMAIN); ?></th>
                    <th class="column-title"><?php _e('Title', CDBT_TEXT_DOMAIN); ?></th>
                    <th class="column-dimensions"><?php _e('Dimensions', CDBT_TEXT_DOMAIN); ?></th>
                    <th class="column-filesize"><?php _e('File Size', CDBT_TEXT_DOMAIN); ?></th>
                    <th class="column-date"><?php _e('Created', CDBT_TEXT_DOMAIN); ?></th>
                    <th class="column-actions"><?php _e('Actions', CDBT_TEXT_DOMAIN); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($artworks as $artwork): ?>
                    <tr>
                        <td class="column-thumbnail">
                            <img src="<?php echo esc_url($artwork->thumbnail_url); ?>" 
                                 alt="<?php echo esc_attr($artwork->title); ?>" 
                                 style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
                        </td>
                        <td class="column-title">
                            <strong><?php echo esc_html($artwork->title); ?></strong>
                        </td>
                        <td class="column-dimensions">
                            <?php echo esc_html($artwork->dimensions); ?>
                        </td>
                        <td class="column-filesize">
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
                        </td>
                        <td class="column-date">
                            <?php echo date('M j, Y', strtotime($artwork->created_at)); ?>
                        </td>
                        <td class="column-actions">
                            <a href="<?php echo admin_url('admin.php?page=cdbt-artwork-edit&id=' . $artwork->id); ?>" 
                               class="button button-small">
                                <?php _e('Edit', CDBT_TEXT_DOMAIN); ?>
                            </a>
                            <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=cdbt-artworks&action=delete&id=' . $artwork->id), 'delete_artwork_' . $artwork->id); ?>" 
                               class="button button-small button-link-delete"
                               onclick="return confirm('<?php _e('Are you sure you want to delete this artwork?', CDBT_TEXT_DOMAIN); ?>');">
                                <?php _e('Delete', CDBT_TEXT_DOMAIN); ?>
                            </a>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>

<style>
.cdbt-artwork-admin {
    margin: 20px 20px 0 0;
}

.cdbt-no-artworks {
    background: #fff;
    border: 1px solid #c3c4c7;
    padding: 40px;
    text-align: center;
    margin-top: 20px;
}

.cdbt-no-artworks p {
    font-size: 16px;
    margin-bottom: 20px;
    color: #646970;
}

.wp-list-table .column-thumbnail {
    width: 80px;
}

.wp-list-table .column-title {
    width: 30%;
}

.wp-list-table .column-dimensions {
    width: 120px;
}

.wp-list-table .column-filesize {
    width: 100px;
}

.wp-list-table .column-date {
    width: 120px;
}

.wp-list-table .column-actions {
    width: 180px;
}

.button-link-delete {
    color: #b32d2e;
}

.button-link-delete:hover {
    color: #dc3232;
    border-color: #dc3232;
}
</style>
