// Ultra-simple version that just works
jQuery(document).ready(function($) {
    
    var $designButton = $('#cdbt-design-button');
    
    if ($designButton.length === 0) {
        return; // No design button found
    }
    
    var productId = $designButton.data('product-id');
    console.log('CDBT: Found design button for product:', productId);
    
    // If button is not disabled, it's a simple product - nothing to do
    if (!$designButton.hasClass('disabled')) {
        console.log('CDBT: Simple product, button already enabled');
        return;
    }
    
    console.log('CDBT: Variable product detected, setting up handlers');
    
    // Function to enable button
    function enableDesignButton(variationId) {
        var url = window.location.origin + '/customize-design/' + productId + '/';
        if (variationId && variationId > 0) {
            url += '?variation_id=' + variationId;
        }
        
        $designButton.removeClass('disabled')
            .attr('href', url)
            .off('click.disabled');
        $('.cdbt-variation-notice').hide();
        
        console.log('CDBT: Design button enabled:', url);
    }
    
    // Function to disable button
    function disableDesignButton() {
        $designButton.addClass('disabled')
            .attr('href', '#')
            .on('click.disabled', function(e) {
                e.preventDefault();
                return false;
            });
        $('.cdbt-variation-notice').show();
        
        console.log('CDBT: Design button disabled');
    }
    
    // Method 1: Listen for WooCommerce variation events
    $(document).on('found_variation', function(event, variation) {
        console.log('CDBT: WooCommerce variation found:', variation);
        if (variation && variation.variation_id) {
            enableDesignButton(variation.variation_id);
        }
    });
    
    $(document).on('reset_data', function() {
        console.log('CDBT: WooCommerce variation reset');
        disableDesignButton();
    });
    
    // Method 2: Simple approach - watch for any change in variation selects
    $(document).on('change', 'select[name^="attribute_"]', function() {
        var $this = $(this);
        console.log('CDBT: Variation changed:', $this.attr('name'), '=', $this.val());
        
        // Small delay to let WooCommerce process
        setTimeout(function() {
            var allSelected = true;
            
            // Check if all variation selects have values
            $('select[name^="attribute_"]').each(function() {
                if (!$(this).val() || $(this).val() === '') {
                    allSelected = false;
                    return false;
                }
            });
            
            if (allSelected) {
                // Try to get the actual variation ID
                var $variationInput = $('input[name="variation_id"]');
                var variationId = $variationInput.length ? $variationInput.val() : null;
                
                if (variationId && variationId > 0) {
                    console.log('CDBT: Using real variation ID:', variationId);
                    enableDesignButton(variationId);
                } else {
                    console.log('CDBT: Using fallback - all variations selected');
                    enableDesignButton(1); // Fallback ID
                }
            } else {
                disableDesignButton();
            }
        }, 300);
    });
    
    // Method 3: Ultra-simple fallback - enable button after 2 seconds if variations exist
    setTimeout(function() {
        if ($('select[name^="attribute_"]').length > 0) {
            console.log('CDBT: Fallback check - enabling button if variations are selected');
            
            var allSelected = true;
            $('select[name^="attribute_"]').each(function() {
                if (!$(this).val() || $(this).val() === '') {
                    allSelected = false;
                    return false;
                }
            });
            
            if (allSelected) {
                console.log('CDBT: Fallback - enabling button');
                enableDesignButton(1);
            }
        }
    }, 2000);
    
    console.log('CDBT: Setup complete');
});