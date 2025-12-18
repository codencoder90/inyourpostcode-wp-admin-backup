<?php
/**
 * Artwork Handler Class
 * 
 * Purpose: Handle all artwork CRUD operations
 * Artwork کے لیے add, edit, delete, list operations
 * 
 * @package CustomizeDesignByTechXanders
 * @version 1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class CDBT_Artwork_Handler {
    
    private $table_name;
    private $upload_dir;
    
    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'cdbt_artworks';
        
        // Set upload directory
        $upload = wp_upload_dir();
        $this->upload_dir = $upload['basedir'] . '/cdbt-artworks';
        
        // Create upload directory if not exists
        if (!file_exists($this->upload_dir)) {
            wp_mkdir_p($this->upload_dir);
        }
    }
    
    /**
     * Get all artworks
     * سب artworks کو fetch کرنا
     */
    public function get_all_artworks($status = 'active') {
        global $wpdb;
        
        $where = '';
        if ($status) {
            $where = $wpdb->prepare("WHERE status = %s", $status);
        }
        
        $query = "SELECT * FROM {$this->table_name} $where ORDER BY display_order ASC, id DESC";
        $results = $wpdb->get_results($query);
        
        return $results;
    }
    
    /**
     * Get single artwork by ID
     */
    public function get_artwork($id) {
        global $wpdb;
        
        $query = $wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d",
            $id
        );
        
        return $wpdb->get_row($query);
    }
    
    /**
     * Add new artwork
     * نیا artwork add کرنا
     */
    public function add_artwork($data, $file) {
        global $wpdb;
        
        // Validate file
        $allowed_types = array('image/jpeg', 'image/jpg', 'image/png', 'image/gif');
        if (!in_array($file['type'], $allowed_types)) {
            return array(
                'success' => false,
                'message' => 'Invalid file type. Only JPG, PNG, GIF allowed.'
            );
        }
        
        // Check file size (5MB max)
        $max_size = 5 * 1024 * 1024; // 5MB
        if ($file['size'] > $max_size) {
            return array(
                'success' => false,
                'message' => 'File size too large. Maximum 5MB allowed.'
            );
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'artwork_' . time() . '_' . wp_generate_password(8, false) . '.' . $extension;
        $filepath = $this->upload_dir . '/' . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return array(
                'success' => false,
                'message' => 'Failed to upload file.'
            );
        }
        
        // Get image dimensions
        $image_info = getimagesize($filepath);
        $dimensions = $image_info[0] . 'x' . $image_info[1];
        
        // Generate thumbnail
        $thumbnail_path = $this->generate_thumbnail($filepath, $filename);
        
        // Get URLs
        $upload = wp_upload_dir();
        $image_url = $upload['baseurl'] . '/cdbt-artworks/' . $filename;
        $thumbnail_url = $thumbnail_path ? $upload['baseurl'] . '/cdbt-artworks/thumbs/' . basename($thumbnail_path) : $image_url;
        
        // Insert into database
        $result = $wpdb->insert(
            $this->table_name,
            array(
                'title' => sanitize_text_field($data['title']),
                'image_url' => $image_url,
                'thumbnail_url' => $thumbnail_url,
                'file_name' => $filename,
                'file_size' => $file['size'],
                'dimensions' => $dimensions,
                'mime_type' => $file['type'],
                'status' => 'active',
                'display_order' => isset($data['display_order']) ? intval($data['display_order']) : 0
            ),
            array('%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%d')
        );
        
        if ($result) {
            return array(
                'success' => true,
                'message' => 'Artwork added successfully!',
                'id' => $wpdb->insert_id
            );
        } else {
            // Delete uploaded file if database insert failed
            unlink($filepath);
            if ($thumbnail_path && file_exists($thumbnail_path)) {
                unlink($thumbnail_path);
            }
            
            return array(
                'success' => false,
                'message' => 'Failed to save artwork to database.'
            );
        }
    }
    
    /**
     * Update artwork
     * Artwork کو update کرنا
     */
    public function update_artwork($id, $data, $file = null) {
        global $wpdb;
        
        $artwork = $this->get_artwork($id);
        if (!$artwork) {
            return array(
                'success' => false,
                'message' => 'Artwork not found.'
            );
        }
        
        $update_data = array(
            'title' => sanitize_text_field($data['title']),
            'display_order' => isset($data['display_order']) ? intval($data['display_order']) : 0
        );
        
        // If new file uploaded
        if ($file && $file['size'] > 0) {
            // Validate and upload new file
            $upload_result = $this->upload_new_image($file);
            
            if (!$upload_result['success']) {
                return $upload_result;
            }
            
            // Delete old files
            $this->delete_artwork_files($artwork);
            
            // Add new file data
            $update_data['image_url'] = $upload_result['image_url'];
            $update_data['thumbnail_url'] = $upload_result['thumbnail_url'];
            $update_data['file_name'] = $upload_result['filename'];
            $update_data['file_size'] = $file['size'];
            $update_data['dimensions'] = $upload_result['dimensions'];
            $update_data['mime_type'] = $file['type'];
        }
        
        // Update database
        $result = $wpdb->update(
            $this->table_name,
            $update_data,
            array('id' => $id),
            array('%s', '%d'),
            array('%d')
        );
        
        if ($result !== false) {
            return array(
                'success' => true,
                'message' => 'Artwork updated successfully!'
            );
        } else {
            return array(
                'success' => false,
                'message' => 'Failed to update artwork.'
            );
        }
    }
    
    /**
     * Delete artwork
     * Artwork کو delete کرنا
     */
    public function delete_artwork($id) {
        global $wpdb;
        
        $artwork = $this->get_artwork($id);
        if (!$artwork) {
            return array(
                'success' => false,
                'message' => 'Artwork not found.'
            );
        }
        
        // Delete files
        $this->delete_artwork_files($artwork);
        
        // Delete from database
        $result = $wpdb->delete(
            $this->table_name,
            array('id' => $id),
            array('%d')
        );
        
        if ($result) {
            return array(
                'success' => true,
                'message' => 'Artwork deleted successfully!'
            );
        } else {
            return array(
                'success' => false,
                'message' => 'Failed to delete artwork.'
            );
        }
    }
    
    /**
     * Generate thumbnail
     * Thumbnail بنانا (300x300)
     */
    private function generate_thumbnail($filepath, $filename) {
        $thumb_dir = $this->upload_dir . '/thumbs';
        if (!file_exists($thumb_dir)) {
            wp_mkdir_p($thumb_dir);
        }
        
        $thumb_path = $thumb_dir . '/thumb_' . $filename;
        
        // Use WordPress image editor
        $image = wp_get_image_editor($filepath);
        
        if (!is_wp_error($image)) {
            $image->resize(300, 300, true);
            $image->save($thumb_path);
            return $thumb_path;
        }
        
        return false;
    }
    
    /**
     * Upload new image (helper for update)
     */
    private function upload_new_image($file) {
        // Similar to add_artwork but returns array with file info
        $allowed_types = array('image/jpeg', 'image/jpg', 'image/png', 'image/gif');
        if (!in_array($file['type'], $allowed_types)) {
            return array('success' => false, 'message' => 'Invalid file type.');
        }
        
        $max_size = 5 * 1024 * 1024;
        if ($file['size'] > $max_size) {
            return array('success' => false, 'message' => 'File too large.');
        }
        
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'artwork_' . time() . '_' . wp_generate_password(8, false) . '.' . $extension;
        $filepath = $this->upload_dir . '/' . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return array('success' => false, 'message' => 'Upload failed.');
        }
        
        $image_info = getimagesize($filepath);
        $dimensions = $image_info[0] . 'x' . $image_info[1];
        
        $thumbnail_path = $this->generate_thumbnail($filepath, $filename);
        
        $upload = wp_upload_dir();
        $image_url = $upload['baseurl'] . '/cdbt-artworks/' . $filename;
        $thumbnail_url = $thumbnail_path ? $upload['baseurl'] . '/cdbt-artworks/thumbs/' . basename($thumbnail_path) : $image_url;
        
        return array(
            'success' => true,
            'filename' => $filename,
            'image_url' => $image_url,
            'thumbnail_url' => $thumbnail_url,
            'dimensions' => $dimensions
        );
    }
    
    /**
     * Delete artwork files
     */
    private function delete_artwork_files($artwork) {
        // Delete main image
        $upload = wp_upload_dir();
        $main_file = str_replace($upload['baseurl'] . '/cdbt-artworks/', $this->upload_dir . '/', $artwork->image_url);
        if (file_exists($main_file)) {
            unlink($main_file);
        }
        
        // Delete thumbnail
        if ($artwork->thumbnail_url) {
            $thumb_file = str_replace($upload['baseurl'] . '/cdbt-artworks/', $this->upload_dir . '/', $artwork->thumbnail_url);
            if (file_exists($thumb_file)) {
                unlink($thumb_file);
            }
        }
    }
}
