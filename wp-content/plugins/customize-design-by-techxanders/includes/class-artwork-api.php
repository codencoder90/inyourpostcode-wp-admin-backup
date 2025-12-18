<?php
/**
 * Artwork REST API
 * 
 * Purpose: Provide REST API endpoint for frontend to fetch artworks
 * Frontend کے لیے artworks fetch کرنے کا API
 * 
 * Endpoint: /wp-json/cdbt/v1/artworks
 * 
 * @package CustomizeDesignByTechXanders
 * @version 1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class CDBT_Artwork_API {
    
    private $handler;
    
    public function __construct() {
        $this->handler = new CDBT_Artwork_Handler();
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    /**
     * Register REST API routes
     */
    public function register_routes() {
        register_rest_route('cdbt/v1', '/artworks', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_artworks'),
            'permission_callback' => '__return_true' // Public access
        ));
        
        register_rest_route('cdbt/v1', '/artworks/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_single_artwork'),
            'permission_callback' => '__return_true'
        ));
    }
    
    /**
     * Get all artworks endpoint
     * GET /wp-json/cdbt/v1/artworks
     */
    public function get_artworks($request) {
        $artworks = $this->handler->get_all_artworks('active');
        
        if (empty($artworks)) {
            return new WP_REST_Response(array(
                'success' => true,
                'data' => array(),
                'message' => 'No artworks found'
            ), 200);
        }
        
        // Format response
        $formatted = array();
        foreach ($artworks as $artwork) {
            $formatted[] = array(
                'id' => (int) $artwork->id,
                'title' => $artwork->title,
                'image_url' => $artwork->image_url,
                'thumbnail_url' => $artwork->thumbnail_url,
                'dimensions' => $artwork->dimensions,
                'file_size' => $this->format_file_size($artwork->file_size)
            );
        }
        
        return new WP_REST_Response(array(
            'success' => true,
            'data' => $formatted,
            'count' => count($formatted)
        ), 200);
    }
    
    /**
     * Get single artwork endpoint
     * GET /wp-json/cdbt/v1/artworks/{id}
     */
    public function get_single_artwork($request) {
        $id = $request->get_param('id');
        $artwork = $this->handler->get_artwork($id);
        
        if (!$artwork) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Artwork not found'
            ), 404);
        }
        
        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'id' => (int) $artwork->id,
                'title' => $artwork->title,
                'image_url' => $artwork->image_url,
                'thumbnail_url' => $artwork->thumbnail_url,
                'dimensions' => $artwork->dimensions,
                'file_size' => $this->format_file_size($artwork->file_size)
            )
        ), 200);
    }
    
    /**
     * Format file size
     */
    private function format_file_size($bytes) {
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' B';
        }
    }
}

// Initialize API
new CDBT_Artwork_API();
