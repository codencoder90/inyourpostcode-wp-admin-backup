// Simple debug script to test variation_id issue
console.log('DEBUG: Variation debug script loaded');

jQuery(document).ready(function($) {
    console.log('DEBUG: jQuery ready');
    
    // Override the add to cart function
    $(document).on('click', '#cdbt-add-to-cart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('DEBUG: Add to cart clicked - intercepted');
        
        // Get variation ID from form
        var variationId = $('#cdbt-variation-id').val();
        console.log('DEBUG: Variation ID from form:', variationId);
        
        // Check if it's a variable product
        var isVariable = typeof cdbtDesignData !== 'undefined' && cdbtDesignData.isVariable;
        console.log('DEBUG: Is variable product:', isVariable);
        
        // Force variation_id to be included
        var testData = {
            action: 'cdbt_add_to_cart',
            nonce: cdbt_ajax.nonce,
            product_id: typeof cdbtDesignData !== 'undefined' ? cdbtDesignData.productId : 'unknown',
            variation_id: variationId || '0',
            customization_data: '{"test": "data"}'
        };
        
        console.log('DEBUG: Test AJAX data:', testData);
        
        // Show alert with data
        alert('DEBUG: Check console for AJAX data. Variation ID: ' + (variationId || '0'));
        
        return false;
    });
});