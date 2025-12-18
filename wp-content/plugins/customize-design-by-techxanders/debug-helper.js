// CDBT Debug Helper - Add this to browser console to debug issues
// Copy and paste this entire script into your browser's console on the product page

console.log('=== CDBT Debug Helper Started ===');

// Check if jQuery is available
if (typeof jQuery === 'undefined') {
    console.error('jQuery is not loaded!');
} else {
    console.log('✓ jQuery is available');
}

// Check for design button
var $designButton = jQuery('#cdbt-design-button');
console.log('Design button found:', $designButton.length);
if ($designButton.length > 0) {
    console.log('Design button classes:', $designButton.attr('class'));
    console.log('Design button href:', $designButton.attr('href'));
    console.log('Design button data-product-id:', $designButton.data('product-id'));
}

// Check for variation form
var $variationForm = jQuery('.variations_form');
console.log('Variation form found:', $variationForm.length);
if ($variationForm.length === 0) {
    // Try alternative selectors
    $variationForm = jQuery('form.cart, .single_variation_wrap').closest('form');
    console.log('Alternative variation form found:', $variationForm.length);
}

if ($variationForm.length > 0) {
    console.log('Variation form classes:', $variationForm.attr('class'));
    
    // Check for variation selects
    var $selects = $variationForm.find('select[name^="attribute_"]');
    console.log('Variation selects found:', $selects.length);
    
    $selects.each(function(index) {
        var $select = jQuery(this);
        console.log('Select ' + index + ':', {
            name: $select.attr('name'),
            value: $select.val(),
            options: $select.find('option').length
        });
    });
    
    // Check for variation ID input
    var $variationIdInput = $variationForm.find('input[name="variation_id"]');
    console.log('Variation ID input found:', $variationIdInput.length);
    if ($variationIdInput.length > 0) {
        console.log('Current variation ID:', $variationIdInput.val());
    }
    
    // Check for product variations data
    var variations = $variationForm.data('product_variations');
    console.log('Product variations data available:', variations ? 'Yes (' + variations.length + ' variations)' : 'No');
}

// Check for add to cart button
var $addToCartButton = jQuery('button[name="add-to-cart"], input[name="add-to-cart"], .single_add_to_cart_button');
console.log('Add to cart buttons found:', $addToCartButton.length);

// Check for WooCommerce
if (typeof wc_add_to_cart_params !== 'undefined') {
    console.log('✓ WooCommerce add to cart params available');
} else {
    console.log('⚠ WooCommerce add to cart params not found');
}

// Test variation change detection
if ($variationForm.length > 0) {
    console.log('Setting up test variation change listener...');
    $variationForm.on('found_variation.debug', function(event, variation) {
        console.log('🎯 Variation found event triggered:', variation);
    });
    
    $variationForm.on('reset_data.debug', function() {
        console.log('🔄 Reset data event triggered');
    });
    
    $variationForm.on('change.debug', 'select[name^="attribute_"]', function() {
        console.log('📝 Manual variation change detected on:', jQuery(this).attr('name'), 'Value:', jQuery(this).val());
    });
}

console.log('=== CDBT Debug Helper Setup Complete ===');
console.log('Now try selecting variations and watch the console for debug messages.');