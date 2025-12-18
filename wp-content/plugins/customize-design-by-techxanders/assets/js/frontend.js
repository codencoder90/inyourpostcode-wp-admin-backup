// CDBT Frontend JS - Version 2.2 - VARIATION FIX (with transform handles)
console.log('CDBT: Frontend JavaScript loaded - Version 12.12 - MOBILE ARTWORK FIX');
console.log('🔍 V12.12 - Mobile artwork click fix');
var selectedArtwork = null;
var artworksList = [];
var isArtworkLoaded = false;
// Main canvas variables (needed by artwork functions)
var canvas = null;
var uploadedImages = [];
var selectedTextElement = null;
// V12.12: Global canvas dimensions for artwork functions
var canvasCssWidth = 600;
var canvasCssHeight = 400;
// Logical shirt area (in canvas coordinates); updated in initCanvas
var shirtBounds = { x: 0, y: 0, w: 0, h: 0 };

// V12.12: Global artwork click handler for mobile compatibility
window.handleArtworkClick = function(artworkId, event) {
    console.log('📱 V12.12: Global artwork click:', artworkId);
    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Check if canvas exists
    if (!canvas) {
        console.error('❌ Canvas not initialized yet');
        alert('Please wait for canvas to load');
        return;
    }
    
    // Check if already has image
    if (uploadedImages && uploadedImages.length > 0) {
        console.log('⚠️ V12.12: Image already on canvas');
        alert('Delete existing image first before adding artwork.');
        return;
    }
    
    // Find artwork data
    var artworkData = artworksList.find(function(art) {
        return art.id == artworkId;
    });
    
    if (!artworkData) {
        console.error('❌ Artwork not found:', artworkId);
        alert('Artwork not found. Please refresh the page.');
        return;
    }
    
    console.log('✅ V12.12: Adding artwork:', artworkData.title);
    
    // Call the addArtworkToCanvas function
    if (typeof addArtworkToCanvas === 'function') {
        addArtworkToCanvas(artworkData);
    } else {
        console.error('❌ addArtworkToCanvas function not found');
        alert('Error adding artwork. Please refresh.');
    }
};

function loadArtworks() {
    console.log('🎨 Loading artworks...');
    
    // Show loading state
    $('#cdbt-artwork-grid-container').html(`
        <div class="cdbt-artwork-loading">
            <div class="cdbt-artwork-loader"></div>
            <p>Loading artworks...</p>
        </div>
    `);
    
    // Fetch from REST API
    $.ajax({
        url: '/wp-json/cdbt/v1/artworks',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            console.log('✅ Artworks loaded:', response);
            
            if (response.success && response.data && response.data.length > 0) {
                artworksList = response.data;
                displayArtworks(response.data);
                isArtworkLoaded = true;
            } else {
                displayEmptyArtworks();
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Failed to load artworks:', error);
            console.log('Response:', xhr.responseText);
            displayArtworkError();
        }
    });
}

/**
 * Display artworks in grid
 */
function displayArtworks(artworks) {
    console.log('🖼️ Displaying artworks:', artworks.length);
    
    // V12 FIX: Check CURRENT SIDE's state only (not global)
    var currentSide = 'front';
    if (typeof window.designStates !== 'undefined' && window.designStates.currentSide) {
        currentSide = window.designStates.currentSide;
    }
    console.log('DEBUG - Current side:', currentSide);
    
    // DEBUG: Check current state
    console.log('DEBUG - uploadedImages:', uploadedImages);
    console.log('DEBUG - uploadedImages length:', uploadedImages ? uploadedImages.length : 'undefined');
    console.log('DEBUG - selectedTextElement:', selectedTextElement);
    console.log('DEBUG - canvas:', canvas);
    console.log('DEBUG - canvas.selectedImageElement:', canvas ? canvas.selectedImageElement : 'canvas is null');
    
    // V12 FIX: Check CURRENT canvas only (which is the current side)
    // 1. Check uploadedImages array (current side's images)
    var hasUpload = (typeof uploadedImages !== 'undefined' && uploadedImages && Array.isArray(uploadedImages) && uploadedImages.length > 0);
    
    // 2. Check selectedTextElement (current side's text)
    var hasText = (typeof selectedTextElement !== 'undefined' && selectedTextElement !== null);
    
    // 3. Check canvas.selectedImageElement (if canvas exists)
    var hasCanvasImage = false;
    if (typeof canvas !== 'undefined' && canvas && canvas.selectedImageElement) {
        hasCanvasImage = true;
    }
    
    // V12 FIX: Only disable if CURRENT SIDE has upload OR selected element
    var shouldDisable = hasUpload || hasText || hasCanvasImage;
    
    console.log('DEBUG - hasUpload:', hasUpload, '| hasText:', hasText, '| hasCanvasImage:', hasCanvasImage, '| shouldDisable:', shouldDisable);
    
    if (shouldDisable) {
        console.log('🔒 Artwork DISABLED for', currentSide, 'side');
        if (hasUpload) console.log('  Reason: hasUpload =', hasUpload, '- Images:', uploadedImages.length);
        if (hasText) console.log('  Reason: hasText =', hasText);
        if (hasCanvasImage) console.log('  Reason: hasCanvasImage =', hasCanvasImage);
    } else {
        console.log('🔓 Artwork ENABLED for', currentSide, 'side');
    }
    
    // Show/hide disabled message
    if (shouldDisable) {
        $('#cdbt-artwork-disabled-message').show();
        // V12.2 FIX: Also disable Upload Image button
        $('#cdbt-upload-image').prop('disabled', true).css('opacity', '0.5').css('cursor', 'not-allowed');
        console.log('🔒 V12.2: Upload button DISABLED');
    } else {
        $('#cdbt-artwork-disabled-message').hide();
        // V12.2 FIX: Also enable Upload Image button
        $('#cdbt-upload-image').prop('disabled', false).css('opacity', '1').css('cursor', 'pointer');
        console.log('🔓 V12.2: Upload button ENABLED');
    }
    
    // Build grid HTML
    var html = '<div class="cdbt-artwork-grid">';
    
    artworks.forEach(function(artwork) {
        var isDisabled = shouldDisable ? 'disabled' : '';
        var isSelected = (selectedArtwork && selectedArtwork.id === artwork.id) ? 'selected' : '';
        
        // V12.12: Add onclick directly for mobile compatibility
        html += '<div class="cdbt-artwork-item ' + isDisabled + ' ' + isSelected + '" data-artwork-id="' + artwork.id + '" onclick="window.handleArtworkClick(' + artwork.id + ', event)">';
        html += '  <img src="' + artwork.thumbnail_url + '" alt="' + artwork.title + '" class="cdbt-artwork-image" />';
        html += '  <div class="cdbt-artwork-overlay">';
        html += '    <h4 class="cdbt-artwork-title">' + artwork.title + '</h4>';
        html += '    <p class="cdbt-artwork-dimensions">' + artwork.dimensions + '</p>';
        html += '  </div>';
        html += '  <div class="cdbt-artwork-click-hint">';
        html += '    <span>Click to Use</span>';
        html += '  </div>';
        html += '  <div class="cdbt-artwork-selected-badge">✓ Selected</div>';
        html += '</div>';
    });
    
    html += '</div>';
    
    // Update container
    $('#cdbt-artwork-grid-container').html(html);
    
    // Update count
    $('#cdbt-artwork-count').text(artworks.length + ' artwork(s) available');
    
    console.log('✅ Artworks displayed successfully');
}

/**
 * Display empty state
 */
function displayEmptyArtworks() {
    console.log('ℹ️ No artworks found');
    
    var html = '<div class="cdbt-artwork-empty">';
    html += '  <div class="cdbt-artwork-empty-icon">🎨</div>';
    html += '  <h3>No Artworks Available</h3>';
    html += '  <p>No artworks have been added yet.</p>';
    html += '  <p class="cdbt-artwork-empty-hint">Contact admin to add artworks.</p>';
    html += '</div>';
    
    $('#cdbt-artwork-grid-container').html(html);
    $('#cdbt-artwork-count').text('0 artworks');
}

/**
 * Display error state
 */
function displayArtworkError() {
    console.error('❌ Error loading artworks');
    
    var html = '<div class="cdbt-artwork-empty cdbt-artwork-error">';
    html += '  <div class="cdbt-artwork-empty-icon">⚠️</div>';
    html += '  <h3>Failed to Load Artworks</h3>';
    html += '  <p>There was an error loading artworks.</p>';
    html += '  <button onclick="loadArtworks()" class="cdbt-retry-button">Retry</button>';
    html += '</div>';
    
    $('#cdbt-artwork-grid-container').html(html);
}

/**
 * Add artwork to canvas
 */
function addArtworkToCanvas(artworkData) {
    console.log('DEBUG: Adding artwork - Canvas:', canvas ? 'READY' : 'NOT READY');
    console.log('➕ Adding artwork to canvas:', artworkData);
    
    // V12.12: Check if ANY image already exists on canvas (artwork OR upload)
    if (uploadedImages && uploadedImages.length > 0) {
        alert('An image already exists on this side. Please delete the existing image first before adding a new one.');
        console.log('⚠️ V12.12: Image already exists on canvas, showing alert');
        return;
    }
    
    // V12.12: Get canvas dimensions with fallback
    var cWidth = (typeof canvasCssWidth !== 'undefined' && canvasCssWidth > 0) ? canvasCssWidth : (canvas ? canvas.width : 600);
    var cHeight = (typeof canvasCssHeight !== 'undefined' && canvasCssHeight > 0) ? canvasCssHeight : (canvas ? canvas.height : 400);
    
    console.log('📐 V12.12: Using canvas dimensions:', cWidth, 'x', cHeight);
    
    // Create image
    var img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
        console.log('✅ Artwork image loaded');
        
        // V12.12: Double-check inside onload (in case of race conditions)
        // Check if ANY image was added while this was loading
        if (uploadedImages && uploadedImages.length > 0) {
            console.log('⚠️ V12.12: Image already exists (race condition prevented)');
            return;
        }
        
        // V12.12: Re-get dimensions inside onload (they may have updated)
        var canvasW = (typeof canvasCssWidth !== 'undefined' && canvasCssWidth > 0) ? canvasCssWidth : (canvas ? canvas.width : 600);
        var canvasH = (typeof canvasCssHeight !== 'undefined' && canvasCssHeight > 0) ? canvasCssHeight : (canvas ? canvas.height : 400);
        
        // Calculate dimensions (max 60% of canvas) - use CSS dimensions
        var maxWidth = canvasW * 0.6;
        var maxHeight = canvasH * 0.6;
        var scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        
        var width = img.width * scale;
        var height = img.height * scale;
        
        // V12.12: Store natural (original) dimensions for quality reference
        var naturalWidth = img.naturalWidth || img.width;
        var naturalHeight = img.naturalHeight || img.height;
        
        // Create image element - use CSS dimensions for positioning
        var imgElement = {
            img: img,
            x: (canvasW - width) / 2,
            y: (canvasH - height) / 2,
            width: width,
            height: height,
            url: artworkData.image_url,
            artworkId: artworkData.id,
            artworkTitle: artworkData.title,
            rotation: 0,
            originalWidth: width,
            originalHeight: height,
            // V12.12: Store natural dimensions for quality scaling
            naturalWidth: naturalWidth,
            naturalHeight: naturalHeight
        };
        
        // Add to canvas
        uploadedImages.push(imgElement);
        canvas.selectedImageElement = imgElement;
        selectedTextElement = null;
        selectedArtwork = artworkData;
        
        // Update UI
        disableAddControls();
        if (typeof showDeleteControls === 'function') showDeleteControls('image', 'Artwork: ' + artworkData.title);
        if (typeof displayArtworks === 'function' && artworksList) displayArtworks(artworksList);
        if (typeof redrawCanvas === 'function') redrawCanvas();
        
        // V12.3 FIX: FORCE disable upload button after adding artwork (guaranteed)
        $('#cdbt-upload-image').prop('disabled', true).css('opacity', '0.5').css('cursor', 'not-allowed');
        console.log('🔒 V12.3: Upload button FORCE DISABLED after artwork add');
        
        // V12.12: Close sidebar on mobile after adding artwork
        $('.active-section').removeClass('active-section');
        console.log('📱 V12.12: Sidebar closed after artwork add');
        
        // FIX Problem A: Force canvas update after adding artwork
        setTimeout(function() {
            if (typeof redrawCanvas === 'function') redrawCanvas();
            // V12.3: Double-check disable after redraw
            $('#cdbt-upload-image').prop('disabled', true).css('opacity', '0.5').css('cursor', 'not-allowed');
            console.log('🔄 Canvas redrawn - artwork visible immediately');
        }, 50);
        
        console.log('✅ Artwork added to canvas successfully');
    };
    
    img.onerror = function() {
        console.error('❌ Failed to load artwork image');
        alert('Failed to load artwork image. Please try again.');
    };
    
    img.src = artworkData.image_url;
}


// ============================================================================
// UPDATE EXISTING FUNCTIONS
// ============================================================================

/**
 * UPDATE: disableAddControls() function
 * Add artwork disable logic
 * V12.12: Add Text is ALWAYS enabled - user can add multiple text elements
 */
function disableAddControls() {
    // Disable upload button only (not text)
    $('#cdbt-upload-image').prop('disabled', true).css('opacity', '0.5');
    // V12.12: DON'T disable add-text - user can always add text
    // $('#cdbt-add-text').prop('disabled', true).css('opacity', '0.5');
    
    // Disable artwork items
    $('.cdbt-artwork-item').addClass('disabled');
    $('#cdbt-artwork-disabled-message').show();
    
    console.log('🔒 Upload button DISABLED (Add Text still enabled)');
}

/**
 * UPDATE: enableAddControls() function
 * Add artwork enable logic
 */
function enableAddControls() {
    // Enable upload and text buttons
    $('#cdbt-upload-image').prop('disabled', false).css('opacity', '1');
    $('#cdbt-add-text').prop('disabled', false).css('opacity', '1');
    
    // Enable artwork items if no elements on canvas
    if (!selectedTextElement && (!uploadedImages || uploadedImages.length === 0)) {
        $('.cdbt-artwork-item').removeClass('disabled');
        $('#cdbt-artwork-disabled-message').hide();
    }
    
    console.log('🔓 Add/Upload buttons ENABLED');
}

jQuery(document).ready(function($) {
    
    // Design button is now always enabled - no complex variation handling needed
    console.log('CDBT: Design button functionality loaded');
    
    // Check if we're on the design page
    if ($('#cdbt-design-page').length === 0) {
        return; // Not on design page, exit
    }
    
    console.log('CDBT: Design page detected, initializing...');
    
    // Handle variations on design page (if variable product)
    if ($('#cdbt-product-variations').length > 0) {
        console.log('CDBT: Variable product on design page');
        console.log('CDBT: Available variations:', cdbtDesignData.variations);
        
        // Handle variation selection
        $(document).on('change', '.cdbt-variation-select', function() {
            var $this = $(this);
            console.log('CDBT: Design page variation changed:', $this.attr('name'), '=', $this.val());
            
            // Check if all variations are selected
            var allSelected = true;
            var selectedAttributes = {};
            
            $('.cdbt-variation-select').each(function() {
                var $select = $(this);
                var value = $select.val();
                
                if (!value || value === '') {
                    allSelected = false;
                    return false;
                }
                
                selectedAttributes[$select.attr('name')] = value;
            });
            
            if (allSelected) {
                console.log('CDBT: All variations selected:', selectedAttributes);
                
                // Find matching variation ID
                if (typeof cdbtDesignData !== 'undefined' && cdbtDesignData.variations) {
                    var matchingVariation = null;
                    
                    for (var i = 0; i < cdbtDesignData.variations.length; i++) {
                        var variation = cdbtDesignData.variations[i];
                        var matches = true;
                        
                        console.log('CDBT: Checking variation', i, ':', variation.variation_id, 'attributes:', variation.attributes);
                        
                        for (var attr in selectedAttributes) {
                            var attrKey = attr.replace('attribute_', '');
                            var variationAttrValue = variation.attributes['attribute_' + attrKey] || variation.attributes[attr];
                            
                            console.log('CDBT: Comparing', attr, ':', selectedAttributes[attr], 'vs variation attr:', variationAttrValue);
                            
                            if (variationAttrValue !== selectedAttributes[attr]) {
                                matches = false;
                                break;
                            }
                        }
                        
                        if (matches) {
                            matchingVariation = variation;
                            console.log('CDBT: FOUND MATCHING VARIATION!', variation.variation_id);
                            break;
                        }
                    }
                    
                    if (matchingVariation) {
                        console.log('CDBT: Found matching variation:', matchingVariation);
                        $('#cdbt-variation-id').val(matchingVariation.variation_id);
                        
                        // Update price display
                        if (matchingVariation.display_price) {
                            $('#cdbt-variation-price').html('<strong>Price: ' + matchingVariation.display_price + '</strong>').show();
                        }
                    }
                }
            } else {
                $('#cdbt-variation-id').val('');
                $('#cdbt-variation-price').html('').hide();
            }
        });
    }
        
        // AUTO-SELECT FIRST VARIATION ON LOAD
        if (typeof cdbtDesignData !== 'undefined' && cdbtDesignData.variations && cdbtDesignData.variations.length > 0) {
            console.log('CDBT: Auto-selecting first variation on page load');
            
            var firstVariation = cdbtDesignData.variations[0];
            var variationAttributes = firstVariation.attributes;
            
            // Set each dropdown to first variation's value
            for (var attr in variationAttributes) {
                var attrValue = variationAttributes[attr];
                var $select = $('select[name="' + attr + '"]');
                
                if ($select.length > 0 && attrValue) {
                    console.log('CDBT: Setting ' + attr + ' to ' + attrValue);
                    $select.val(attrValue);
                }
            }
            
            // Trigger change on all selects to load price and image
            $('.cdbt-variation-select').first().trigger('change');
        }
    
    if (typeof cdbtDesignData === 'undefined') {
        console.log('CDBT: No design data found');
        return;
    }
    
    // V12.12: Make textElements globally accessible for Apply button
    window.cdbtTextElements = [];
    var textElements = window.cdbtTextElements;
    
    canvas = document.getElementById('cdbt-design-canvas');
    if (!canvas) {
        console.error('CDBT: Canvas element not found!');
        return;
    }
    var ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('CDBT: Canvas 2D context not supported!');
        return;
    }
    
    // V12.12: Initialize HIGH QUALITY image rendering to prevent blur/pixelation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    console.log('CDBT V12.12: High quality image smoothing enabled');
    
    uploadedImages = [];
    var currentImage = null; // Background product image
    var selectedFrameSize = null;
    selectedTextElement = null;
    var isDragging = false;
    var dragOffset = { x: 0, y: 0 };
    
    // Per-side frame size selection state
    var selectedFrameSizeBySide = { front: null, back: null };
    
    // V12.12: Track CSS dimensions (display size) separately from internal canvas size
    // V12.12: Use global canvasCssWidth/canvasCssHeight (removed local var)
    // canvasCssWidth and canvasCssHeight are now global
    
    // V12.12: Font tracking variables for mobile (declared here, set later)
    var savedTextForFont = null;
    var savedTextContent = '';
    var previousFontValue = 'Arial';

    // --- NEW: resize/transform state ---
    var isResizing = false;
    var resizeHandleSize = 10;
    var activeHandle = null; // 'tl', 'tr', 'bl', 'br' for text or image
    var resizeStart = null; // { mouseX, mouseY, origFontSize, origBoxWidth, origX, origY }

    // --- NEW: image-specific resize state ---


    var isImageResizing = false;
    var imageResizeStart = null; // { mouseX, mouseY, origW, origH, origX, origY, aspect }
    // -----------------------------------

    // --- NEW: ROTATION state ---
    var isRotating = false;
    var rotationStart = null; // { centerX, centerY, startAngle, originalRotation }
    // V12.12: Larger rotation handle for mobile touch (was 12)
    var rotateHandleSize = window.innerWidth <= 768 ? 25 : 12;
    var rotateHandleDistance = 30;
    // -----------------------------------
    


    if (!canvas || !ctx) {
        return;
    }
    
    // Initialize canvas
    // Initialize canvas
    function initCanvas() {
        console.log('CDBT: ===== initCanvas START =====');
        console.log('CDBT: Window width:', window.innerWidth);
        
        // Make canvas responsive for mobile
        var container = document.getElementById('cdbt-canvas-container');
        var containerWidth = container ? container.offsetWidth : 600;
        
        console.log('CDBT: Container element exists:', !!container);
        console.log('CDBT: Container offsetWidth:', containerWidth);
        
        // Fallback: If container width is 0 or too small, use window width
        if (containerWidth < 100) {
            containerWidth = window.innerWidth > 100 ? window.innerWidth - 40 : 320;
            console.log('CDBT: Using window width as fallback:', containerWidth);
        }
        
        // Set canvas dimensions based on container width
        if (window.innerWidth <= 768) {
            // V12.12: Mobile canvas - use screen width directly (NO CSS RESIZE = NO BLUR)
            var screenWidth = window.innerWidth;
            
            // Update CSS dimension tracking variables
            canvasCssWidth = screenWidth;
            // Make design area taller on mobile so the shirt appears bigger (was 2/3)
            canvasCssHeight = Math.floor(screenWidth * 0.8);
            // Define logical shirt area as centered rect (used to clamp artwork)
            // Mobile: slightly wider and LOWER box so artwork can reach lower on the shirt
            shirtBounds.x = canvasCssWidth * 0.22;  // 22% from left
            shirtBounds.w = canvasCssWidth * 0.56;  // 56% of width
            shirtBounds.y = canvasCssHeight * 0.30; // 30% from top (shifted down)
            shirtBounds.h = canvasCssHeight * 0.48; // 48% of height (a bit taller)
            
            // Set canvas size directly (no CSS styling)
            canvas.width = canvasCssWidth;
            canvas.height = canvasCssHeight;
            
            // V12.12: CRITICAL - Remove any CSS width/height to prevent blur
            canvas.style.width = '';
            canvas.style.height = '';
            
            console.log('CDBT: MOBILE V12.12 - Canvas:', canvas.width, 'x', canvas.height, '(NO CSS resize)');
        } else {
            // Desktop: Fixed size (increase to make shirt bigger)
            canvasCssWidth = 750;  // was 600
            canvasCssHeight = 500; // was 400
            canvas.width = canvasCssWidth;
            canvas.height = canvasCssHeight;
            // Define logical shirt area as centered rect (used to clamp artwork)
            shirtBounds.x = canvasCssWidth * 0.2;
            shirtBounds.w = canvasCssWidth * 0.6;
            shirtBounds.y = canvasCssHeight * 0.15;
            shirtBounds.h = canvasCssHeight * 0.7;
            canvas.style.width = '';
            canvas.style.height = '';
            console.log('CDBT: DESKTOP mode - Canvas:', canvas.width, 'x', canvas.height);
        }
        
        // V12.12: Re-apply image smoothing after canvas resize
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Mobile: Force canvas to be visible
        if (window.innerWidth <= 768) {
            canvas.style.display = 'block';
            canvas.style.visibility = 'visible';
            console.log('CDBT: Forced canvas visibility on mobile');
        }
        
        // IMPORTANT: If image already loaded, just redraw and return
        // This prevents keyboard show/hide from resetting the color
        if (typeof currentImage !== 'undefined' && currentImage && currentImage.img) {
            console.log('CDBT: Image already loaded, skipping reload. Just resizing...');
            // Recalculate image dimensions for new canvas size - use CSS dimensions
            var img = currentImage.img;
            var scale = Math.min(canvasCssWidth / img.width, canvasCssHeight / img.height);
            currentImage.width = img.width * scale;
            currentImage.height = img.height * scale;
            currentImage.x = (canvasCssWidth - currentImage.width) / 2;
            currentImage.y = (canvasCssHeight - currentImage.height) / 2;
            if (typeof redrawCanvas === 'function') redrawCanvas();
            console.log('CDBT: ===== initCanvas END (resize only) =====');
            return;
        }
        
        // Check cdbtDesignData
        console.log('CDBT: Checking cdbtDesignData...');
        console.log('CDBT: typeof cdbtDesignData:', typeof cdbtDesignData);
        
        if (typeof cdbtDesignData === 'undefined') {
            console.error('CDBT: ERROR - cdbtDesignData is UNDEFINED!');
            return;
        }
        
        console.log('CDBT: cdbtDesignData.colorPhotos:', cdbtDesignData.colorPhotos);
        
        // FIXED: Use colorPhotos instead of photos
        if (!cdbtDesignData.colorPhotos) {
            console.error('CDBT: ERROR - No colorPhotos data!');
            return;
        }
        
        // Get first available color
        var colors = Object.keys(cdbtDesignData.colorPhotos);
        console.log('CDBT: Available colors:', colors);
        
        if (colors.length === 0) {
            console.error('CDBT: ERROR - No colors available!');
            return;
        }
        
        var firstColor = colors[0];
        var firstColorPhotos = cdbtDesignData.colorPhotos[firstColor];
        
        console.log('CDBT: First color:', firstColor);
        console.log('CDBT: First color photos:', firstColorPhotos);
        
        // Load front photo of first color
        if (firstColorPhotos && firstColorPhotos.front) {
            console.log('CDBT: Loading front photo:', firstColorPhotos.front);
            loadImage(firstColorPhotos.front);
        } else if (firstColorPhotos && firstColorPhotos.back) {
            console.log('CDBT: No front photo, loading back photo:', firstColorPhotos.back);
            loadImage(firstColorPhotos.back);
        } else {
            console.error('CDBT: ERROR - No photos for first color!');
        }
        
        console.log('CDBT: ===== initCanvas END =====');
    }
    
    // MOBILE FIX: Force load gallery photos immediately after initCanvas
    function forceLoadGalleryPhotos() {
        console.log('CDBT: forceLoadGalleryPhotos called');
        
        if (typeof cdbtDesignData === 'undefined' || !cdbtDesignData.colorPhotos) {
            console.log('CDBT: No colorPhotos data available');
            return false;
        }
        
        var $gallery = $('#cdbt-photo-gallery');
        if ($gallery.length === 0) {
            console.log('CDBT: Gallery element not found');
            return false;
        }
        
        var colors = Object.keys(cdbtDesignData.colorPhotos);
        if (colors.length === 0) {
            console.log('CDBT: No colors available');
            return false;
        }
        
        var firstColor = colors[0];
        var photos = cdbtDesignData.colorPhotos[firstColor];
        
        console.log('CDBT: Force loading gallery for color:', firstColor, photos);
        
        // Clear gallery and add photos
        $gallery.html('');
        
        if (photos && photos.front) {
            $gallery.append(
                '<div class="cdbt-gallery-photo" data-side="front" data-url="' + photos.front + '" style="position: relative; display: inline-block; margin: 5px; cursor: pointer; border: 3px solid #46b450; padding: 5px; background: #f9f9f9; border-radius: 8px;">' +
                    '<img src="' + photos.front + '" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;" />' +
                    '<div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">FRONT</div>' +
                '</div>'
            );
        }
        
        if (photos && photos.back) {
            $gallery.append(
                '<div class="cdbt-gallery-photo" data-side="back" data-url="' + photos.back + '" style="position: relative; display: inline-block; margin: 5px; cursor: pointer; border: 3px solid transparent; padding: 5px; background: #f9f9f9; border-radius: 8px;">' +
                    '<img src="' + photos.back + '" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;" />' +
                    '<div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">BACK</div>' +
                '</div>'
            );
        }
        
        console.log('CDBT: Gallery photos added!');
        return true;
    }
    
    // Install gallery click handler
    function installGalleryClickHandler() {
        $(document).off('click.galleryhandler touchend.galleryhandler', '.cdbt-gallery-photo');
        
        // V12.8: Touch handler for mobile
        $(document).on('touchend.galleryhandler', '.cdbt-gallery-photo', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var imageUrl = $(this).data('url');
            var side = $(this).data('side');
            console.log('📱 V12.8: Gallery touch:', side, imageUrl);
            
            // V12.8 FIX: Get current side BEFORE changing border!
            var currentSide = (typeof designStates !== 'undefined' && designStates.currentSide) ? designStates.currentSide : 'front';
            console.log('🔍 V12.8: Current side BEFORE switch:', currentSide);
            
            // V12.8: Only save if switching to DIFFERENT side
            if (currentSide !== side && typeof window.saveCurrentStateForSide === 'function') {
                window.saveCurrentStateForSide(currentSide);
            }
            
            // NOW change border (after saving)
            $('.cdbt-gallery-photo').css('border-color', 'transparent');
            $(this).css('border-color', '#46b450');
            
            // V12.8: Load saved state OR fallback to loadImage
            if (typeof window.loadSavedState === 'function') {
                window.loadSavedState(side);
            } else if (typeof loadImage === 'function') {
                loadImage(imageUrl);
            }
            
            // Mark as handled
            $(this).data('touch-handled', true);
            var $this = $(this);
            setTimeout(function() { $this.data('touch-handled', false); }, 500);
            
            // Refresh artworks
            setTimeout(function() {
                if (typeof displayArtworks === 'function' && artworksList && artworksList.length > 0) {
                    displayArtworks(artworksList);
                }
            }, 200);
        });
        
        // Click handler (desktop)
        $(document).on('click.galleryhandler', '.cdbt-gallery-photo', function(e) {
            // Skip if touch handled
            if ($(this).data('touch-handled')) {
                console.log('⚠️ V12.8: Gallery click ignored, touch handled');
                return;
            }
            
            var imageUrl = $(this).data('url');
            var side = $(this).data('side');
            console.log('🖱️ V12.8: Gallery click:', side, imageUrl);
            
            // V12.8 FIX: Get current side BEFORE changing border!
            var currentSide = (typeof designStates !== 'undefined' && designStates.currentSide) ? designStates.currentSide : 'front';
            console.log('🔍 V12.8: Current side BEFORE switch:', currentSide);
            
            // V12.8: Only save if switching to DIFFERENT side
            if (currentSide !== side && typeof window.saveCurrentStateForSide === 'function') {
                window.saveCurrentStateForSide(currentSide);
            }
            
            // NOW change border (after saving)
            $('.cdbt-gallery-photo').css('border-color', 'transparent');
            $(this).css('border-color', '#46b450');
            
            // V12.8: Load saved state OR fallback to loadImage
            if (typeof window.loadSavedState === 'function') {
                window.loadSavedState(side);
            } else if (typeof loadImage === 'function') {
                loadImage(imageUrl);
            }
            
            // Refresh artworks
            setTimeout(function() {
                if (typeof displayArtworks === 'function' && artworksList && artworksList.length > 0) {
                    displayArtworks(artworksList);
                }
            }, 200);
        });
        console.log('CDBT: V12.8 Gallery handlers installed (click + touch)');
    }
    
    // MOBILE FIX: Universal color change handler
    function installUniversalColorHandler() {
        console.log('CDBT: Installing universal color change handler');
        
        // All possible color dropdown selectors
        var colorSelectors = [
            'select[name="attribute_pa_color"]',
            '#pa_color',
            '.cdbt-left-variation-select',
            'select.variation-select',
            '.variations select',
            '[data-attribute_name="attribute_pa_color"]',
            '.cdbt-variation-select'
        ].join(', ');
        
        // Remove existing handlers
        $(document).off('change.universalcolor');
        
        // Use event delegation for all color selects
        $(document).on('change.universalcolor', colorSelectors, function() {
            var color = $(this).val();
            console.log('CDBT: Universal color change detected:', color);
            
            if (!color) return;
            
            color = color.toLowerCase();
            
            if (typeof cdbtDesignData === 'undefined' || !cdbtDesignData.colorPhotos) {
                console.log('CDBT: No color photos data');
                return;
            }
            
            if (!cdbtDesignData.colorPhotos[color]) {
                console.log('CDBT: No photos for color:', color);
                return;
            }
            
            var photos = cdbtDesignData.colorPhotos[color];
            console.log('CDBT: Loading photos for color:', color, photos);
            
            // Update gallery
            var $gallery = $('#cdbt-photo-gallery');
            $gallery.html('');
            
            if (photos.front) {
                $gallery.append(
                    '<div class="cdbt-gallery-photo" data-side="front" data-url="' + photos.front + '" style="position: relative; display: inline-block; margin: 5px; cursor: pointer; border: 3px solid #46b450; padding: 5px; background: #f9f9f9; border-radius: 8px;">' +
                        '<img src="' + photos.front + '" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;" />' +
                        '<div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">FRONT</div>' +
                    '</div>'
                );
            }
            
            if (photos.back) {
                $gallery.append(
                    '<div class="cdbt-gallery-photo" data-side="back" data-url="' + photos.back + '" style="position: relative; display: inline-block; margin: 5px; cursor: pointer; border: 3px solid transparent; padding: 5px; background: #f9f9f9; border-radius: 8px;">' +
                        '<img src="' + photos.back + '" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;" />' +
                        '<div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">BACK</div>' +
                    '</div>'
                );
            }
            
            // Load front image by default
            if (photos.front && typeof loadImage === 'function') {
                console.log('CDBT: Loading front image for new color');
                loadImage(photos.front);
            }
            
            console.log('CDBT: Color change completed for:', color);
        });
        
        console.log('CDBT: Universal color handler installed');
    }
    
    // Load image on canvas
    function loadImage(imageUrl) {
        console.log('CDBT: ===== loadImage START =====');
        console.log('CDBT: Image URL:', imageUrl);
        console.log('CDBT: typeof currentImage BEFORE:', typeof currentImage);
        console.log('CDBT: currentImage value BEFORE:', currentImage);
        
        var img = new Image();
        img.crossOrigin = "anonymous"; // CORS support for mobile browsers
        console.log('CDBT: Image object created, crossOrigin set');
        
        img.onload = function() {
            console.log('CDBT: ===== Image onload FIRED! =====');
            console.log('CDBT: Image loaded successfully - Size:', img.width, 'x', img.height);
            console.log('CDBT: Canvas CSS dimensions:', canvasCssWidth, 'x', canvasCssHeight);
            
            // Calculate aspect ratio - use CSS dimensions for calculations
            var aspectRatio = img.width / img.height;
            var targetWidth = canvasCssWidth;
            var targetHeight = canvasCssHeight;
            
            console.log('CDBT: Aspect ratio:', aspectRatio);
            
            var drawWidth, drawHeight;
            
            // V12.12: Scale product image to fill canvas (100%)
            if (aspectRatio > targetWidth / targetHeight) {
                drawWidth = targetWidth;
                drawHeight = targetWidth / aspectRatio;
            } else {
                drawHeight = targetHeight;
                drawWidth = targetHeight * aspectRatio;
            }
            
            var x = (targetWidth - drawWidth) / 2;
            var y = (targetHeight - drawHeight) / 2;
            
            console.log('CDBT: Calculated - drawWidth:', drawWidth, 'drawHeight:', drawHeight);
            console.log('CDBT: Position - x:', x, 'y:', y);
            
            console.log('CDBT: *** ASSIGNING to currentImage NOW ***');
            currentImage = {
                img: img,
                x: x,
                y: y,
                width: drawWidth,
                height: drawHeight
            };
            console.log('CDBT: *** currentImage ASSIGNED! ***');
            console.log('CDBT: typeof currentImage AFTER:', typeof currentImage);
            console.log('CDBT: currentImage:', currentImage);
            
            console.log('CDBT: Calling redrawCanvas...');
            if (typeof redrawCanvas === 'function') redrawCanvas();
            console.log('CDBT: ===== loadImage END (success) =====');
        };
        
        img.onerror = function(e) {
            console.error('CDBT: ===== Image onerror FIRED! =====');
            console.error('CDBT: Failed to load image:', imageUrl);
            console.error('CDBT: Error event:', e);
            alert('ERROR: Failed to load image: ' + imageUrl);
        };
        
        console.log('CDBT: Setting img.src to:', imageUrl);
        img.src = imageUrl;
        console.log('CDBT: img.src set, waiting for onload or onerror...');
    }
    
    // Helper: get transform handles positions for a text element
    function getTransformBox(el) {
        ctx.font = el.fontWeight + ' ' + el.fontStyle + ' ' + el.fontSize + 'px ' + el.fontFamily;
        var metrics = ctx.measureText(el.content);
        var boxX = el.x - 5;
        var boxY = el.y - el.fontSize - 5;
        var boxW = metrics.width + 10;
        var boxH = el.fontSize + 10;
        return { x: boxX, y: boxY, w: boxW, h: boxH, textWidth: metrics.width };
    }

    // NEW: get image handle (returns 'tl','tr','bl','br' or null)
    function getImageHandleAt(x, y, imgElement) {
        if (!imgElement) return null;
        
        // Get rotated corners for accurate hit detection
        var corners = getRotatedCorners(imgElement);
        var half = resizeHandleSize / 2;
        var handleNames = ['tl', 'tr', 'br', 'bl'];
        
        for (var i = 0; i < corners.length; i++) {
            var corner = corners[i];
            // Check if click is within the handle square at this corner
            if (x >= corner.x - half && x <= corner.x + half + resizeHandleSize &&
                y >= corner.y - half && y <= corner.y + half + resizeHandleSize) {
                return handleNames[i];
            }
        }
        return null;
    }
    
    // Helper: detect which handle (if any) is at canvas coords x,y for given text element
    function getHandleAt(x, y, el) {
        if (!el) return null;
        var box = getTransformBox(el);
        
        // Get rotated corners for accurate hit detection
        var corners = getRotatedTextCorners(el, box);
        var half = resizeHandleSize / 2;
        var handleNames = ['tl', 'tr', 'br', 'bl'];
        
        for (var i = 0; i < corners.length; i++) {
            var corner = corners[i];
            // Check if click is within the handle square at this corner
            if (x >= corner.x - half && x <= corner.x + half + resizeHandleSize &&
                y >= corner.y - half && y <= corner.y + half + resizeHandleSize) {
                return handleNames[i];
            }
        }
        return null;
    }
    
    // Redraw canvas

    // ===== ROTATION HELPER FUNCTIONS =====
    function degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    function radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }
    
    function calculateAngle(centerX, centerY, pointX, pointY) {
        return Math.atan2(pointY - centerY, pointX - centerX);
    }
    
    function getRotationCenter(element, isText) {
        if (isText) {
            ctx.font = element.fontWeight + ' ' + element.fontStyle + ' ' + element.fontSize + 'px ' + element.fontFamily;
            var metrics = ctx.measureText(element.content);
            return {
                x: element.x + metrics.width / 2,
                y: element.y - element.fontSize / 2
            };
        } else {
            return {
                x: element.x + element.width / 2,
                y: element.y + element.height / 2
            };
        }
    }
    
    function getRotationHandlePosition(element, isText) {
        var center = getRotationCenter(element, isText);
        var box = isText ? getTransformBox(element) : {
            x: element.x,
            y: element.y,
            w: element.width,
            h: element.height
        };
        return {
            x: center.x,
            y: box.y - rotateHandleDistance
        };

    }

    
    function isClickOnRotationHandle(x, y, element, isText) {
        var handlePos = getRotationHandlePosition(element, isText);
        var dx = x - handlePos.x;
        var dy = y - handlePos.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        
        // V12.12: Debug logging for rotation handle detection
        console.log('🔄 V12.12: Rotation check - click:', x, y, '| handle:', handlePos.x.toFixed(1), handlePos.y.toFixed(1), '| distance:', distance.toFixed(1), '| threshold:', rotateHandleSize);
        
        // V12.12: Use larger threshold on mobile
        var threshold = window.innerWidth <= 768 ? rotateHandleSize * 2 : rotateHandleSize;
        return distance <= threshold;
    }
    // ===== END ROTATION HELPERS =====

    // Helper: Get rotated corners of an image element
    function getRotatedCorners(imgElement) {
        var centerX = imgElement.x + imgElement.width / 2;
        var centerY = imgElement.y + imgElement.height / 2;
        var angle = degreesToRadians(imgElement.rotation || 0);
        
        // Calculate corners relative to center
        var corners = [
            { x: imgElement.x, y: imgElement.y },  // TL
            { x: imgElement.x + imgElement.width, y: imgElement.y },  // TR
            { x: imgElement.x + imgElement.width, y: imgElement.y + imgElement.height },  // BR

            { x: imgElement.x, y: imgElement.y + imgElement.height }  // BL
        ];
        
        // Rotate each corner around center
        return corners.map(function(corner) {
            var dx = corner.x - centerX;
            var dy = corner.y - centerY;
            return {
                x: centerX + dx * Math.cos(angle) - dy * Math.sin(angle),

                y: centerY + dx * Math.sin(angle) + dy * Math.cos(angle)
            };
        });
    }
    
    // Helper: Get rotated corners of text element
    function getRotatedTextCorners(textElement, box) {
        var centerX = box.x + box.w / 2;
        var centerY = box.y + box.h / 2;
        var angle = degreesToRadians(textElement.rotation || 0);
        
        var corners = [
            { x: box.x, y: box.y },  // TL
            { x: box.x + box.w, y: box.y },  // TR
            { x: box.x + box.w, y: box.y + box.h },  // BR
            { x: box.x, y: box.y + box.h }  // BL
        ];
        
        return corners.map(function(corner) {
            var dx = corner.x - centerX;
            var dy = corner.y - centerY;
            return {
                x: centerX + dx * Math.cos(angle) - dy * Math.sin(angle),
                y: centerY + dx * Math.sin(angle) + dy * Math.cos(angle)
            };
        });
    }
    

    
    function redrawCanvas() {
        // V12.12: Clear using CSS dimensions (context is scaled, so this clears full canvas)
        ctx.clearRect(0, 0, canvasCssWidth, canvasCssHeight);
        
        // V12.12: Enable HIGH QUALITY image smoothing to prevent blur/pixelation when resizing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw background image
        if (currentImage) {
            ctx.drawImage(
                currentImage.img,
                currentImage.x,
                currentImage.y,
                currentImage.width,
                currentImage.height
            );
            
        }
        
        // Draw uploaded images
        uploadedImages.forEach(function(imgElement) {
            ctx.save();
            
            // V12.12: Ensure high quality for each image
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Apply rotation if exists
            if (imgElement.rotation) {
                var centerX = imgElement.x + imgElement.width / 2;
                var centerY = imgElement.y + imgElement.height / 2;
                ctx.translate(centerX, centerY);
                ctx.rotate(degreesToRadians(imgElement.rotation));
                ctx.translate(-centerX, -centerY);
            }
            
            ctx.drawImage(
                imgElement.img,
                imgElement.x,
                imgElement.y,
                imgElement.width,
                imgElement.height
            );
            
            ctx.restore();
            
             if (imgElement === canvas.selectedImageElement) {
                 // Draw handles in NORMAL space (not rotated) so clicks work correctly
                 let img = imgElement;
                 
                 // Calculate bounding box corners in normal space
                 var corners = getRotatedCorners(img);
                 
                 ctx.strokeStyle = '#007cba';
                 ctx.lineWidth = 2;
                 
                 // Draw rotated rectangle by connecting corners
                 ctx.beginPath();
                 ctx.moveTo(corners[0].x, corners[0].y);
                 ctx.lineTo(corners[1].x, corners[1].y);
                 ctx.lineTo(corners[2].x, corners[2].y);
                 ctx.lineTo(corners[3].x, corners[3].y);
                 ctx.closePath();
                 ctx.stroke();

                 // Draw resize handles at corners (in normal space)
                 var half = resizeHandleSize / 2;
                 ctx.fillStyle = '#007cba';
                 corners.forEach(function(corner) {
                     ctx.fillRect(corner.x - half, corner.y - half, resizeHandleSize, resizeHandleSize);
                 });
                 
                 // Draw rotation handle (red circle on top center)
                 var rotateHandle = getRotationHandlePosition(imgElement, false);
                 ctx.beginPath();
                 ctx.arc(rotateHandle.x, rotateHandle.y, rotateHandleSize/2, 0, 2 * Math.PI);
                 ctx.fillStyle = '#ff6b6b';
                 ctx.fill();
                 ctx.strokeStyle = '#fff';
                 ctx.lineWidth = 2;
                 ctx.stroke();
                 
                 // Draw line from top center to rotation handle
                 var topCenter = {
                     x: (corners[0].x + corners[1].x) / 2,
                     y: (corners[0].y + corners[1].y) / 2
                 };
                 ctx.beginPath();
                 ctx.moveTo(topCenter.x, topCenter.y);
                 ctx.lineTo(rotateHandle.x, rotateHandle.y);
                 ctx.strokeStyle = '#007cba';
                 ctx.lineWidth = 1;
                 ctx.setLineDash([5, 5]);
                 ctx.stroke();
                 ctx.setLineDash([]);
            }
        });
        
        // Draw text elements
        textElements.forEach(function(textElement) {
            ctx.save();
            
            // Apply rotation if exists
            if (textElement.rotation) {
                var center = getRotationCenter(textElement, true);
                ctx.translate(center.x, center.y);
                ctx.rotate(degreesToRadians(textElement.rotation));
                ctx.translate(-center.x, -center.y);
            }
            
            ctx.font = textElement.fontWeight + ' ' + textElement.fontStyle + ' ' + 
                      textElement.fontSize + 'px ' + textElement.fontFamily;
            ctx.fillStyle = textElement.color;
            ctx.textDecoration = textElement.textDecoration;
            
            // Handle text decoration manually
            var metrics = ctx.measureText(textElement.content);
            ctx.fillText(textElement.content, textElement.x, textElement.y);
            
            if (textElement.textDecoration.includes('underline')) {
                ctx.beginPath();
                ctx.moveTo(textElement.x, textElement.y + 2);
                ctx.lineTo(textElement.x + metrics.width, textElement.y + 2);
                ctx.stroke();
            }
            
            ctx.restore();
            
            // Draw selection border + handles if selected
            if (textElement === selectedTextElement) {
                // Draw handles in NORMAL space (not rotated) so clicks work correctly
                var box = getTransformBox(textElement);
                
                // Calculate rotated corners
                var textCorners = getRotatedTextCorners(textElement, box);
                
                ctx.strokeStyle = '#007cba';
                ctx.lineWidth = 2;
                
                // Draw rotated rectangle
                ctx.beginPath();
                ctx.moveTo(textCorners[0].x, textCorners[0].y);
                ctx.lineTo(textCorners[1].x, textCorners[1].y);
                ctx.lineTo(textCorners[2].x, textCorners[2].y);
                ctx.lineTo(textCorners[3].x, textCorners[3].y);
                ctx.closePath();
                ctx.stroke();
                
                // Draw resize handles at corners
                var half = resizeHandleSize / 2;
                ctx.fillStyle = '#007cba';
                textCorners.forEach(function(corner) {
                    ctx.fillRect(corner.x - half, corner.y - half, resizeHandleSize, resizeHandleSize);
                });
                
                // Draw rotation handle (red circle on top center)
                var rotateHandle = getRotationHandlePosition(textElement, true);
                ctx.beginPath();
                ctx.arc(rotateHandle.x, rotateHandle.y, rotateHandleSize/2, 0, 2 * Math.PI);
                ctx.fillStyle = '#ff6b6b';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw line from top center to rotation handle
                var topCenter = {
                    x: (textCorners[0].x + textCorners[1].x) / 2,
                    y: (textCorners[0].y + textCorners[1].y) / 2
                };
                ctx.beginPath();
                ctx.moveTo(topCenter.x, topCenter.y);
                ctx.lineTo(rotateHandle.x, rotateHandle.y);
                ctx.strokeStyle = '#007cba';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });
    }
    
    $(document).on('click', '.artwork-s', function() {
        console.log('🎨 My Artwork tab clicked');
        console.log('DEBUG: isArtworkLoaded:', isArtworkLoaded);
        console.log('DEBUG: artworksList length:', artworksList ? artworksList.length : 0);
        
        // Show tab content
        $('.cdbt-tab-content').hide();
        $('#cdbt-artwork-content').show();
        
        // Update active tab
        $('.cdbt-tab-button').removeClass('active');
        $(this).addClass('active');
        
        // Load artworks if not loaded
        if (!isArtworkLoaded) {
            loadArtworks();
        }
    });
    
    // V12.4 FIX: Flag to prevent double-add (STRONGER)
    var isAddingArtwork = false;
    var lastArtworkAddTime = 0;
    
    // V12.4 FIX: Unified handler for both click and touch
    function handleArtworkSelect(element, e) {
        // Prevent default and stop propagation
        if (e) {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();
        }
        
        // V12.4: Time-based double-add prevention (1 second cooldown)
        var now = Date.now();
        if (now - lastArtworkAddTime < 1000) {
            console.log('⚠️ V12.4: Cooldown active, ignoring');
            return false;
        }
        
        // V12.4: Flag-based double-add prevention
        if (isAddingArtwork) {
            console.log('⚠️ V12.4: Already adding artwork, ignoring');
            return false;
        }
        
        var $item = $(element);
        if ($item.hasClass('disabled')) {
            console.log('⚠️ V12.4: Artwork is disabled');
            return false;
        }
        
        var artworkId = $item.data('artwork-id');
        console.log('🖼️ V12.4 Artwork selected:', artworkId);
        
        // Find artwork data
        var artworkData = artworksList.find(function(art) {
            return art.id == artworkId;
        });
        
        if (!artworkData) {
            console.error('❌ Artwork not found:', artworkId);
            return false;
        }
        
        // Check if already selected
        if (selectedArtwork && selectedArtwork.id == artworkId) {
            console.log('ℹ️ Artwork already selected');
            return false;
        }
        
        // V12.4: Check if ANY artwork already exists in uploadedImages
        var artworkExists = uploadedImages.some(function(img) {
            return img.artworkId !== undefined;
        });
        if (artworkExists) {
            console.log('ℹ️ V12.4: An artwork already on canvas');
            return false;
        }
        
        // V12.4: Set flags before adding
        isAddingArtwork = true;
        lastArtworkAddTime = now;
        
        // Add to canvas
        addArtworkToCanvas(artworkData);
        
        // V12.4: Reset flag after longer delay (2 seconds for mobile)
        setTimeout(function() {
            isAddingArtwork = false;
            console.log('🔓 V12.4: Artwork add flag reset');
        }, 2000);
        
        return true;
    }
    
    // V12.12: Touch handler for mobile artwork selection
    $(document).on('touchstart', '.cdbt-artwork-item', function(e) {
        // Mark touch started
        $(this).data('touch-started', true);
        console.log('📱 V12.12: Artwork touchstart');
    });
    
    // V12.12: Touchend handler - simplified
    $(document).on('touchend', '.cdbt-artwork-item, .cdbt-artwork-item *', function(e) {
        // Get the artwork item (could be child element)
        var $item = $(e.target).closest('.cdbt-artwork-item');
        
        if (!$item.length) {
            console.log('⚠️ V12.12: No artwork item found');
            return;
        }
        
        console.log('📱 V12.12: Artwork touchend on:', $item.data('artwork-id'));
        
        // Prevent default and stop propagation
        e.preventDefault();
        e.stopPropagation();
        
        // V12.12: Check if disabled
        if ($item.hasClass('disabled')) {
            console.log('⚠️ V12.12: Artwork is disabled');
            alert('Delete existing image first before adding artwork.');
            return;
        }
        
        // Mark as touch handled
        $item.data('touch-handled', true);
        setTimeout(function() {
            $item.data('touch-handled', false);
        }, 500);
        
        // Call handler directly with item element
        handleArtworkSelect($item[0], e);
    });
    
    // Artwork item click (desktop + fallback)
    $(document).on('click', '.cdbt-artwork-item, .cdbt-artwork-item *', function(e) {
        // Get the artwork item (could be child element)
        var $item = $(e.target).closest('.cdbt-artwork-item');
        
        if (!$item.length) return;
        
        // V12.4: Skip if touch already handled this
        if ($item.data('touch-handled')) {
            console.log('⚠️ V12.4: Click ignored, touch already handled');
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        // V12.12: Check if disabled
        if ($item.hasClass('disabled')) {
            console.log('⚠️ V12.12: Artwork is disabled (image already on canvas)');
            return;
        }
        
        console.log('🖱️ V12.4: Click on artwork:', $item.data('artwork-id'));
        handleArtworkSelect($item[0], e);
    });
    
    // Retry button click (for error state)
    $(document).on('click', '.cdbt-retry-button', function() {
        console.log('🔄 Retrying artwork load...');
        loadArtworks();
    });
    
    // Frame size selection
    $('input[name="cdbt_frame_size"]').change(function() {
        var index = $(this).val();
        selectedFrameSize = cdbtDesignData.frameSizes[index];
        
        console.log('CDBT: Frame size selected:', selectedFrameSize);
        console.log('CDBT: Currency symbol:', cdbtDesignData.currency);
        
        // Save per-side selection
        try {
            var sideForSize = (typeof designStates !== 'undefined' && designStates.currentSide) ? designStates.currentSide : 'front';
            if (typeof selectedFrameSizeBySide !== 'undefined') {
                selectedFrameSizeBySide[sideForSize] = selectedFrameSize;
            }
            console.log('CDBT: Saved frame size for side:', sideForSize, selectedFrameSize);
        } catch (e) {
            console.log('CDBT: Could not save per-side frame size', e);
        }
        
        // Format price properly
        var priceDisplay = '';
        if (selectedFrameSize && selectedFrameSize.price) {
            var price = parseFloat(selectedFrameSize.price);
            if (!isNaN(price)) {
                priceDisplay = ' (+' + cdbtDesignData.currency + price.toFixed(2) + ')';
            }
        }
        
        $('#cdbt-selected-frame-price').html(
            '<strong>Selected:</strong> ' + selectedFrameSize.size + priceDisplay
        ).show();
        $('#cdbt-selected-frame-price').html(
            '<strong>Selected:</strong> ' + selectedFrameSize.size + priceDisplay
        ).show();
        $('#cdbt-selected-frame-price').html(
            '<strong>Selected:</strong> ' + selectedFrameSize.size + priceDisplay
        ).show();
    });
    
    // Add text functionality
    $('#cdbt-add-text').click(function() {
        var textContent = $('#cdbt-text-input').val().trim();
        
        if (!textContent) {
            alert('Please enter some text.');
            return;
        }
        
        // Allow only ONE text per side
        try {
            if (Array.isArray(textElements) && textElements.length > 0) {
                alert('Only one text is allowed on this side. Please delete the existing text first.');
                return;
            }
        } catch (e) {}
        
        // V12.12 FIX: If image is selected, deselect it before adding text
        if (canvas.selectedImageElement) {
            console.log('📝 V12.12: Image was selected, deselecting to add text');
            canvas.selectedImageElement = null;
        }
        
        // V12.12: Use CSS dimensions for text positioning
        var textElement = {
            content: textContent,
            x: canvasCssWidth / 2,
            y: canvasCssHeight / 2,
            fontSize: 24,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            color: '#000000'
        };
        
        textElements.push(textElement);
        selectedTextElement = textElement;
        
        $('#cdbt-text-input').val('');
        $('#cdbt-text-formatting').show();
        updateTextFormatting();
        
        // Show delete controls since text is now selected
        showDeleteControls('text', textContent);
        
        // V12.12: DON'T disable controls - user can add multiple elements
        // disableAddControls();
        
        if (typeof redrawCanvas === 'function') redrawCanvas();
    });
    
    // Text formatting controls
    function updateTextFormatting() {
        if (!selectedTextElement) return;
        
        // V12.12: Save reference for mobile font changes (direct assignment)
        savedTextForFont = selectedTextElement;
        savedTextContent = selectedTextElement.content;
        previousFontValue = selectedTextElement.fontFamily || 'Arial';
        console.log('🔤 V12.12: updateTextFormatting - saved text:', savedTextContent, 'font:', previousFontValue);
        
        $('#cdbt-font-size').val(selectedTextElement.fontSize);
        $('#cdbt-font-size-value').text(selectedTextElement.fontSize + 'px');
        $('#cdbt-font-color').val(selectedTextElement.color);
        $('#cdbt-font-family').val(selectedTextElement.fontFamily);
        
        // Update format buttons
        $('.cdbt-format-btn').removeClass('active');
        if (selectedTextElement.fontWeight === 'bold') {
            $('#cdbt-bold').addClass('active');
        }
        if (selectedTextElement.fontStyle === 'italic') {
            $('#cdbt-italic').addClass('active');
        }
        if (selectedTextElement.textDecoration.includes('underline')) {
            $('#cdbt-underline').addClass('active');
        }
        
        // Update rotation slider
        $('#cdbt-rotation-slider').val(selectedTextElement.rotation || 0);

        $('#cdbt-rotation-value').text((selectedTextElement.rotation || 0) + '°');
    }
    
    // V12.12: Font size with logging
    $('#cdbt-font-size').on('input change', function() {
        console.log('📏 V12.12: Font size changed to:', $(this).val());
        if (selectedTextElement) {

            selectedTextElement.fontSize = parseInt($(this).val());
            $('#cdbt-font-size-value').text(selectedTextElement.fontSize + 'px');
            if (typeof redrawCanvas === 'function') redrawCanvas();
        }
    });
    
    // V12.12: Font color - use both 'change' and 'input' for mobile compatibility
    $('#cdbt-font-color').on('change input', function() {
        console.log('🎨 V12.12: Font color changed to:', $(this).val());
        if (selectedTextElement) {
            selectedTextElement.color = $(this).val();
            if (typeof redrawCanvas === 'function') redrawCanvas();
        }
    });
    
    // V12.12 AGGRESSIVE FIX: Font family for mobile
    
    // V12.12: APPLY FONT button handler - using global textElements
    $(document).on('click touchstart', '#cdbt-apply-font-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var fontValue = $('#cdbt-font-family').val();
        
        // Use global reference as fallback
        var texts = textElements || window.cdbtTextElements || [];

        
        console.log('🔤 V12.12: APPLY clicked!');
        console.log('🔤 Font:', fontValue);
        console.log('🔤 texts.length:', texts.length);
        
        if (!fontValue) {
            alert('Select a font first!');

            return false;
        }
        
        if (!texts || texts.length === 0) {
            alert('No text! Add text first.\n\nLocal: ' + (textElements ? textElements.length : 'null') + '\nGlobal: ' + (window.cdbtTextElements ? window.cdbtTextElements.length : 'null'));
            return false;
        }
        
        // Apply font to ALL text
        for (var i = 0; i < texts.length; i++) {
            texts[i].fontFamily = fontValue;
        }
        
        // Redraw
        if (typeof redrawCanvas === 'function') {
            redrawCanvas();
        }
        
        alert('✅ Font: ' + fontValue + ' applied to ' + texts.length + ' text(s)');
        
        return false;
    });
    
    function applyFontFamily(fontValue) {
        console.log('🔤 V12.12: Applying font:', fontValue);
        
        // Try multiple sources for the text element
        var textToUpdate = null;
        
        // Source 1: Current selection
        if (selectedTextElement) {
            textToUpdate = selectedTextElement;
            console.log('🔤 Using selectedTextElement');
        }
        // Source 2: Saved reference
        else if (savedTextForFont) {
            textToUpdate = savedTextForFont;
            console.log('🔤 Using savedTextForFont');
        }
        // Source 3: Find by content in textElements array
        else if (savedTextContent && typeof textElements !== 'undefined') {
            for (var i = 0; i < textElements.length; i++) {
                if (textElements[i].content === savedTextContent) {
                    textToUpdate = textElements[i];
                    console.log('🔤 Found text by content:', savedTextContent);
                    break;
                }
            }
        }
        // Source 4: Last text element in array
        else if (typeof textElements !== 'undefined' && textElements.length > 0) {
            textToUpdate = textElements[textElements.length - 1];
            console.log('🔤 Using last text element');
        }
        
        if (textToUpdate && fontValue) {
            console.log('🔤 V12.12: Changing font from', textToUpdate.fontFamily, 'to', fontValue);
            textToUpdate.fontFamily = fontValue;
            previousFontValue = fontValue;
            
            if (typeof redrawCanvas === 'function') {
                redrawCanvas();
                console.log('🔤 V12.12: Canvas redrawn with new font');
            }
            return true;
        }
        
        console.log('⚠️ V12.12: Could not find text to update');
        return false;
    }
    
    // Save text reference whenever text is selected
    function saveTextForFontChanges(textEl) {
        if (textEl) {
            savedTextForFont = textEl;
            savedTextContent = textEl.content;
            previousFontValue = textEl.fontFamily || 'Arial';
            console.log('🔤 V12.12: Saved text for font:', savedTextContent, 'Current font:', previousFontValue);
        }
    }
    
    // Track text selection from multiple sources
    $(document).on('click touchstart touchend', '#cdbt-design-canvas', function() {
        setTimeout(function() {
            if (selectedTextElement) {
                saveTextForFontChanges(selectedTextElement);
            }
        }, 50);
    });
    
    // Also save when text formatting panel becomes visible
    $(document).on('click touchend', '.customize-tabs li, [data-section="text"]', function() {
        setTimeout(function() {
            if (selectedTextElement) {
                saveTextForFontChanges(selectedTextElement);
            } else if (typeof textElements !== 'undefined' && textElements.length > 0) {
                saveTextForFontChanges(textElements[textElements.length - 1]);
            }
        }, 100);
    });
    
    // NATIVE JavaScript event listener (more reliable on mobile)
    setTimeout(function() {
        var fontSelect = document.getElementById('cdbt-font-family');
        if (fontSelect) {
            console.log('🔤 V12.12: Adding native event listeners to font select');
            
            fontSelect.addEventListener('change', function(e) {
                console.log('🔤 V12.12: Native change event:', this.value);
                applyFontFamily(this.value);
            }, false);
            
            fontSelect.addEventListener('blur', function(e) {
                console.log('🔤 V12.12: Native blur event:', this.value);
                if (this.value !== previousFontValue) {
                    applyFontFamily(this.value);
                }
            }, false);
            
            // For iOS - input event
            fontSelect.addEventListener('input', function(e) {
                console.log('🔤 V12.12: Native input event:', this.value);
                applyFontFamily(this.value);
            }, false);
        }
    }, 1000);
    
    // jQuery handlers as backup
    $('#cdbt-font-family').on('change input blur', function(e) {
        console.log('🔤 V12.12: jQuery event:', e.type, $(this).val());
        applyFontFamily($(this).val());
    });
    
    $(document).on('change input blur', '#cdbt-font-family', function(e) {
        console.log('🔤 V12.12: jQuery delegated:', e.type, $(this).val());
        applyFontFamily($(this).val());
    });
    
    // Aggressive polling - check every 200ms
    setInterval(function() {
        var $fontSelect = $('#cdbt-font-family');
        if ($fontSelect.length) {
            var currentValue = $fontSelect.val();
            if (currentValue && currentValue !== previousFontValue) {
                console.log('🔤 V12.12: Polling detected change:', previousFontValue, '->', currentValue);
                applyFontFamily(currentValue);
            }
        }
    }, 200);
    
    $('.cdbt-format-btn').click(function() {
        if (!selectedTextElement) return;
        
        var style = $(this).data('style');
        $(this).toggleClass('active');
        
        switch (style) {
            case 'bold':
                selectedTextElement.fontWeight = $(this).hasClass('active') ? 'bold' : 'normal';
                break;
            case 'italic':
                selectedTextElement.fontStyle = $(this).hasClass('active') ? 'italic' : 'normal';
                break;
            case 'underline':
                selectedTextElement.textDecoration = $(this).hasClass('active') ? 'underline' : 'none';
                break;
        }
        
        if (typeof redrawCanvas === 'function') redrawCanvas();
    });
    
    // Rotation slider for text and images
    $('#cdbt-rotation-slider').on('input', function() {
        var rotation = parseInt($(this).val());
        $('#cdbt-rotation-value').text(rotation + '°');
        
        if (selectedTextElement) {
            selectedTextElement.rotation = rotation;
            if (typeof redrawCanvas === 'function') redrawCanvas();
        } else if (canvas.selectedImageElement) {
            canvas.selectedImageElement.rotation = rotation;
            if (typeof redrawCanvas === 'function') redrawCanvas();
        }
    });
    
    // Image upload functionality
    $('#cdbt-upload-image').click(function() {
        $('#cdbt-image-upload').click();
    });
    
    // Helper function to show loader
    function showLoader() {
        if ($('#cdbt-upload-loader').length === 0) {
            $('body').append(`
                <div id="cdbt-upload-loader" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                ">
                    <div style="
                        width: 80px;
                        height: 80px;
                        border: 8px solid #f3f3f3;
                        border-top: 8px solid #3498db;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    "></div>
                    <p style="
                        color: white;
                        margin-top: 20px;
                        font-size: 18px;
                        font-weight: bold;
                    ">Uploading Image...</p>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `);
        } else {
            $('#cdbt-upload-loader').show();
        }
    }
    
    // Helper function to hide loader
    function hideLoader() {
        $('#cdbt-upload-loader').fadeOut(300);
    }
    
    // Helper function to calculate proper image size with aspect ratio
    function calculateImageSize(imgWidth, imgHeight) {
        var MAX_WIDTH = 300;  // Maximum width for uploaded images
        var MAX_HEIGHT = 300; // Maximum height for uploaded images
        var MIN_WIDTH = 100;  // Minimum width to prevent tiny images
        var MIN_HEIGHT = 100; // Minimum height to prevent tiny images
        
        var aspectRatio = imgWidth / imgHeight;
        var newWidth = imgWidth;
        var newHeight = imgHeight;
        
        // If image is too small, scale it up (but not beyond MAX dimensions)
        if (imgWidth < MIN_WIDTH || imgHeight < MIN_HEIGHT) {
            if (imgWidth < imgHeight) {
                newWidth = MIN_WIDTH;
                newHeight = MIN_WIDTH / aspectRatio;
            } else {
                newHeight = MIN_HEIGHT;
                newWidth = MIN_HEIGHT * aspectRatio;
            }
        }
        
        // If image is too large, scale it down
        if (newWidth > MAX_WIDTH || newHeight > MAX_HEIGHT) {
            if (newWidth > newHeight) {
                newWidth = MAX_WIDTH;
                newHeight = MAX_WIDTH / aspectRatio;
            } else {
                newHeight = MAX_HEIGHT;
                newWidth = MAX_HEIGHT * aspectRatio;
            }
        }
        
        // Final check to ensure we don't exceed MAX dimensions
        if (newWidth > MAX_WIDTH) {
            newWidth = MAX_WIDTH;
            newHeight = MAX_WIDTH / aspectRatio;
        }
        if (newHeight > MAX_HEIGHT) {
            newHeight = MAX_HEIGHT;
            newWidth = MAX_HEIGHT * aspectRatio;
        }
        
        return {
            width: Math.round(newWidth),
            height: Math.round(newHeight)
        };
    }
    
    $('#cdbt-image-upload').change(function() {
        var file = this.files[0];
        if (!file) return;
        
        // V12.12: Check if ANY image already exists on canvas (artwork OR upload)
        if (uploadedImages && uploadedImages.length > 0) {
            alert('An image already exists on this side. Please delete the existing image first before uploading a new one.');
            console.log('⚠️ V12.12: Image already exists, upload blocked');
            $(this).val(''); // Reset file input
            return;
        }
        
        // Show loader
        showLoader();
        
        var formData = new FormData();
        formData.append('action', 'cdbt_upload_image');
        formData.append('nonce', cdbt_ajax.nonce);
        formData.append('image', file);
        
        $.ajax({
            url: cdbt_ajax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    var img = new Image();
                    img.onload = function() {
                        // V12.12: Double-check inside onload (race condition prevention)
                        if (uploadedImages && uploadedImages.length > 0) {
                            console.log('⚠️ V12.12: Image already exists (race condition prevented in upload)');
                            hideLoader();
                            return;
                        }
                        
                        // V12.12: Store natural (original) dimensions for quality reference
                        var naturalWidth = img.naturalWidth || img.width;
                        var naturalHeight = img.naturalHeight || img.height;
                        
                        // Calculate proper size maintaining aspect ratio
                        var dimensions = calculateImageSize(img.width, img.height);
                        
                        var imgElement = {
                            img: img,
                            x: 50,
                            y: 50,
                            width: dimensions.width,
                            height: dimensions.height,
                            url: response.data.url,
                            // V12.12: Flag to identify user-uploaded images (not artworks)
                            isUserUpload: true,
                            // V12.12: Store natural dimensions for quality scaling
                            naturalWidth: naturalWidth,
                            naturalHeight: naturalHeight
                        };
                        
                        uploadedImages.push(imgElement);
                        
                        // Auto-select uploaded image and show delete controls
                        canvas.selectedImageElement = imgElement;
                        selectedTextElement = null;
                        $('#cdbt-text-formatting').hide();
                        showDeleteControls('image', 'Uploaded Image');
                        disableAddControls(); // Disable buttons after image upload
                        
                        // V12.3 FIX: Also refresh artworks to disable them after upload
                        if (typeof displayArtworks === 'function' && artworksList && artworksList.length > 0) {
                            displayArtworks(artworksList);
                        }
                        // V12.3: Force disable artwork items
                        $('.cdbt-artwork-item').addClass('disabled');
                        $('#cdbt-artwork-disabled-message').show();
                        console.log('🔒 V12.3: Artwork FORCE DISABLED after upload');
                        
                        // V12.12: Close sidebar on mobile after uploading image
                        $('.active-section').removeClass('active-section');
                        console.log('📱 V12.12: Sidebar closed after image upload');
                        
                        if (typeof redrawCanvas === 'function') redrawCanvas();
                        
                        // Hide loader after image is loaded and drawn
                        hideLoader();
                    };
                    img.onerror = function() {
                        hideLoader();
                        alert('Failed to load uploaded image.');
                    };
                    img.src = response.data.url;
                } else {
                    hideLoader();
                    alert('Upload failed: ' + response.data);
                }
            },
            error: function() {
                hideLoader();
                alert('Upload failed. Please try again.');
            }
        });
        
        // Reset file input so same file can be uploaded again
        $(this).val('');
    });
    
    // Photo gallery functionality
// DISABLED:     $('.cdbt-gallery-photo').click(function() {
// DISABLED:         var imageUrl = $(this).data('url');
// DISABLED:         loadImage(imageUrl);
// DISABLED:     });
    
    // Canvas mouse events for dragging + resizing
    canvas.addEventListener('mousedown', function(e) {
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        // HIGHEST PRIORITY: Check for rotation handle on selected image
        if (canvas.selectedImageElement) {
            if (isClickOnRotationHandle(x, y, canvas.selectedImageElement, false)) {
                isRotating = true;
                var center = getRotationCenter(canvas.selectedImageElement, false);
                rotationStart = {
                    centerX: center.x,
                    centerY: center.y,
                    startAngle: calculateAngle(center.x, center.y, x, y),
                    originalRotation: canvas.selectedImageElement.rotation || 0
                };
                return;
            }
        }
        
        // Check for rotation handle on selected text
        if (selectedTextElement) {
            if (isClickOnRotationHandle(x, y, selectedTextElement, true)) {
                isRotating = true;
                var center = getRotationCenter(selectedTextElement, true);
                rotationStart = {
                    centerX: center.x,
                    centerY: center.y,
                    startAngle: calculateAngle(center.x, center.y, x, y),
                    originalRotation: selectedTextElement.rotation || 0
                };
                return;
            }
        }

        // PRIORITY: If an image is already selected, check for image-handle click (start resizing image)
        if (canvas.selectedImageElement) {
            var imgHandle = getImageHandleAt(x, y, canvas.selectedImageElement);
            if (imgHandle) {
                // start resizing image
                isImageResizing = true;
                activeHandle = imgHandle;
                var img = canvas.selectedImageElement;
                var aspect = img.width / img.height;
                imageResizeStart = {
                    mouseX: x,
                    mouseY: y,
                    origW: img.width,
                    origH: img.height,
                    origX: img.x,
                    origY: img.y,
                    aspect: aspect
                };
                return; // don't continue to other checks
            }
        }

        // FIRST: if a text element is already selected, check for handle click (start resizing text)
        if (selectedTextElement) {
            var handle = getHandleAt(x, y, selectedTextElement);
            if (handle) {
                // Start resizing text
                isResizing = true;
                activeHandle = handle;
                // Save initial state for proportional resizing
                ctx.font = selectedTextElement.fontWeight + ' ' + selectedTextElement.fontStyle + ' ' + selectedTextElement.fontSize + 'px ' + selectedTextElement.fontFamily;
                var metrics = ctx.measureText(selectedTextElement.content);
                resizeStart = {
                    mouseX: x,
                    mouseY: y,
                    origFontSize: selectedTextElement.fontSize,
                    origBoxWidth: metrics.width,
                    origX: selectedTextElement.x,
                    origY: selectedTextElement.y
                };
                return; // don't proceed to other click checks
            }
        }
        
        // Check if clicking on text element (select + start dragging)
        for (var i = textElements.length - 1; i >= 0; i--) {
            var textElement = textElements[i];
            ctx.font = textElement.fontWeight + ' ' + textElement.fontStyle + ' ' + 
                      textElement.fontSize + 'px ' + textElement.fontFamily;
            var metrics = ctx.measureText(textElement.content);
            

            if (x >= textElement.x && x <= textElement.x + metrics.width &&
                y >= textElement.y - textElement.fontSize && y <= textElement.y) {
                selectedTextElement = textElement;
                canvas.selectedImageElement = null; // Clear image selection
                isDragging = true;

                dragOffset.x = x - textElement.x;
                dragOffset.y = y - textElement.y;
                updateTextFormatting();
                $('#cdbt-text-formatting').show();
                showDeleteControls('text', textElement.content);
                disableAddControls();
                if (typeof redrawCanvas === 'function') redrawCanvas();
                return;
            }
        }
        
        // Check if clicking on uploaded image (select + start dragging OR selecting)
        for (var j = uploadedImages.length - 1; j >= 0; j--) {
            var imgElement = uploadedImages[j];
            if (x >= imgElement.x && x <= imgElement.x + imgElement.width &&
                y >= imgElement.y && y <= imgElement.y + imgElement.height) {
                isDragging = true;
                selectedTextElement = null;
                canvas.selectedImageElement = imgElement;
                dragOffset.x = x - imgElement.x;
                dragOffset.y = y - imgElement.y;
                canvas.dragElement = imgElement;
                $('#cdbt-text-formatting').hide();
                showDeleteControls('image', 'Uploaded Image');
                disableAddControls(); // Disable buttons when image is selected
                if (typeof redrawCanvas === 'function') redrawCanvas();
                return;
            }
        }
        
        // If nothing selected
        selectedTextElement = null;
        canvas.selectedImageElement = null;
        $('#cdbt-text-formatting').hide();
        if (typeof hideDeleteControls === 'function') hideDeleteControls();
        enableAddControls();
        if (typeof redrawCanvas === 'function') redrawCanvas();
    });
    
    canvas.addEventListener('mousemove', function(e) {
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;


        // Handle rotation (highest priority)
        if (isRotating && rotationStart) {
            var currentAngle = calculateAngle(rotationStart.centerX, rotationStart.centerY, x, y);
            var angleDiff = radiansToDegrees(currentAngle - rotationStart.startAngle);

            var newRotation = rotationStart.originalRotation + angleDiff;
            
            // Normalize to 0-360
            newRotation = ((newRotation % 360) + 360) % 360;
            
            if (canvas.selectedImageElement) {
                canvas.selectedImageElement.rotation = newRotation;
            } else if (selectedTextElement) {
                selectedTextElement.rotation = newRotation;
            }
            
            if (typeof redrawCanvas === 'function') redrawCanvas();
            return;
        }

        // If image resizing in progress (highest priority)
        if (isImageResizing && canvas.selectedImageElement && imageResizeStart) {
            var img = canvas.selectedImageElement;
            var start = imageResizeStart;
            var dx = x - start.mouseX;
            var dy = y - start.mouseY;
            // For proportional resizing, use the movement along the corner direction to scale uniformly.
            // Determine scale based on which handle is active.
            var scale = 1;
            if (activeHandle === 'br') {
                // moving to right/bottom => increase width and height proportionally
                var newW = Math.max(10, start.origW + dx);
                scale = newW / start.origW;
            } else if (activeHandle === 'tr') {
                // moving right/top -> width increases, height decreases if you move up; use dx for width
                var newWt = Math.max(10, start.origW + dx);
                scale = newWt / start.origW;
            } else if (activeHandle === 'bl') {
                // moving left/bottom -> width decreases when moving left; compute using -dx
                var newWb = Math.max(10, start.origW - dx);
                scale = newWb / start.origW;
            } else if (activeHandle === 'tl') {
                // moving left/top -> width decreases when moving left/up
                var newWt = Math.max(10, start.origW - dx);
                scale = newWt / start.origW;
            }
            // keep scale sane
            scale = Math.max(0.05, scale);

            var newW = Math.max(6, Math.round(start.origW * scale));
            var newH = Math.max(6, Math.round(newW / start.aspect));

            // adjust x,y to keep the corner opposite the active handle fixed
            if (activeHandle === 'tl') {
                // keep bottom-right fixed => new x = origX + (origW - newW)
                img.x = start.origX + (start.origW - newW);
                img.y = start.origY + (start.origH - newH);
            } else if (activeHandle === 'tr') {
                // keep bottom-left fixed vertically adjust y
                img.x = start.origX; // left stays same
                img.y = start.origY + (start.origH - newH);
            } else if (activeHandle === 'bl') {
                // keep top-right fixed horizontally adjust x
                img.x = start.origX + (start.origW - newW);
                img.y = start.origY;
            } else if (activeHandle === 'br') {
                // keep top-left fixed, so x,y remain orig
                img.x = start.origX;
                img.y = start.origY;
            }

            img.width = newW;
            img.height = newH;

            if (typeof redrawCanvas === 'function') redrawCanvas();
            return;
        }

        // If resizing text, handle it (higher priority than dragging)
        if (isResizing && selectedTextElement && resizeStart) {
            // Compute proportional width change based on active handle
            var origWidth = resizeStart.origBoxWidth;
            var scale = 1;
            if (activeHandle === 'br' || activeHandle === 'tr') {
                var newWidth = Math.max(10, x - resizeStart.origX);
                scale = newWidth / origWidth;
            } else if (activeHandle === 'bl' || activeHandle === 'tl') {
                var rightEdge = resizeStart.origX + origWidth;
                var newWidthLeft = Math.max(10, rightEdge - x);
                scale = newWidthLeft / origWidth;
            }
            var newFontSize = Math.max(6, resizeStart.origFontSize * scale);
            selectedTextElement.fontSize = newFontSize;

            // If left handles, we need to adjust element.x so text's left edge aligns with new left
            if (activeHandle === 'bl' || activeHandle === 'tl') {
                // set new left x so that the right edge stays at rightEdge
                var rightEdge = resizeStart.origX + origWidth;
                // after changing fontSize, the text width will change — approximate by scaling origBoxWidth
                var approxNewTextWidth = origWidth * (newFontSize / resizeStart.origFontSize);
                selectedTextElement.x = rightEdge - approxNewTextWidth;
            }

            // Update UI control
            $('#cdbt-font-size').val(Math.round(selectedTextElement.fontSize));
            $('#cdbt-font-size-value').text(Math.round(selectedTextElement.fontSize) + 'px');

            if (typeof redrawCanvas === 'function') redrawCanvas();
            return;
        }
        
        // If dragging (move text or image)
        if (!isDragging) {
            // change cursor when hovering handles or rotation handle
            var hoveringHandle = null;
            var hoveringRotate = false;
            
            if (canvas.selectedImageElement) {
                hoveringHandle = getImageHandleAt(x, y, canvas.selectedImageElement);
                hoveringRotate = isClickOnRotationHandle(x, y, canvas.selectedImageElement, false);
            }
            if (!hoveringHandle && !hoveringRotate && selectedTextElement) {
                hoveringHandle = getHandleAt(x, y, selectedTextElement);
                hoveringRotate = isClickOnRotationHandle(x, y, selectedTextElement, true);
            }

            if (hoveringRotate) {
                canvas.style.cursor = 'grab';
            } else if (hoveringHandle) {
                canvas.style.cursor = 'se-resize';
            } else {
                canvas.style.cursor = 'default';
            }
            return;
        }
        
        if (isDragging) {
            if (selectedTextElement) {
                selectedTextElement.x = x - dragOffset.x;
                selectedTextElement.y = y - dragOffset.y;
            } else if (canvas.dragElement) {
                canvas.dragElement.x = x - dragOffset.x;
                canvas.dragElement.y = y - dragOffset.y;
            }
            if (typeof redrawCanvas === 'function') redrawCanvas();
        }
    });
    
    // V12.12: Keep element within shirt bounds (logical shirt area)
    function keepElementInBounds(element, isText) {
        if (!element) return;
        
        var canvasW = canvas.width || canvasCssWidth || 600;
        var canvasH = canvas.height || canvasCssHeight || 400;
        var padding = 10; // Minimum pixels that must stay visible
        // Use shirtBounds if defined; fallback to full canvas
        var boundsX = (shirtBounds && shirtBounds.w) ? shirtBounds.x : 0;
        var boundsY = (shirtBounds && shirtBounds.h) ? shirtBounds.y : 0;
        var boundsW = (shirtBounds && shirtBounds.w) ? shirtBounds.w : canvasW;
        var boundsH = (shirtBounds && shirtBounds.h) ? shirtBounds.h : canvasH;
        
        if (isText) {
            // For text, use approximate width based on content
            var textWidth = element.content ? element.content.length * (element.fontSize || 24) * 0.6 : 100;
            var textHeight = element.fontSize || 24;
            
            // Clamp so the entire text box stays inside shirtBounds
            if (element.x < boundsX + padding) {
                element.x = boundsX + padding;
                console.log('📍 V12.12: Text clamped from left');
            }
            if (element.x + textWidth > boundsX + boundsW - padding) {
                element.x = boundsX + boundsW - padding - textWidth;
                console.log('📍 V12.12: Text clamped from right');
            }
            if (element.y - textHeight < boundsY + padding) {
                element.y = boundsY + padding + textHeight;
                console.log('📍 V12.12: Text clamped from top');
            }
            if (element.y > boundsY + boundsH - padding) {
                element.y = boundsY + boundsH - padding;
                console.log('📍 V12.12: Text clamped from bottom');
            }
        } else {
            // For images/artworks
            var elemWidth = element.width || 100;
            var elemHeight = element.height || 100;
            
            // Clamp so the entire image box stays inside shirtBounds
            if (element.x < boundsX + padding) {
                element.x = boundsX + padding;
                console.log('📍 V12.12: Image clamped from left');
            }
            if (element.x + elemWidth > boundsX + boundsW - padding) {
                element.x = boundsX + boundsW - padding - elemWidth;
                console.log('📍 V12.12: Image clamped from right');
            }
            if (element.y < boundsY + padding) {
                element.y = boundsY + padding;
                console.log('📍 V12.12: Image clamped from top');
            }
            if (element.y + elemHeight > boundsY + boundsH - padding) {
                element.y = boundsY + boundsH - padding - elemHeight;
                console.log('📍 V12.12: Image clamped from bottom');
            }
        }
    }
    
    canvas.addEventListener('mouseup', function() {
        // V12.12: Check bounds BEFORE clearing drag state
        if (canvas.dragElement) {
            var isTextElement = canvas.dragElement.content !== undefined;
            keepElementInBounds(canvas.dragElement, isTextElement);
        }
        if (selectedTextElement) {
            keepElementInBounds(selectedTextElement, true);
        }
        if (canvas.selectedImageElement) {
            keepElementInBounds(canvas.selectedImageElement, false);
        }
        
        isDragging = false;
        canvas.dragElement = null;

        // End resizing as well
        isResizing = false;
        activeHandle = null;
        resizeStart = null;

        // End image resizing
        isImageResizing = false;
        imageResizeStart = null;
        activeHandle = null;

        // End rotation
        isRotating = false;
        rotationStart = null;

        // ensure formatting UI reflects final selection
        if (selectedTextElement) updateTextFormatting();
        
        // V12.12: Redraw to show corrected position
        if (typeof redrawCanvas === 'function') redrawCanvas();
    });
    
    // ============================================================
    // MOBILE TOUCH EVENT SUPPORT
    // ============================================================
    
    // Helper function to get coordinates from touch event
    function getTouchPos(e) {
        var rect = canvas.getBoundingClientRect();
        var touch = e.touches[0] || e.changedTouches[0];
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }
    
    // Touch start (equivalent to mousedown)
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault(); // Prevent scrolling
        var pos = getTouchPos(e);
        var x = pos.x;
        var y = pos.y;
        
        console.log('CDBT: Touch start at', x, y);

        // HIGHEST PRIORITY: Check for rotation handle on selected image
        if (canvas.selectedImageElement) {
            if (isClickOnRotationHandle(x, y, canvas.selectedImageElement, false)) {
                isRotating = true;
                var center = getRotationCenter(canvas.selectedImageElement, false);
                rotationStart = {
                    centerX: center.x,
                    centerY: center.y,
                    startAngle: calculateAngle(center.x, center.y, x, y),
                    originalRotation: canvas.selectedImageElement.rotation || 0
                };
                console.log('CDBT: Touch - Start image rotation');
                return;
            }
        }
        
        // Check for rotation handle on selected text
        if (selectedTextElement) {
            if (isClickOnRotationHandle(x, y, selectedTextElement, true)) {
                isRotating = true;
                var center = getRotationCenter(selectedTextElement, true);
                rotationStart = {
                    centerX: center.x,
                    centerY: center.y,
                    startAngle: calculateAngle(center.x, center.y, x, y),
                    originalRotation: selectedTextElement.rotation || 0
                };
                console.log('CDBT: Touch - Start text rotation');
                return;
            }
        }

        // PRIORITY: If an image is already selected, check for image-handle click (start resizing image)
        if (canvas.selectedImageElement) {
            var imgHandle = getImageHandleAt(x, y, canvas.selectedImageElement);
            if (imgHandle) {
                isImageResizing = true;
                activeHandle = imgHandle;
                var img = canvas.selectedImageElement;
                var aspect = img.width / img.height;
                imageResizeStart = {
                    mouseX: x,
                    mouseY: y,
                    origW: img.width,
                    origH: img.height,
                    origX: img.x,
                    origY: img.y,
                    aspect: aspect
                };
                console.log('CDBT: Touch - Start image resize');
                return;
            }
        }

        // If a text element is already selected, check for handle click (start resizing text)
        if (selectedTextElement) {
            var handle = getHandleAt(x, y, selectedTextElement);
            if (handle) {
                isResizing = true;
                activeHandle = handle;
                ctx.font = selectedTextElement.fontWeight + ' ' + selectedTextElement.fontStyle + ' ' + selectedTextElement.fontSize + 'px ' + selectedTextElement.fontFamily;
                var metrics = ctx.measureText(selectedTextElement.content);
                resizeStart = {
                    mouseX: x,
                    mouseY: y,
                    origFontSize: selectedTextElement.fontSize,
                    origBoxWidth: metrics.width,
                    origX: selectedTextElement.x,
                    origY: selectedTextElement.y
                };
                console.log('CDBT: Touch - Start text resize');
                return;
            }
        }

        // Check for image element click
        for (var j = uploadedImages.length - 1; j >= 0; j--) {
            var imgEl = uploadedImages[j];
            if (x >= imgEl.x && x <= imgEl.x + imgEl.width &&
                y >= imgEl.y && y <= imgEl.y + imgEl.height) {
                canvas.selectedImageElement = imgEl;
                selectedTextElement = null;
                isDragging = true;
                canvas.dragElement = imgEl;
                dragOffset = { x: x - imgEl.x, y: y - imgEl.y };
                if (typeof redrawCanvas === 'function') redrawCanvas();
                showDeleteControls('image', 'Uploaded Image');
                disableAddControls(); // Disable buttons when image is selected via touch
                console.log('CDBT: Touch - Selected image, start drag');
                return;
            }
        }

        // Check for text element click
        for (var i = textElements.length - 1; i >= 0; i--) {
            var el = textElements[i];
            ctx.font = el.fontWeight + ' ' + el.fontStyle + ' ' + el.fontSize + 'px ' + el.fontFamily;
            var metrics = ctx.measureText(el.content);
            var textWidth = metrics.width;
            var textHeight = el.fontSize;
            if (x >= el.x && x <= el.x + textWidth &&
                y >= el.y - textHeight && y <= el.y) {
                selectedTextElement = el;
                canvas.selectedImageElement = null;
                isDragging = true;
                canvas.dragElement = el;
                dragOffset = { x: x - el.x, y: y - el.y };
                if (typeof redrawCanvas === 'function') redrawCanvas();
                updateTextFormatting();
                showDeleteControls('text', el.content.substring(0, 20) + (el.content.length > 20 ? '...' : ''));
                disableAddControls(); // Disable buttons when text is selected via touch
                console.log('CDBT: Touch - Selected text, start drag');
                return;
            }
        }

        // Clicked on empty area - deselect
        selectedTextElement = null;
        canvas.selectedImageElement = null;
        if (typeof redrawCanvas === 'function') redrawCanvas();
        if (typeof hideDeleteControls === 'function') hideDeleteControls();
        enableAddControls(); // Enable buttons when deselecting
        console.log('CDBT: Touch - Deselected all');
    }, { passive: false });
    
    // Touch move (equivalent to mousemove)
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var pos = getTouchPos(e);
        var x = pos.x;
        var y = pos.y;

        // V12.12: Handle rotation FIRST (highest priority)
        if (isRotating && rotationStart) {
            var currentAngle = calculateAngle(rotationStart.centerX, rotationStart.centerY, x, y);
            var angleDiff = radiansToDegrees(currentAngle - rotationStart.startAngle);
            var newRotation = rotationStart.originalRotation + angleDiff;
            
            // Apply to the correct element
            if (canvas.selectedImageElement) {
                canvas.selectedImageElement.rotation = newRotation;
            } else if (selectedTextElement) {
                selectedTextElement.rotation = newRotation;
            }
            
            console.log('🔄 V12.12: Touch rotating, angle:', newRotation.toFixed(1));
            if (typeof redrawCanvas === 'function') redrawCanvas();
            return;
        }

        // Image resizing
        if (isImageResizing && canvas.selectedImageElement && imageResizeStart) {
            var dx = x - imageResizeStart.mouseX;
            var dy = y - imageResizeStart.mouseY;
            var img = canvas.selectedImageElement;
            var aspect = imageResizeStart.aspect;
            var newW, newH;
            
            switch (activeHandle) {
                case 'br':
                    newW = Math.max(30, imageResizeStart.origW + dx);
                    newH = newW / aspect;
                    img.width = newW;
                    img.height = newH;
                    break;
                case 'bl':
                    newW = Math.max(30, imageResizeStart.origW - dx);
                    newH = newW / aspect;
                    img.x = imageResizeStart.origX + (imageResizeStart.origW - newW);
                    img.width = newW;
                    img.height = newH;
                    break;
                case 'tr':
                    newW = Math.max(30, imageResizeStart.origW + dx);
                    newH = newW / aspect;
                    img.y = imageResizeStart.origY + (imageResizeStart.origH - newH);
                    img.width = newW;
                    img.height = newH;
                    break;
                case 'tl':
                    newW = Math.max(30, imageResizeStart.origW - dx);
                    newH = newW / aspect;
                    img.x = imageResizeStart.origX + (imageResizeStart.origW - newW);
                    img.y = imageResizeStart.origY + (imageResizeStart.origH - newH);
                    img.width = newW;
                    img.height = newH;
                    break;
            }
            if (typeof redrawCanvas === 'function') redrawCanvas();
            return;
        }

        // Text resizing
        if (isResizing && selectedTextElement && resizeStart) {
            var dx2 = x - resizeStart.mouseX;
            var scaleFactor = 1 + (dx2 / resizeStart.origBoxWidth);
            scaleFactor = Math.max(0.3, Math.min(scaleFactor, 5));
            selectedTextElement.fontSize = Math.round(resizeStart.origFontSize * scaleFactor);
            if (typeof redrawCanvas === 'function') redrawCanvas();
            return;
        }

        // Dragging
        if (isDragging && canvas.dragElement) {
            canvas.dragElement.x = x - dragOffset.x;
            canvas.dragElement.y = y - dragOffset.y;
            if (typeof redrawCanvas === 'function') redrawCanvas();
        }
    }, { passive: false });

    
    // Touch end (equivalent to mouseup)
    canvas.addEventListener('touchend', function(e) {

        e.preventDefault();
        console.log('CDBT: Touch end');
        
        // V12.12: Check bounds BEFORE clearing drag state
        if (canvas.dragElement) {
            var isTextElement = canvas.dragElement.content !== undefined;
            keepElementInBounds(canvas.dragElement, isTextElement);
        }
        if (selectedTextElement) {
            keepElementInBounds(selectedTextElement, true);
        }
        if (canvas.selectedImageElement) {
            keepElementInBounds(canvas.selectedImageElement, false);
        }
        
        isDragging = false;
        canvas.dragElement = null;
        isResizing = false;
        activeHandle = null;
        resizeStart = null;
        isImageResizing = false;
        imageResizeStart = null;
        
        // V12.12: Reset rotation state
        isRotating = false;
        rotationStart = null;

        if (selectedTextElement) updateTextFormatting();
        
        // V12.12: Redraw to show corrected position
        if (typeof redrawCanvas === 'function') redrawCanvas();
    }, { passive: false });
    
    // Prevent default touch behavior on canvas to avoid scrolling issues
    canvas.addEventListener('touchcancel', function(e) {
        // V12.12: Check bounds on cancel too
        if (canvas.dragElement) {
            var isTextElement = canvas.dragElement.content !== undefined;
            keepElementInBounds(canvas.dragElement, isTextElement);
        }
        if (selectedTextElement) {
            keepElementInBounds(selectedTextElement, true);
        }
        if (canvas.selectedImageElement) {
            keepElementInBounds(canvas.selectedImageElement, false);
        }
        
        isDragging = false;
        canvas.dragElement = null;
        isResizing = false;
        isImageResizing = false;
        
        // V12.12: Redraw to show corrected position
        if (typeof redrawCanvas === 'function') redrawCanvas();
    });
    
    // ============================================================
    // END MOBILE TOUCH EVENT SUPPORT
    // ============================================================
    
    // Delete control functions

    function showDeleteControls(type, elementInfo) {
        $('.options-element #cdbt-selected-element-info').text(type.charAt(0).toUpperCase() + type.slice(1) + ': ' + elementInfo);

        console.log('CDBT: showDeleteControls called for', type, 'elementInfo:', elementInfo);
        $('.options-element #cdbt-element-controls').show();
        console.log('CDBT: Showing element controls, checking if button exists:', $('.options-element #cdbt-element-controls').length);
        $('.options-element #cdbt-no-selection').hide();
        
        // NEW: Show remove background button only for images
        if (type === 'image' && canvas.selectedImageElement) {
            if ($('#cdbt-remove-bg-btn').length === 0) {
                $('.options-element #cdbt-delete-element').after(
                    '<button id="cdbt-remove-bg-btn" class="button" style="margin-left: 10px;">' +
                    'Remove Background</button>'
                );
            }
            $('#cdbt-remove-bg-btn').show();
        } else {
            $('#cdbt-remove-bg-btn').hide();
        }
    }
    
    function hideDeleteControls() {
        $('.options-element #cdbt-element-controls').hide();
        $('.options-element #cdbt-no-selection').show();
        $('#cdbt-remove-bg-btn').hide();
    }
    
    // Helper: Disable upload and add text buttons
    // V12.12: Add Text is ALWAYS enabled
    function disableAddControls() {
        $('#cdbt-upload-image').prop('disabled', true).css('opacity', '0.5').css('cursor', 'not-allowed');
        // V12.12: DON'T disable add-text - user can always add text
        // $('#cdbt-add-text').prop('disabled', true).css('opacity', '0.5').css('cursor', 'not-allowed');
        console.log('CDBT: Upload button DISABLED (Add Text still enabled)');
    }
    
    // Helper: Enable upload and add text buttons
    function enableAddControls() {
        $('#cdbt-upload-image').prop('disabled', false).css('opacity', '1').css('cursor', 'pointer');
        $('#cdbt-add-text').prop('disabled', false).css('opacity', '1').css('cursor', 'pointer');
        console.log('CDBT: Add/Upload buttons ENABLED - ready to add new elements');
    }
    
    // Delete element functionality
    $('.options-element #cdbt-delete-element').click(function() {
        if (selectedTextElement) {
            // Remove text element
            var index = textElements.indexOf(selectedTextElement);
            if (index > -1) {
                textElements.splice(index, 1);
                selectedTextElement = null;
                $('#cdbt-text-formatting').hide();
                if (typeof hideDeleteControls === 'function') hideDeleteControls();
                enableAddControls(); // Enable buttons after delete
                if (typeof redrawCanvas === 'function') redrawCanvas();
                // FIX Problem B: Clear artwork selection and refresh grid
                selectedArtwork = null;
                if (typeof displayArtworks === 'function' && artworksList.length > 0) {
                    if (typeof displayArtworks === 'function' && artworksList) displayArtworks(artworksList);
                }
            }
        } else if (canvas.selectedImageElement) {
            // Remove image element
            var index = uploadedImages.indexOf(canvas.selectedImageElement);
            if (index > -1) {
                uploadedImages.splice(index, 1);
                canvas.selectedImageElement = null;
                if (typeof hideDeleteControls === 'function') hideDeleteControls();
                enableAddControls(); // Enable buttons after delete
                if (typeof redrawCanvas === 'function') redrawCanvas();
                // FIX Problem B: Clear artwork selection and refresh grid
                selectedArtwork = null;
                if (typeof displayArtworks === 'function' && artworksList.length > 0) {
                    if (typeof displayArtworks === 'function' && artworksList) displayArtworks(artworksList);
                }
            }
        }
    });
    
    // Keyboard delete support - Delete or Backspace key
    $(document).on('keydown', function(e) {
        // Check if Delete (46) or Backspace (8) key is pressed
        if (e.keyCode === 46 || e.keyCode === 8) {
            // Don't delete if user is typing in an input field or textarea
            if ($(e.target).is('input, textarea, select')) {
                return; // Let the input field handle it normally
            }
            
            // Prevent default backspace behavior (browser back navigation)
            e.preventDefault();
            
            // Delete selected text element
            if (selectedTextElement) {
                var index = textElements.indexOf(selectedTextElement);
                if (index > -1) {
                    console.log('CDBT: Deleting text element via KEYBOARD');
                    textElements.splice(index, 1);
                    selectedTextElement = null;
                    $('#cdbt-text-formatting').hide();
                    if (typeof hideDeleteControls === 'function') hideDeleteControls();
                    enableAddControls(); // Enable buttons after keyboard delete
                    if (typeof redrawCanvas === 'function') redrawCanvas();
                    // FIX Problem B: Clear artwork selection and refresh grid
                    selectedArtwork = null;
                    if (typeof displayArtworks === 'function' && artworksList.length > 0) {
                        if (typeof displayArtworks === 'function' && artworksList) displayArtworks(artworksList);
                    }
                }
            } 
            // Delete selected image element
            else if (canvas.selectedImageElement) {
                var index = uploadedImages.indexOf(canvas.selectedImageElement);
                if (index > -1) {
                    console.log('CDBT: Deleting image element via KEYBOARD');
                    uploadedImages.splice(index, 1);
                    canvas.selectedImageElement = null;
                    if (typeof hideDeleteControls === 'function') hideDeleteControls();
                    enableAddControls(); // Enable buttons after keyboard delete
                    if (typeof redrawCanvas === 'function') redrawCanvas();
                    // FIX Problem B: Clear artwork selection and refresh grid
                    selectedArtwork = null;
                    if (typeof displayArtworks === 'function' && artworksList.length > 0) {
                        if (typeof displayArtworks === 'function' && artworksList) displayArtworks(artworksList);
                    }
                }
            }
        }
    });
    
    // NEW: Remove background functionality
    $(document).on('click', '#cdbt-remove-bg-btn', function() {
        if (!canvas.selectedImageElement) {
            alert('No image selected.');
            return;
        }
        
        var imageUrl = canvas.selectedImageElement.url;
        var $btn = $(this);
        var originalText = $btn.text();
        
        // Show big loader
        if ($('#cdbt-upload-loader').length === 0) {
            showLoader();
        }
        $('#cdbt-upload-loader p').text('Removing Background...');
        $('#cdbt-upload-loader').show();
        
        // Disable button
        $btn.prop('disabled', true).text('Processing...');
        
        $.ajax({
            url: cdbt_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'cdbt_remove_background',
                nonce: cdbt_ajax.nonce,
                image_url: imageUrl
            },
            success: function(response) {
                if (response.success) {
                    // Load the new image with removed background
                    var newImg = new Image();
                    newImg.onload = function() {
                        // Replace the image in the selected element
                        canvas.selectedImageElement.img = newImg;
                        canvas.selectedImageElement.url = response.data.url;
                        
                        // Maintain the current position and size with proper aspect ratio
                        var aspectRatio = newImg.width / newImg.height;
                        var currentWidth = canvas.selectedImageElement.width;
                        canvas.selectedImageElement.height = currentWidth / aspectRatio;
                        
                        if (typeof redrawCanvas === 'function') redrawCanvas();
                        
                        // Hide loader and restore button
                        hideLoader();
                        $btn.prop('disabled', false).text(originalText);
                        
                        alert(response.data.message || 'Background removed successfully!');
                    };
                    newImg.onerror = function() {
                        hideLoader();
                        alert('Failed to load processed image.');
                        $btn.prop('disabled', false).text(originalText);
                    };
                    newImg.src = response.data.url;
                } else {
                    hideLoader();
                    alert('Error: ' + response.data);
                    $btn.prop('disabled', false).text(originalText);
                }
            },
            error: function(xhr, status, error) {
                hideLoader();
                alert('Failed to remove background. Please try again.');
                console.error('Remove background error:', error);
                $btn.prop('disabled', false).text(originalText);
            }
        });
    });
    
    // Add to cart functionality
    
    $('#cdbt-add-to-cart').click(function() {
        
    console.log('CDBT: Add to cart button clicked - V12.10 HTML5 CANVAS FIX');

    if (!selectedFrameSize) {
        alert('Please select a frame size.');
        return;
    }

    var variationId = 0;
    if (cdbtDesignData.isVariable) {
        variationId = $('#cdbt-variation-id').val();
        if (!variationId || variationId === '' || variationId === '0') {
            alert('Please select all product options.');
            return;
        }
    } else {
        variationId = cdbtDesignData.variationId || 0;
    }

    // Disable button and show loading
    $('#cdbt-add-to-cart').attr("disabled", true);
    $('#cdbt-add-to-cart').html("Loading...");
    
    console.log('🎨 V12.10: Starting HTML5 canvas capture...');
    console.log('🎨 V12.10: Current side:', designStates.currentSide);
    
    // V12.11 FIX: Clear selection (blue borders) before capture
    console.log('🎨 V12.11: Clearing selection before capture...');
    selectedTextElement = null;
    if (typeof canvas !== 'undefined' && canvas) {
        canvas.selectedImageElement = null;
    }
    // Redraw to remove selection handles/borders
    if (typeof redrawCanvas === 'function') {
        redrawCanvas();
    }
    console.log('✅ V12.11: Selection cleared');
    
    var currentSide = designStates.currentSide || 'front';
    var otherSide = (currentSide === 'front') ? 'back' : 'front';
    
    // V12.10: Check customization using textElements and uploadedImages (NOT canvasJSON)
    var hasFrontCustomization = (designStates.front.textElements && designStates.front.textElements.length > 0) ||
                                (designStates.front.uploadedImages && designStates.front.uploadedImages.length > 0);
    
    var hasBackCustomization = (designStates.back.textElements && designStates.back.textElements.length > 0) ||
                               (designStates.back.uploadedImages && designStates.back.uploadedImages.length > 0);
    
    // V12.10: Also check current canvas for content
    // If on front and canvas has elements, front is customized
    // If on back and canvas has elements, back is customized
    if (currentSide === 'front' && (textElements.length > 0 || uploadedImages.length > 0)) {
        hasFrontCustomization = true;
        // Save current state to designStates
        designStates.front.textElements = JSON.parse(JSON.stringify(textElements));
        designStates.front.uploadedImages = uploadedImages.map(function(img) {
            return { 
                url: img.url, 
                x: img.x, 
                y: img.y, 
                width: img.width, 
                height: img.height,
                // V12.12: Include isUserUpload flag to identify user uploads
                isUserUpload: img.isUserUpload || false
            };
        });
        console.log('✅ V12.10: Saved current front state');
    } else if (currentSide === 'back' && (textElements.length > 0 || uploadedImages.length > 0)) {
        hasBackCustomization = true;
        // Save current state to designStates
        designStates.back.textElements = JSON.parse(JSON.stringify(textElements));
        designStates.back.uploadedImages = uploadedImages.map(function(img) {
            return { 
                url: img.url, 
                x: img.x, 
                y: img.y, 
                width: img.width, 
                height: img.height,
                // V12.12: Include isUserUpload flag to identify user uploads
                isUserUpload: img.isUserUpload || false
            };
        });
        console.log('✅ V12.10: Saved current back state');
    }
    
    var bothCustomized = hasFrontCustomization && hasBackCustomization;
    
    console.log('🎨 V12.10 DETECTION:');
    console.log('🎨 V12.10 Front customized:', hasFrontCustomization);
    console.log('🎨 V12.10 Front textElements:', designStates.front.textElements ? designStates.front.textElements.length : 0);
    console.log('🎨 V12.10 Front uploadedImages:', designStates.front.uploadedImages ? designStates.front.uploadedImages.length : 0);
    console.log('🎨 V12.10 Back customized:', hasBackCustomization);
    console.log('🎨 V12.10 Back textElements:', designStates.back.textElements ? designStates.back.textElements.length : 0);
    console.log('🎨 V12.10 Back uploadedImages:', designStates.back.uploadedImages ? designStates.back.uploadedImages.length : 0);
    console.log('🎨 V12.10 Both customized:', bothCustomized);
    
    // V12.10: If neither side customized, use current canvas as fallback
    if (!hasFrontCustomization && !hasBackCustomization) {
        console.log('🎨 V12.10: No customization detected, using current canvas');
        var designImageData = canvas.toDataURL('image/png');
        saveAndAddToCart(designImageData, null, false, variationId);
        return;
    }
    
    // V12.10: Capture current side first (it's already on canvas!)
    var frontImageData = null;
    var backImageData = null;
    
    console.log('🎨 V12.10: Capturing current side (' + currentSide + ')...');
    var currentImageData = canvas.toDataURL('image/png');
    
    if (currentSide === 'front' && hasFrontCustomization) {
        frontImageData = currentImageData;
        console.log('✅ V12.10: Front captured (current canvas)');
    } else if (currentSide === 'back' && hasBackCustomization) {
        backImageData = currentImageData;
        console.log('✅ V12.10: Back captured (current canvas)');
    }
    
    // V12.10: Check if we need to capture the other side
    var needOtherCapture = (otherSide === 'front' && hasFrontCustomization && !frontImageData) ||
                           (otherSide === 'back' && hasBackCustomization && !backImageData);
    
    console.log('🎨 V12.10: Need to capture other side (' + otherSide + '):', needOtherCapture);
    
    if (needOtherCapture) {
        console.log('🎨 V12.10: Switching to', otherSide, 'to capture...');
        
        // V12.10 FIX: Correct selector is .cdbt-gallery-photo, NOT .cdbt-photo-item
        var otherPhotoSelector = '.cdbt-gallery-photo[data-side="' + otherSide + '"]';
        var $otherPhoto = $(otherPhotoSelector);
        
        console.log('🎨 V12.10: Looking for:', otherPhotoSelector);
        console.log('🎨 V12.10: Found elements:', $otherPhoto.length);
        
        if ($otherPhoto.length > 0) {
            // Temporarily unbind to avoid triggering full switch logic
            console.log('🎨 V12.10: Clicking', otherSide, 'photo...');
            
            // Trigger the switch
            $otherPhoto.first().trigger('click');
            
            // Wait for canvas to update, then capture
            setTimeout(function() {
                // V12.11: Clear selection on other side too before capture
                selectedTextElement = null;
                if (typeof canvas !== 'undefined' && canvas) {
                    canvas.selectedImageElement = null;
                }
                if (typeof redrawCanvas === 'function') {
                    redrawCanvas();
                }
                
                console.log('🎨 V12.10: Canvas updated, capturing', otherSide, '...');
                var otherImageData = canvas.toDataURL('image/png');
                
                if (otherSide === 'front') {
                    frontImageData = otherImageData;
                    console.log('✅ V12.10: Front captured (after switch)');
                } else {
                    backImageData = otherImageData;
                    console.log('✅ V12.10: Back captured (after switch)');
                }
                
                // Switch back to original side
                console.log('🎨 V12.10: Switching back to', currentSide, '...');
                // V12.10 FIX: Correct selector
                var currentPhotoSelector = '.cdbt-gallery-photo[data-side="' + currentSide + '"]';
                $(currentPhotoSelector).first().trigger('click');
                
                // Wait a bit then proceed
                setTimeout(function() {
                    console.log('🎨 V12.10: Restored to', currentSide);
                    proceedToSave();
                }, 300);
                
            }, 500); // Wait 500ms for canvas to update
            
        } else {
            // Can't find photo element, try alternative approach
            console.log('⚠️ V12.10: Could not find photo element, trying manual redraw...');
            
            // V12.10 ALTERNATIVE: Manually redraw the other side
            var otherTextElements = designStates[otherSide].textElements || [];
            var otherUploadedImages = designStates[otherSide].uploadedImages || [];
            
            // V12.10 FIX: Get base URL from multiple sources
            var otherBaseUrl = null;
            
            // Try 1: currentColorPhotos
            if (typeof currentColorPhotos !== 'undefined' && currentColorPhotos[otherSide]) {
                otherBaseUrl = currentColorPhotos[otherSide];
                console.log('🎨 V12.10: Got base URL from currentColorPhotos:', otherBaseUrl);
            }
            
            // Try 2: window.currentColorPhotos
            if (!otherBaseUrl && typeof window.currentColorPhotos !== 'undefined' && window.currentColorPhotos[otherSide]) {
                otherBaseUrl = window.currentColorPhotos[otherSide];
                console.log('🎨 V12.10: Got base URL from window.currentColorPhotos:', otherBaseUrl);
            }
            
            // Try 3: cdbtDesignData.colorPhotos
            if (!otherBaseUrl && typeof cdbtDesignData !== 'undefined' && cdbtDesignData.colorPhotos) {
                // Get first available color's photos
                var colors = Object.keys(cdbtDesignData.colorPhotos);
                if (colors.length > 0) {
                    var firstColor = colors[0];
                    var photos = cdbtDesignData.colorPhotos[firstColor];
                    if (photos && photos[otherSide]) {
                        otherBaseUrl = photos[otherSide];
                        console.log('🎨 V12.10: Got base URL from cdbtDesignData:', otherBaseUrl);
                    }
                }
            }
            
            // Try 4: Gallery photo element (even though we couldn't click it, we might be able to read data-url)
            if (!otherBaseUrl) {
                var $anyGalleryPhoto = $('.cdbt-gallery-photo[data-side="' + otherSide + '"]');
                if ($anyGalleryPhoto.length > 0) {
                    otherBaseUrl = $anyGalleryPhoto.first().data('url') || $anyGalleryPhoto.first().attr('data-url');
                    console.log('🎨 V12.10: Got base URL from gallery photo attr:', otherBaseUrl);
                }
            }
            
            console.log('🎨 V12.10: Final other side base URL:', otherBaseUrl);
            console.log('🎨 V12.10: Other side text elements:', otherTextElements.length);
            console.log('🎨 V12.10: Other side uploaded images:', otherUploadedImages.length);
            
            if (otherBaseUrl) {
                // Load base image and redraw
                var tempImg = new Image();
                tempImg.crossOrigin = 'anonymous';
                tempImg.onload = function() {
                    console.log('🎨 V12.10: Base image loaded, redrawing...');
                    
                    // Save current canvas state
                    var savedImageData = canvas.toDataURL('image/png');
                    
                    // Clear and draw base
                    var ctx = canvas.getContext('2d');
                    
                    // V12.12: High quality image rendering
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // V12.12: Clear using CSS dimensions (context is scaled)
                    ctx.clearRect(0, 0, canvasCssWidth, canvasCssHeight);
                    
                    // Draw base image centered - use CSS dimensions
                    var aspectRatio = tempImg.width / tempImg.height;
                    var drawHeight = canvasCssHeight;
                    var drawWidth = drawHeight * aspectRatio;
                    var x = (canvasCssWidth - drawWidth) / 2;
                    ctx.drawImage(tempImg, x, 0, drawWidth, drawHeight);
                    
                    // Draw text elements
                    otherTextElements.forEach(function(textEl) {
                        ctx.font = (textEl.fontSize || 30) + 'px ' + (textEl.fontFamily || 'Arial');

                        ctx.fillStyle = textEl.color || '#000000';

                        ctx.fillText(textEl.content, textEl.x, textEl.y);
                    });
                    
                    // Draw uploaded images
                    var imagesLoaded = 0;
                    var totalImages = otherUploadedImages.length;
                    
                    if (totalImages === 0) {
                        // No images, capture now
                        captureOtherAndRestore();
                    } else {
                        otherUploadedImages.forEach(function(imgData) {
                            var img = new Image();
                            img.crossOrigin = 'anonymous';
                            img.onload = function() {
                                ctx.drawImage(img, imgData.x, imgData.y, imgData.width, imgData.height);
                                imagesLoaded++;
                                if (imagesLoaded >= totalImages) {
                                    captureOtherAndRestore();
                                }
                            };
                            img.onerror = function() {
                                imagesLoaded++;
                                if (imagesLoaded >= totalImages) {
                                    captureOtherAndRestore();
                                }
                            };
                            img.src = imgData.url;
                        });
                    }
                    
                    function captureOtherAndRestore() {
                        console.log('🎨 V12.10: Capturing redrawn canvas...');
                        var otherImageData = canvas.toDataURL('image/png');
                        
                        if (otherSide === 'front') {
                            frontImageData = otherImageData;
                            console.log('✅ V12.10: Front captured (manual redraw)');
                        } else {
                            backImageData = otherImageData;
                            console.log('✅ V12.10: Back captured (manual redraw)');
                        }
                        
                        // Restore original canvas
                        var restoreImg = new Image();
                        restoreImg.onload = function() {
                            // V12.12: Clear using CSS dimensions
                            ctx.clearRect(0, 0, canvasCssWidth, canvasCssHeight);
                            ctx.drawImage(restoreImg, 0, 0, canvasCssWidth, canvasCssHeight);
                            console.log('✅ V12.10: Canvas restored');
                            proceedToSave();
                        };
                        restoreImg.src = savedImageData;
                    }
                };
                tempImg.onerror = function() {
                    console.log('❌ V12.10: Failed to load base image');
                    proceedToSave();
                };
                tempImg.src = otherBaseUrl;
            } else {
                console.log('⚠️ V12.10: No base URL for other side');
                proceedToSave();
            }
        }
    } else {
        // No need to capture other side
        proceedToSave();
    }
    
    function proceedToSave() {
        console.log('🎨 V12.10: Proceeding to save...');
        console.log('🎨 V12.10: Front data:', frontImageData ? 'YES' : 'NO');
        console.log('🎨 V12.10: Back data:', backImageData ? 'YES' : 'NO');
        
        saveAndAddToCart(frontImageData, backImageData, bothCustomized, variationId);
    }
    


    function saveAndAddToCart(frontData, backData, bothSides, varId) {
        console.log('🎨 V12.10: saveAndAddToCart called');
        
        var savedUrls = { front: null, back: null };
        var saveCount = 0;
        var totalSaves = (frontData ? 1 : 0) + (backData ? 1 : 0);
        
        if (totalSaves === 0) {
            console.log('⚠️ V12.10: No designs to save!');
            $('#cdbt-add-to-cart').attr("disabled", false);
            $('#cdbt-add-to-cart').html("ADD TO CART");
            alert('Please customize at least one side.');
            return;
        }
        
        console.log('🎨 V12.10: Saving', totalSaves, 'design(s)...');
        
        // Save front design
        if (frontData) {
            console.log('🎨 V12.10: Saving front...');
            $.ajax({
                url: cdbt_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'cdbt_save_design',
                    nonce: cdbt_ajax.nonce,
                    image_data: frontData,
                    product_id: cdbtDesignData.productId,
                    side: 'front'
                },
                success: function(response) {
                    if (response.success) {
                        savedUrls.front = response.data.url;
                        console.log('✅ V12.10: Front saved:', savedUrls.front);
                    } else {
                        console.log('❌ V12.10: Front save failed:', response);
                    }
                    saveCount++;
                    checkAllSaved();
                },
                error: function(xhr) {
                    console.log('❌ V12.10: Front save error:', xhr);
                    saveCount++;
                    checkAllSaved();
                }
            });
        }
        
        // Save back design
        if (backData) {
            console.log('🎨 V12.10: Saving back...');
            $.ajax({
                url: cdbt_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'cdbt_save_design',
                    nonce: cdbt_ajax.nonce,
                    image_data: backData,
                    product_id: cdbtDesignData.productId,
                    side: 'back'
                },
                success: function(response) {
                    if (response.success) {
                        savedUrls.back = response.data.url;
                        console.log('✅ V12.10: Back saved:', savedUrls.back);
                    } else {
                        console.log('❌ V12.10: Back save failed:', response);
                    }
                    saveCount++;
                    checkAllSaved();
                },
                error: function(xhr) {
                    console.log('❌ V12.10: Back save error:', xhr);
                    saveCount++;
                    checkAllSaved();
                }
            });
        }
        
        function checkAllSaved() {
            console.log('🎨 V12.10: Save count:', saveCount, '/', totalSaves);
            if (saveCount >= totalSaves) {
                console.log('🎨 V12.10: All designs saved!');
                console.log('🎨 V12.10: Front URL:', savedUrls.front);
                console.log('🎨 V12.10: Back URL:', savedUrls.back);
                addToCartWithUrls(savedUrls, bothSides, varId);
            }
        }
        
        function addToCartWithUrls(urls, bothSides, varId) {
            console.log('🎨 V12.10: Adding to cart with URLs:', urls);
            
            // V12.12: Save current side state before extracting uploads
            if (currentSide === 'front') {
                designStates.front.uploadedImages = uploadedImages.map(function(img) {
                    return { 
                        url: img.url, 
                        x: img.x, 
                        y: img.y, 
                        width: img.width, 
                        height: img.height,
                        isUserUpload: img.isUserUpload || false,
                        artworkId: img.artworkId || null
                    };
                });
            } else {
                designStates.back.uploadedImages = uploadedImages.map(function(img) {
                    return { 
                        url: img.url, 
                        x: img.x, 
                        y: img.y, 
                        width: img.width, 
                        height: img.height,
                        isUserUpload: img.isUserUpload || false,
                        artworkId: img.artworkId || null
                    };
                });
            }
            
            // V12.12: Extract ALL image URLs from both sides (for admin to download)
            var frontUserUploads = [];
            var backUserUploads = [];
            
            // Get ALL uploaded images from FRONT side
            if (designStates.front.uploadedImages && designStates.front.uploadedImages.length > 0) {
                frontUserUploads = designStates.front.uploadedImages.map(function(img) {
                    return img.url;
                }).filter(function(url) { return url && url.length > 0; });
            }
            
            // Get ALL uploaded images from BACK side
            if (designStates.back.uploadedImages && designStates.back.uploadedImages.length > 0) {
                backUserUploads = designStates.back.uploadedImages.map(function(img) {
                    return img.url;
                }).filter(function(url) { return url && url.length > 0; });
            }
            
            console.log('📎 V12.12: Front designStates:', designStates.front.uploadedImages);
            console.log('📎 V12.12: Back designStates:', designStates.back.uploadedImages);
            console.log('📎 V12.12: Front ALL images:', frontUserUploads);
            console.log('📎 V12.12: Back ALL images:', backUserUploads);
            
            var customizationData = {
                frame_size: selectedFrameSize,
                frame_size_front: (typeof selectedFrameSizeBySide !== 'undefined' ? selectedFrameSizeBySide.front : null),
                frame_size_back: (typeof selectedFrameSizeBySide !== 'undefined' ? selectedFrameSizeBySide.back : null),
                design_image: urls.front || urls.back,
                attachment_url: '',
                text_elements: designStates[designStates.currentSide].textElements || [],
                uploaded_images: designStates[designStates.currentSide].uploadedImages || [],
                front_design: urls.front,
                back_design: urls.back,
                both_customized: bothSides,
                // V12.12: Original uploaded images (for admin to download)
                front_uploaded_images: frontUserUploads,
                back_uploaded_images: backUserUploads
            };
            
            console.log('🎨 V12.10: FINAL DATA:');
            console.log('🎨 V12.10: front_design:', customizationData.front_design);
            console.log('🎨 V12.10: back_design:', customizationData.back_design);
            console.log('🎨 V12.10: both_customized:', customizationData.both_customized);
            
            var postData = 'action=cdbt_add_to_cart';
            postData += '&nonce=' + encodeURIComponent(cdbt_ajax.nonce);
            postData += '&product_id=' + encodeURIComponent(cdbtDesignData.productId);
            postData += '&variation_id=' + encodeURIComponent(varId || '0');
            postData += '&customization_data=' + encodeURIComponent(JSON.stringify(customizationData));
            
            $.ajax({
                url: cdbt_ajax.ajax_url,
                type: 'POST',
                data: postData,
                success: function(response) {
                    if (response.success) {
                        console.log('✅ V12.10: Added to cart successfully!');
                        alert(response.data.message);
                        window.location.href = response.data.cart_url;
                    } else {
                        console.log('❌ V12.10: Add to cart failed:', response.data);
                        $('#cdbt-add-to-cart').attr("disabled", false);
                        $('#cdbt-add-to-cart').html("ADD TO CART");
                        alert('Error: ' + response.data);
                    }
                },
                error: function(xhr) {
                    console.log('❌ V12.10: Add to cart AJAX error:', xhr);
                    $('#cdbt-add-to-cart').attr("disabled", false);
                    $('#cdbt-add-to-cart').html("ADD TO CART");
                    alert('Failed to add to cart. Please try again.');
                }
            });
        }
    }
});





    // ============================================================

    // ============================================================
    // ENHANCED COLOR HANDLER WITH FRONT/BACK STATE MANAGEMENT
    // ============================================================
    
    console.log('Installing ENHANCED color handler with front/back states...');
    
    // State management for front and back designs
    var designStates = {
        front: {
            canvasJSON: null,
            textElements: [],
            uploadedImages: [],
            imageUrl: null
        },
        back: {
            canvasJSON: null,
            textElements: [],
            uploadedImages: [],
            imageUrl: null
        },
        currentSide: 'front'
    };
    
    // V12 FIX: Make designStates accessible globally for artwork enable/disable
    window.designStates = designStates;
    
    var currentColorPhotos = {
        front: null,
        back: null
    };
    
    // Debounce guard for repeated same-side clicks
    var sideSwitchGuard = { side: null, ts: 0 };
    // Last-wins token to cancel in-flight side switches
    var sideSwitchToken = 0;
    
    // V12.10: Make currentColorPhotos accessible globally
    window.currentColorPhotos = currentColorPhotos;
    
    // V12.7: Get current side from UI (which photo is highlighted)
    function getCurrentSideFromUI() {
        var currentSide = 'front'; // Default
        
        $('.cdbt-gallery-photo').each(function() {
            var $photo = $(this);
            var borderColor = $photo.css('border-color');
            var style = $photo.attr('style') || '';
            
            // Check multiple ways border might be green
            var isHighlighted = false;
            
            // Check CSS border-color (different browsers return different formats)
            if (borderColor) {
                // rgb(70, 180, 80) or #46b450
                if (borderColor.indexOf('70') > -1 && borderColor.indexOf('180') > -1 && borderColor.indexOf('80') > -1) {
                    isHighlighted = true;
                }
                if (borderColor.indexOf('46b450') > -1) {
                    isHighlighted = true;
                }
            }
            
            // Check inline style
            if (style.indexOf('46b450') > -1 || style.indexOf('rgb(70, 180, 80)') > -1) {
                isHighlighted = true;
            }
            
            if (isHighlighted) {
                currentSide = $photo.data('side') || 'front';
                console.log('🔍 V12.7: Found highlighted photo:', currentSide);
                return false; // Break .each()
            }
        });
        
        console.log('🔍 V12.7: Current side detected:', currentSide);
        return currentSide;
    }
    
    // Visually highlight the selected side in the gallery
    function highlightSelectedSide(side) {
        try {
            var $photos = $('.cdbt-gallery-photo');
            if ($photos && $photos.length) {
                $photos.removeClass('cdbt-selected-side')
                       .css({ borderColor: '', boxShadow: '' });
                var $active = $('.cdbt-gallery-photo[data-side="' + side + '"]');
                if ($active && $active.length) {
                    $active.addClass('cdbt-selected-side')
                           .css({ borderColor: '#46b450', boxShadow: '0 0 0 2px #46b450 inset' });
                }
            }
        } catch (e) {}
    }
    
    // Ensure upload button reflects the ACTIVE side's state only
    function refreshUploadButtonForActiveSide() {
        try {
            var hasUpload = Array.isArray(uploadedImages) && uploadedImages.length > 0;
            var hasText = typeof selectedTextElement !== 'undefined' && selectedTextElement !== null;
            var hasCanvasImage = (typeof canvas !== 'undefined' && canvas && canvas.selectedImageElement) ? true : false;
            var shouldDisable = !!(hasUpload || hasText || hasCanvasImage);
            if (shouldDisable) {
                $('#cdbt-upload-image').prop('disabled', true).css({ opacity: '0.5', cursor: 'not-allowed' });
            } else {
                $('#cdbt-upload-image').prop('disabled', false).css({ opacity: '1', cursor: 'pointer' });
            }
        } catch (e) {}
    }
    
    // Enable/disable gallery interactivity briefly during side switch
    function setGalleryInteractivity(enabled) {
        try {
            var $gallery = $('#cdbt-photo-gallery, .cdbt-gallery-photo');
            if (!$gallery.length) return;
            if (enabled) {
                $gallery.css({ pointerEvents: '', opacity: '' }).removeClass('cdbt-switching');
            } else {
                $gallery.css({ pointerEvents: 'none', opacity: '0.9' }).addClass('cdbt-switching');
            }
        } catch (e) {}
    }
    
    // Save current canvas state before switching
    function saveCurrentState() {
        // V12.8: Use designStates.currentSide directly (more reliable)
        var side = designStates.currentSide || 'front';
        console.log('💾 V12.8: saveCurrentState() using side:', side);
        saveCurrentStateForSide(side);
    }
    
    // V12.8: New function that takes explicit side parameter
    function saveCurrentStateForSide(side) {
        console.log('💾 V12.8: Saving', side, 'state explicitly...');
        
        // Check if canvas is a Fabric canvas (has toJSON method)
        if (typeof canvas !== 'undefined' && canvas && typeof canvas.toJSON === 'function') {
            try {
                designStates[side].canvasJSON = JSON.stringify(canvas.toJSON());
                console.log('✅ Canvas saved for', side);
            } catch (e) {
                console.log('⚠️ Could not save canvas:', e);
            }
        } else {
            console.log('⚠️ Canvas not ready or not Fabric canvas');
        }
        
        // Save text elements if they exist
        if (typeof textElements !== 'undefined') {
            designStates[side].textElements = JSON.parse(JSON.stringify(textElements));
        }
        
        // Save uploaded images if they exist (URL, position, dimensions)
        if (typeof uploadedImages !== 'undefined') {
            // Save without the img DOM element (can't be serialized)
            designStates[side].uploadedImages = uploadedImages.map(function(imgEl) {
                return {
                    x: imgEl.x,
                    y: imgEl.y,
                    width: imgEl.width,
                    height: imgEl.height,
                    url: imgEl.url,
                    rotation: imgEl.rotation || 0,
                    // V12.12: Preserve isUserUpload flag to identify customer uploads
                    isUserUpload: imgEl.isUserUpload || false,
                    artworkId: imgEl.artworkId || null
                    // Note: img property (DOM element) not saved
                };
            });
            console.log('💾 Saved', designStates[side].uploadedImages.length, 'image URLs');
        }
        
        console.log('✅', side, 'state saved:', designStates[side]);
    }
    
    // Helper function to reload images from saved data
    function reloadUploadedImages(imageDataArray, callback) {
        if (!imageDataArray || imageDataArray.length === 0) {
            if (callback) callback([]);
            return;
        }
        
        console.log('🔄 Reloading', imageDataArray.length, 'images from URLs...');
        var loadedImages = [];
        var loadedCount = 0;
        
        imageDataArray.forEach(function(imgData, index) {
            var img = new Image();
            img.onload = function() {
                loadedImages[index] = {
                    img: img,  // Actual Image object
                    x: imgData.x,
                    y: imgData.y,
                    width: imgData.width,
                    height: imgData.height,
                    url: imgData.url,
                    rotation: imgData.rotation || 0
                };
                loadedCount++;
                console.log('✅ Loaded image', loadedCount, '/', imageDataArray.length);
                
                if (loadedCount === imageDataArray.length) {
                    console.log('✅ All images reloaded!');
                    if (callback) callback(loadedImages);
                }
            };
            img.onerror = function() {
                console.log('❌ Failed to load image:', imgData.url);
                loadedCount++;
                if (loadedCount === imageDataArray.length) {
                    if (callback) callback(loadedImages.filter(function(img) { return img; }));
                }
            };
            img.src = imgData.url;
        });
    }
    
    // Load saved state when switching
    function loadSavedState(side, fallbackImageUrl) {
        console.log('📂 V12.7: Loading', side, 'state...');
        var myToken = ++sideSwitchToken;
        setGalleryInteractivity(false);
        // Safety: ensure interactivity re-enables even if callbacks are skipped
        setTimeout(function(){ setGalleryInteractivity(true); }, 800);
        // If clicking the same side rapidly, skip to avoid clearing state
        try {
            var nowTs = Date.now();
            // Unconditional guard: clicking the already active side should do nothing
            if ((designStates.currentSide || 'front') === side) {
                highlightSelectedSide(side);
                console.log('↩️ V12.13: Same side click; skipping reload');
                return;
            }
        } catch (e) {}
        
        // V12.7: Get fallback URL from clicked photo if not provided
        if (!fallbackImageUrl) {
            var $clickedPhoto = $('.cdbt-gallery-photo[data-side="' + side + '"]');
            if ($clickedPhoto.length > 0) {
                fallbackImageUrl = $clickedPhoto.data('url');
                console.log('🔍 V12.7: Got fallback URL from photo:', fallbackImageUrl);
            }
        }
        
        // V12.1 FIX: Clear selections when switching sides
        selectedArtwork = null;
        selectedTextElement = null;
        if (typeof canvas !== 'undefined' && canvas) {
            canvas.selectedImageElement = null;
        }
        // V12.1: Also hide delete controls
        if (typeof hideDeleteControls === 'function') {
            hideDeleteControls();
        }
        console.log('🔄 V12.1: Cleared selections for side switch');
        
        // First restore text elements
        if (typeof textElements !== 'undefined') {
            if (designStates[side].textElements && designStates[side].textElements.length > 0) {
                textElements.length = 0; // V12.12: Clear array without reassigning
                var newElements = JSON.parse(JSON.stringify(designStates[side].textElements));
                for (var i = 0; i < newElements.length; i++) {
                    textElements.push(newElements[i]);
                }
                console.log('📝 Restored', textElements.length, 'text elements');
            } else {
                // V12.2: Clear textElements if no saved state for this side
                textElements.length = 0; // V12.12: Clear without reassigning
                console.log('📝 V12.2: Cleared textElements for side switch');
            }
        }
        
        // Reload uploaded images from URLs (this recreates Image objects)
        var savedImageData = designStates[side].uploadedImages;
        if (savedImageData && savedImageData.length > 0) {
            console.log('🔄 Reloading', savedImageData.length, 'uploaded images...');
            reloadUploadedImages(savedImageData, function(reloadedImages) {
                if (myToken !== sideSwitchToken) {
                    console.log('⏭️ V12.13: Stale reload callback ignored for', side);
                    return;
                }
                // Replace uploadedImages with newly loaded ones
                uploadedImages = reloadedImages;
                console.log('✅ Reloaded', uploadedImages.length, 'images with Image objects');
                
                // Now load canvas and redraw
                if (myToken === sideSwitchToken) {
                    loadCanvasForSide(side, fallbackImageUrl);
                    // Update upload button based on this side's state
                    refreshUploadButtonForActiveSide();
                }
            });
        } else {
            // No uploaded images, just load canvas
            if (myToken !== sideSwitchToken) {
                console.log('⏭️ V12.13: Stale no-image path ignored for', side);
                return;
            }
            uploadedImages = [];
            loadCanvasForSide(side, fallbackImageUrl);
            // Update upload button for empty side
            refreshUploadButtonForActiveSide();
        }
        
        if (myToken === sideSwitchToken) {
            designStates.currentSide = side;
            sideSwitchGuard.side = side;
            sideSwitchGuard.ts = Date.now();
            highlightSelectedSide(side);
        }
        
        // Restore per-side frame size selection and UI
        try {
            var fs = (typeof selectedFrameSizeBySide !== 'undefined') ? selectedFrameSizeBySide[side] : null;
            if (fs) {
                selectedFrameSize = fs;
                var idx = -1;
                if (typeof cdbtDesignData !== 'undefined' && Array.isArray(cdbtDesignData.frameSizes)) {
                    for (var i = 0; i < cdbtDesignData.frameSizes.length; i++) {
                        var it = cdbtDesignData.frameSizes[i];
                        if ((it && fs && it.size === fs.size) || (String(it.price) === String(fs.price))) {
                            idx = i;
                            break;
                        }
                    }
                }
                $('input[name="cdbt_frame_size"]').prop('checked', false);
                if (idx >= 0) {
                    $('input[name="cdbt_frame_size"][value="' + idx + '"]').prop('checked', true);
                }
                var priceDisplay = '';
                if (fs && fs.price) {
                    var p = parseFloat(fs.price);
                    if (!isNaN(p)) {
                        priceDisplay = ' (+' + (cdbtDesignData && cdbtDesignData.currency ? cdbtDesignData.currency : '') + p.toFixed(2) + ')';
                    }
                }
                $('#cdbt-selected-frame-price').html('<strong>Selected:</strong> ' + (fs.size || '') + priceDisplay).show();
            } else {
                selectedFrameSize = null;

                $('input[name="cdbt_frame_size"]').prop('checked', false);

                $('#cdbt-selected-frame-price').hide();
            }
        } catch (e) {}
        
        // V12 FIX: Refresh artwork display after side switch
        setTimeout(function() {
            if (myToken !== sideSwitchToken) {
                console.log('⏭️ V12.13: Stale refresh ignored for', side);
                return;
            }
            if (typeof displayArtworks === 'function' && artworksList && artworksList.length > 0) {
                console.log('🎨 V12: Refreshing artworks for', side, 'side');
                displayArtworks(artworksList);
            }
            // Final safety: ensure upload button matches active side after all UI updates
            refreshUploadButtonForActiveSide();
            // Re-enable gallery interactions after switch settles
            setGalleryInteractivity(true);
        }, 120);
    }
    
    // V12.8: Expose functions globally for mobile fallback handlers
    window.saveCurrentState = saveCurrentState;
    window.saveCurrentStateForSide = saveCurrentStateForSide;
    window.loadSavedState = loadSavedState;
    window.getCurrentSideFromUI = getCurrentSideFromUI;
    window.highlightSelectedSide = highlightSelectedSide;
    console.log('🔗 V12.8: State functions exposed globally');
    
    // Initial highlight after gallery renders
    try {
        setTimeout(function(){ highlightSelectedSide(designStates.currentSide || 'front'); }, 300);
        setTimeout(function(){ highlightSelectedSide(designStates.currentSide || 'front'); }, 1200);
    } catch (e) {}
    
    // Helper to load canvas for a side

    function loadCanvasForSide(side, fallbackImageUrl) {

        console.log('🎨 V12.7: loadCanvasForSide called for', side);
        console.log('   - currentColorPhotos[' + side + ']:', currentColorPhotos[side]);
        console.log('   - fallbackImageUrl:', fallbackImageUrl);
        
        // V12.7: Determine which image URL to use
        var imageUrlToLoad = currentColorPhotos[side] || fallbackImageUrl;
        
        // Check if canvas is a Fabric canvas
        if (typeof canvas !== 'undefined' && canvas && typeof canvas.loadFromJSON === 'function') {
            if (designStates[side].canvasJSON) {
                try {
                    canvas.loadFromJSON(designStates[side].canvasJSON, function() {
                        canvas.renderAll();
                        console.log('✅ Canvas loaded for', side);
                        
                        // Redraw uploaded images on top
                        if (uploadedImages.length > 0 && typeof redrawCanvas === 'function') {
                            setTimeout(function() {
                                console.log('🎨 Redrawing', uploadedImages.length, 'uploaded images');
                                if (typeof redrawCanvas === 'function') redrawCanvas();
                            }, 100);
                        }
                    });
                } catch (e) {
                    console.log('⚠️ Could not load canvas state:', e);
                }
            } else {
                // Clear canvas if no saved state
                canvas.clear();
                // Load the side's base image
                if (imageUrlToLoad) {
                    console.log('🖼️ V12.7: Loading base image for', side, ':', imageUrlToLoad);
                    if (typeof loadImage === 'function') {
                        loadImage(imageUrlToLoad);
                        
                        // After base image loads, redraw uploaded images
                        if (uploadedImages.length > 0 && typeof redrawCanvas === 'function') {
                            setTimeout(function() {
                                console.log('🎨 Redrawing', uploadedImages.length, 'uploaded images on new side');
                                if (typeof redrawCanvas === 'function') redrawCanvas();
                            }, 500);
                        }
                    }
                } else {
                    console.log('⚠️ V12.7: No image URL available for', side);
                }
            }
        } else {
            // Canvas not Fabric yet - just load the image directly
            console.log('⚠️ Canvas not ready yet, loading image directly');
            if (imageUrlToLoad && typeof loadImage === 'function') {
                console.log('🖼️ V12.7: Loading base image for', side, ':', imageUrlToLoad);
                loadImage(imageUrlToLoad);
                
                // Redraw uploaded images after delay
                if (uploadedImages.length > 0 && typeof redrawCanvas === 'function') {
                    setTimeout(function() {
                        console.log('🎨 Redrawing', uploadedImages.length, 'uploaded images');
                        if (typeof redrawCanvas === 'function') redrawCanvas();
                    }, 800);
                }
            } else {
                console.log('⚠️ V12.7: No image URL available for', side);
            }
        }
        
        console.log('✅ Switched to', side, 'side');
    }
    
    // Wait for page to fully load
    $(window).on('load', function() {
        console.log('Window loaded, setting up enhanced color handler...');
        
        var attempts = 0;
        var maxAttempts = 10;
        
        function tryInstallHandler() {
            attempts++;
            console.log('Attempt', attempts, 'to install handler');
            
            // Check if LEFT side color select exists (variation selector) - try multiple selectors
            var $leftColorSelect = null;
            
            // Try different selectors for color dropdown
            var selectors = [
                'select[name="attribute_pa_color"]',
                '#pa_color',
                '.cdbt-left-variation-select',
                'select.variation-select',
                '.variations select',
                '[data-attribute_name="attribute_pa_color"]'
            ];
            
            for (var i = 0; i < selectors.length; i++) {
                var $found = $(selectors[i]);
                if ($found.length > 0) {
                    $leftColorSelect = $found;
                    console.log('Found color selector with:', selectors[i]);
                    break;
                }
            }
            
            if (!$leftColorSelect || $leftColorSelect.length === 0) {
                console.log('Left color select not found yet, tried selectors:', selectors);
                if (attempts < maxAttempts) {
                    setTimeout(tryInstallHandler, 500);
                } else {
                    console.log('CDBT: Max attempts reached, proceeding without color dropdown');
                    // Force load first color anyway
                    if (typeof cdbtDesignData !== 'undefined' && cdbtDesignData.colorPhotos) {
                        var colors = Object.keys(cdbtDesignData.colorPhotos);
                        if (colors.length > 0) {
                            console.log('CDBT: Loading first color photos directly:', colors[0]);
                            updatePhotosForColor(colors[0]);
                        }
                    }
                }
                return;
            }
            
            // Check if data exists
            if (typeof cdbtDesignData === 'undefined') {
                console.log('cdbtDesignData not defined yet');
                if (attempts < maxAttempts) {
                    setTimeout(tryInstallHandler, 500);
                }
                return;
            }
            
            console.log('✅ Everything ready! Installing enhanced handler...');
            console.log('Left color dropdown found:', $leftColorSelect);
            console.log('Color photos available:', cdbtDesignData.colorPhotos);
            
            // Remove any previous handlers
            $leftColorSelect.off('change.colorphotos');
            $(document).off('click.colorphotos', '.cdbt-gallery-photo');
            
            // Function to update photos based on color
            function updatePhotosForColor(color) {
                color = color.toLowerCase();
                console.log('🎨 Color changed to:', color);
                
                if (!color) {
                    $('#cdbt-photo-gallery').html('');
                    return;
                }
                
                if (!cdbtDesignData.colorPhotos || !cdbtDesignData.colorPhotos[color]) {
                    console.log('❌ No photos for color:', color);
                    $('#cdbt-photo-gallery').html('<p style="color: red; padding: 10px;">No photos available for ' + color + '</p>');
                    return;
                }
                
                var photos = cdbtDesignData.colorPhotos[color];
                console.log('📸 Photos found:', photos);
                
                // Store current color photos
                currentColorPhotos.front = photos.front || null;
                currentColorPhotos.back = photos.back || null;
                
                var $gallery = $('#cdbt-photo-gallery');
                $gallery.html('');
                
                // Add front photo
                if (photos.front) {
                    console.log('✅ Adding FRONT photo');
                    $gallery.append(
                        '<div class="cdbt-gallery-photo" data-side="front" data-url="' + photos.front + '" style="position: relative; display: inline-block; margin: 5px; cursor: pointer; border: 3px solid #46b450; padding: 5px; background: #f9f9f9; border-radius: 8px;">' +
                            '<img src="' + photos.front + '" style="width: 150px; height: 150px; object-fit: cover; border-radius: 4px;" />' +
                            '<div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">FRONT</div>' +
                        '</div>'
                    );
                }
                
                // Add back photo
                if (photos.back) {
                    console.log('✅ Adding BACK photo');
                    $gallery.append(
                        '<div class="cdbt-gallery-photo" data-side="back" data-url="' + photos.back + '" style="position: relative; display: inline-block; margin: 5px; cursor: pointer; border: 3px solid transparent; padding: 5px; background: #f9f9f9; border-radius: 8px;">' +
                            '<img src="' + photos.back + '" style="width: 150px; height: 150px; object-fit: cover; border-radius: 4px;" />' +
                            '<div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">BACK</div>' +
                        '</div>'
                    );
                }
                
                console.log('✅ Photos added to gallery!');
                
                // Load and select FRONT by default via unified switch path
                if (photos.front) {
                    console.log('Loading front by default via loadSavedState');
                    try { if (typeof highlightSelectedSide === 'function') highlightSelectedSide('front'); } catch (e) {}
                    if (typeof window.loadSavedState === 'function') {
                        window.loadSavedState('front', photos.front);
                    } else if (typeof loadImage === 'function') {
                        loadImage(photos.front);
                        designStates.currentSide = 'front';
                    }
                }
            }
            
            // Listen to LEFT color dropdown change
            $leftColorSelect.on('change.colorphotos', function() {
                var color = $(this).val();
                console.log('LEFT dropdown changed:', color);
                
                // When color changes, just clear states (don't save current canvas)
                // User will start fresh with new color
                console.log('Clearing states for new color');
                designStates.front = {
                    canvasJSON: null,
                    textElements: [],
                    uploadedImages: [],
                    imageUrl: null
                };
                designStates.back = {
                    canvasJSON: null,
                    textElements: [],
                    uploadedImages: [],
                    imageUrl: null
                };
                designStates.currentSide = 'front';
                
                // Load photos for new color
                updatePhotosForColor(color);
            });
            
            // V12.7: Install BOTH click AND touch handlers for front/back switching
            $(document).off('click.colorphotos touchend.colorphotos', '.cdbt-gallery-photo');
            
            // V12.8: Touch handler for mobile (fires BEFORE click)
            $(document).on('touchend.colorphotos', '.cdbt-gallery-photo', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                var imageUrl = $(this).data('url');
                var side = $(this).data('side');
                
                console.log('📱 V12.8: Touch on photo:', side, imageUrl);
                
                // V12.8 FIX: Get current side BEFORE changing border!
                var currentSide = designStates.currentSide || 'front';
                console.log('🔍 V12.8: Current side BEFORE switch:', currentSide);
                
                // V12.8: Only save if switching to DIFFERENT side
                if (currentSide !== side) {
                    // V12.8: Save state for CURRENT side (not the one being clicked!)
                    saveCurrentStateForSide(currentSide);
                }
                
                // NOW change border (after saving)
                $('.cdbt-gallery-photo').css('border-color', 'transparent');
                $(this).css('border-color', '#46b450');
                
                // Load saved state for clicked side
                if (typeof window.loadSavedState === 'function') {
                    window.loadSavedState(side);
                } else if (typeof loadImage === 'function') {
                    loadImage(imageUrl);
                }
                
                // Mark as handled
                $(this).data('touch-handled', true);
                var $this = $(this);
                setTimeout(function() {
                    $this.data('touch-handled', false);
                }, 500);
                
                // Refresh artwork display
                setTimeout(function() {
                    if (typeof displayArtworks === 'function' && artworksList && artworksList.length > 0) {
                        displayArtworks(artworksList);
                    }
                }, 200);
                
                console.log('✅ V12.8: Touch switched to', side);
            });
            
            // V12.8: Click handler (desktop)
            $(document).on('click.colorphotos', '.cdbt-gallery-photo', function(e) {
                // Skip if touch already handled
                if ($(this).data('touch-handled')) {
                    console.log('⚠️ V12.8: Click ignored, touch already handled');
                    e.preventDefault();
                    return;
                }
                
                var imageUrl = $(this).data('url');
                var side = $(this).data('side');
                
                console.log('🖱️ V12.8: Click on photo:', side, imageUrl);
                
                // V12.8 FIX: Get current side BEFORE changing border!
                var currentSide = designStates.currentSide || 'front';
                console.log('🔍 V12.8: Current side BEFORE switch:', currentSide);
                
                // V12.8: Only save if switching to DIFFERENT side
                if (currentSide !== side) {
                    // V12.8: Save state for CURRENT side (not the one being clicked!)
                    saveCurrentStateForSide(currentSide);
                }
                
                // NOW change border (after saving)
                $('.cdbt-gallery-photo').css('border-color', 'transparent');
                $(this).css('border-color', '#46b450');
                
                // Load saved state for clicked side
                if (typeof window.loadSavedState === 'function') {
                    window.loadSavedState(side);
                } else if (typeof loadImage === 'function') {
                    loadImage(imageUrl);
                }
                
                // Refresh artwork display
                setTimeout(function() {
                    if (typeof displayArtworks === 'function' && artworksList && artworksList.length > 0) {
                        displayArtworks(artworksList);
                    }
                }, 200);
                
                console.log('✅ V12.8: Switched to', side);
            });
            
            console.log('✅ Enhanced color handler installed!');
            
            // Hide right side color dropdown (we're using left variation dropdown)
            $('#cdbt-color-select').hide();
            $('#cdbt-color-select').closest('.cdbt-control-section').hide();
            console.log('✅ Right side color dropdown hidden');
            
            // Auto-trigger for initial color
            setTimeout(function() {
                var initialColor = $leftColorSelect.val();
                if (initialColor) {
                    console.log('🎯 Auto-loading photos for:', initialColor);
                    updatePhotosForColor(initialColor);
                } else {
                    // MOBILE FALLBACK: If no color selected, use first available
                    console.log('🎯 No color selected, using first available color');
                    var colors = Object.keys(cdbtDesignData.colorPhotos || {});
                    if (colors.length > 0) {
                        updatePhotosForColor(colors[0]);
                    }
                }
            }, 1000);
        }
        
        // Start trying
        tryInstallHandler();
        
        // MOBILE FALLBACK: Force load photos after timeout even if handler fails
        setTimeout(function() {
            console.log('CDBT: Mobile fallback - checking if gallery loaded...');
            var $gallery = $('#cdbt-photo-gallery');
            
            // If gallery is empty, force load first color photos
            if ($gallery.length > 0 && $.trim($gallery.html()) === '') {
                console.log('CDBT: Gallery empty, forcing load of first color photos');
                
                if (typeof cdbtDesignData !== 'undefined' && cdbtDesignData.colorPhotos) {
                    var colors = Object.keys(cdbtDesignData.colorPhotos);
                    if (colors.length > 0) {
                        var firstColor = colors[0];
                        var photos = cdbtDesignData.colorPhotos[firstColor];
                        
                        console.log('CDBT: Force loading photos for:', firstColor, photos);
                        
                        // V12.10 FIX: Set currentColorPhotos for mobile fallback!
                        if (typeof currentColorPhotos !== 'undefined') {
                            currentColorPhotos.front = photos.front || null;
                            currentColorPhotos.back = photos.back || null;
                            console.log('📱 V12.10: Set currentColorPhotos:', currentColorPhotos);
                        } else {
                            // Create global reference
                            window.currentColorPhotos = {
                                front: photos.front || null,
                                back: photos.back || null
                            };
                            console.log('📱 V12.10: Created window.currentColorPhotos:', window.currentColorPhotos);
                        }
                        
                        // Manually add photos to gallery
                        if (photos && photos.front) {
                            $gallery.append(
                                '<div class="cdbt-gallery-photo" data-side="front" data-url="' + photos.front + '" style="position: relative; display: inline-block; margin: 5px; cursor: pointer; border: 3px solid #46b450; padding: 5px; background: #f9f9f9; border-radius: 8px;">' +
                                    '<img src="' + photos.front + '" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;" />' +
                                    '<div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">FRONT</div>' +
                                '</div>'
                            );
                        }
                        
                        if (photos && photos.back) {
                            $gallery.append(
                                '<div class="cdbt-gallery-photo" data-side="back" data-url="' + photos.back + '" style="position: relative; display: inline-block; margin: 5px; cursor: pointer; border: 3px solid transparent; padding: 5px; background: #f9f9f9; border-radius: 8px;">' +
                                    '<img src="' + photos.back + '" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;" />' +
                                    '<div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">BACK</div>' +
                                '</div>'
                            );
                        }
                        
                        console.log('CDBT: Gallery photos added via fallback!');
                        
                        // V12.8: Install BOTH click AND touch handlers for mobile
                        $(document).off('click.mobilefallback touchend.mobilefallback', '.cdbt-gallery-photo');
                        
                        // V12.8: Touch handler for mobile (fires first)
                        $(document).on('touchend.mobilefallback', '.cdbt-gallery-photo', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            var imageUrl = $(this).data('url');
                            var side = $(this).data('side');
                            console.log('📱 V12.8: Mobile fallback TOUCH:', side, imageUrl);
                            
                            // V12.8 FIX: Get current side BEFORE changing border!
                            var currentSide = (typeof window.designStates !== 'undefined' && window.designStates.currentSide) ? window.designStates.currentSide : 'front';
                            console.log('🔍 V12.8: Current side BEFORE switch:', currentSide);
                            
                            // V12.8: Only save if switching to DIFFERENT side
                            if (currentSide !== side && typeof window.saveCurrentStateForSide === 'function') {
                                window.saveCurrentStateForSide(currentSide);
                            }
                            
                            // NOW change border (after saving)
                            $('.cdbt-gallery-photo').css('border-color', 'transparent');
                            $(this).css('border-color', '#46b450');
                            
                            // V12.8: Load saved state OR fallback to loadImage
                            if (typeof window.loadSavedState === 'function') {
                                window.loadSavedState(side);
                            } else if (typeof loadImage === 'function') {
                                loadImage(imageUrl);
                            }
                            
                            // Mark as handled
                            $(this).data('touch-handled', true);
                            setTimeout(function() {
                                $(this).data('touch-handled', false);
                            }.bind(this), 500);
                            
                            // Refresh artworks
                            setTimeout(function() {
                                if (typeof displayArtworks === 'function' && artworksList && artworksList.length > 0) {
                                    displayArtworks(artworksList);
                                }
                            }, 200);
                        });
                        
                        // V12.8: Click handler (desktop + fallback)
                        $(document).on('click.mobilefallback', '.cdbt-gallery-photo', function(e) {
                            // Skip if touch handled
                            if ($(this).data('touch-handled')) {
                                console.log('⚠️ V12.8: Mobile fallback click ignored, touch handled');
                                return;
                            }
                            
                            var imageUrl = $(this).data('url');
                            var side = $(this).data('side');
                            console.log('🖱️ V12.8: Mobile fallback click:', side, imageUrl);
                            
                            // V12.8 FIX: Get current side BEFORE changing border!
                            var currentSide = (typeof window.designStates !== 'undefined' && window.designStates.currentSide) ? window.designStates.currentSide : 'front';
                            console.log('🔍 V12.8: Current side BEFORE switch:', currentSide);
                            
                            // V12.8: Only save if switching to DIFFERENT side
                            if (currentSide !== side && typeof window.saveCurrentStateForSide === 'function') {
                                window.saveCurrentStateForSide(currentSide);
                            }
                            
                            // NOW change border (after saving)
                            $('.cdbt-gallery-photo').css('border-color', 'transparent');
                            $(this).css('border-color', '#46b450');
                            
                            // V12.8: Load saved state OR fallback to loadImage
                            if (typeof window.loadSavedState === 'function') {
                                window.loadSavedState(side);
                            } else if (typeof loadImage === 'function') {
                                loadImage(imageUrl);
                            }
                            
                            // Refresh artworks
                            setTimeout(function() {
                                if (typeof displayArtworks === 'function' && artworksList && artworksList.length > 0) {
                                    displayArtworks(artworksList);
                                }
                            }, 200);
                        });
                    }
                }
            } else {
                console.log('CDBT: Gallery already has content or not found');
            }
        }, 3000); // Wait 3 seconds then check
    });
    
    // Expose function to get both designs for add to cart
    window.getBothDesigns = function() {
        console.log('Getting both front and back designs...');
        
        // Save current state first
        saveCurrentState();
        

        var designs = {
            front: null,
            back: null

        };
        
        // Generate front design
        if (designStates.front.canvasJSON || currentColorPhotos.front) {
            if (typeof canvas !== 'undefined' && canvas) {
                // Temporarily load front
                if (designStates.front.canvasJSON) {
                    canvas.loadFromJSON(designStates.front.canvasJSON, function() {
                        designs.front = canvas.toDataURL('image/png');


                        console.log('✅ Front design captured');
                    });
                } else if (currentColorPhotos.front) {
                    // Just the base image
                    designs.front = currentColorPhotos.front;
                }
            }
        }
        
        // Generate back design
        if (designStates.back.canvasJSON || currentColorPhotos.back) {
            if (typeof canvas !== 'undefined' && canvas) {
                // Temporarily load back
                if (designStates.back.canvasJSON) {
                    canvas.loadFromJSON(designStates.back.canvasJSON, function() {
                        designs.back = canvas.toDataURL('image/png');
                        console.log('✅ Back design captured');
                    });
                } else if (currentColorPhotos.back) {
                    // Just the base image
                    designs.back = currentColorPhotos.back;
                }
            }
        }
        
        // Restore current side
        loadSavedState(designStates.currentSide);
        
        console.log('Both designs ready:', designs);
        return designs;
    };
    
    // ============================================================
    // END ENHANCED COLOR HANDLER
    // ============================================================

$('#cdbt-add-to-cart1').click(function() {
        console.log('CDBT: Add to cart button clicked - ENHANCED VERSION with Front/Back');
        
        // Check if frame size is selected
        if (!selectedFrameSize) {
            alert('Please select a frame size.');
            return;
        }
        
        // For variable products, check if variation is selected
        var variationId = 0;
        if (cdbtDesignData.isVariable) {
            variationId = $('#cdbt-variation-id').val();
            console.log('CDBT: Variable product - Variation ID:', variationId);
            if (!variationId || variationId === '' || variationId === '0') {
                alert('Please select all product options.');
                return;
            }
        } else {
            variationId = cdbtDesignData.variationId || 0;
            console.log('CDBT: Simple product - Variation ID:', variationId);
        }
        
        console.log('CDBT: Capturing both front and back designs...');
        
        // V12.9 FIX: Save current state BEFORE capturing
        var currentSideBeforeCapture = designStates.currentSide || 'front';
        console.log('🔍 V12.9: Current side before capture:', currentSideBeforeCapture);
        
        // V12.9: Save current state using explicit side
        if (typeof saveCurrentStateForSide === 'function') {
            saveCurrentStateForSide(currentSideBeforeCapture);
            console.log('💾 V12.9: Saved', currentSideBeforeCapture, 'state before add to cart');
        }
        
        // V12.9: Debug - log what we have
        console.log('🔍 V12.9: designStates.front:', designStates.front);
        console.log('🔍 V12.9: designStates.back:', designStates.back);
        console.log('🔍 V12.9: Current uploadedImages:', uploadedImages);
        
        var frontImageData = null;
        var backImageData = null;
        var bothCustomized = false;
        
        // V12.9 FIX: Check for ANY customization, not just canvasJSON
        var frontHasContent = designStates.front.canvasJSON || 
                              (designStates.front.uploadedImages && designStates.front.uploadedImages.length > 0) ||
                              (designStates.front.textElements && designStates.front.textElements.length > 0);
        
        var backHasContent = designStates.back.canvasJSON || 
                             (designStates.back.uploadedImages && designStates.back.uploadedImages.length > 0) ||
                             (designStates.back.textElements && designStates.back.textElements.length > 0);
        
        console.log('🔍 V12.9: frontHasContent:', frontHasContent);
        console.log('🔍 V12.9: backHasContent:', backHasContent);
        
        // Capture front design
        if (frontHasContent) {
            console.log('✅ V12.9: Front has customization');
            
            // V12.9: For HTML5 canvas (non-Fabric), we need different approach
            if (typeof canvas !== 'undefined' && canvas && typeof canvas.loadFromJSON === 'function' && designStates.front.canvasJSON) {
                // Fabric canvas - use loadFromJSON
                try {
                    canvas.loadFromJSON(designStates.front.canvasJSON, function() {
                        frontImageData = canvas.toDataURL('image/png');
                        console.log('Front design captured via Fabric');
                        checkBothReady();
                    });
                } catch (e) {
                    console.log('⚠️ Could not capture front design via Fabric:', e);
                    frontImageData = 'none';
                    checkBothReady();
                }
            } else if (typeof canvas !== 'undefined' && canvas) {
                // V12.9: HTML5 canvas - generate design directly
                console.log('📱 V12.9: Using HTML5 canvas for front design');
                
                // Load front state and capture
                var originalSide = designStates.currentSide;
                var originalImages = uploadedImages.slice();
                var originalText = typeof textElements !== 'undefined' ? textElements.slice() : [];
                
                // Temporarily set to front
                if (designStates.front.uploadedImages) {
                    uploadedImages = [];
                    // Reload images
                    var frontImages = designStates.front.uploadedImages;
                    if (frontImages && frontImages.length > 0) {
                        var loadedCount = 0;
                        frontImages.forEach(function(imgData, index) {
                            var img = new Image();
                            img.crossOrigin = 'anonymous';
                            img.onload = function() {
                                uploadedImages.push({
                                    img: img,
                                    x: imgData.x,
                                    y: imgData.y,
                                    width: imgData.width,
                                    height: imgData.height,
                                    url: imgData.url,
                                    rotation: imgData.rotation || 0
                                });
                                loadedCount++;
                                if (loadedCount === frontImages.length) {
                                    if (designStates.front.textElements) {
                                        textElements.length = 0;
                                        designStates.front.textElements.forEach(function(t) { textElements.push(t); });
                                    }
                                    if (typeof redrawCanvas === 'function') {
                                        redrawCanvas();
                                    }
                                    setTimeout(function() {
                                        frontImageData = canvas.toDataURL('image/png');
                                        console.log('✅ V12.9: Front captured via HTML5 canvas');
                                        // Restore
                                        uploadedImages = originalImages;
                                        // V12.12: Clear and repopulate
                                        textElements.length = 0;
                                        originalText.forEach(function(t) { textElements.push(t); });
                                        designStates.currentSide = originalSide;
                                        if (typeof redrawCanvas === 'function') redrawCanvas();
                                        checkBothReady();
                                    }, 200);
                                }
                            };
                            img.onerror = function() {
                                loadedCount++;
                                if (loadedCount === frontImages.length) {
                                    frontImageData = 'none';
                                    checkBothReady();
                                }
                            };
                            img.src = imgData.url;
                        });
                    } else {
                        frontImageData = 'none';
                        checkBothReady();
                    }
                } else {
                    frontImageData = 'none';
                    checkBothReady();
                }
            } else {
                frontImageData = 'none';
                checkBothReady();
            }
        } else {
            console.log('⚠️ V12.9: Front has no customization');
            frontImageData = 'none';
            checkBothReady();
        }
        
        // Capture back design
        if (backHasContent) {
            console.log('✅ V12.9: Back has customization');
            
            // V12.9: For HTML5 canvas (non-Fabric), we need different approach
            if (typeof canvas !== 'undefined' && canvas && typeof canvas.loadFromJSON === 'function' && designStates.back.canvasJSON) {
                // Fabric canvas - use loadFromJSON
                try {
                    canvas.loadFromJSON(designStates.back.canvasJSON, function() {
                        backImageData = canvas.toDataURL('image/png');
                        console.log('Back design captured via Fabric');
                        checkBothReady();
                    });
                } catch (e) {
                    console.log('⚠️ Could not capture back design via Fabric:', e);
                    backImageData = 'none';
                    checkBothReady();
                }
            } else if (typeof canvas !== 'undefined' && canvas) {
                // V12.9: HTML5 canvas - generate design directly
                console.log('📱 V12.9: Using HTML5 canvas for back design');
                
                // Load back state and capture
                var backImages = designStates.back.uploadedImages;
                if (backImages && backImages.length > 0) {
                    var loadedCount = 0;
                    var tempUploadedImages = [];
                    
                    backImages.forEach(function(imgData, index) {
                        var img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = function() {
                            tempUploadedImages.push({
                                img: img,
                                x: imgData.x,
                                y: imgData.y,
                                width: imgData.width,
                                height: imgData.height,
                                url: imgData.url,
                                rotation: imgData.rotation || 0
                            });
                            loadedCount++;
                            if (loadedCount === backImages.length) {
                                // Temporarily swap
                                var origImages = uploadedImages;
                                var origText = textElements.slice(); // V12.12: Copy current
                                
                                uploadedImages = tempUploadedImages;
                                // V12.12: Clear and repopulate without reassigning
                                textElements.length = 0;
                                if (designStates.back.textElements) {
                                    designStates.back.textElements.forEach(function(t) { textElements.push(t); });
                                }
                                
                                if (typeof redrawCanvas === 'function') {
                                    redrawCanvas();
                                }
                                
                                setTimeout(function() {
                                    backImageData = canvas.toDataURL('image/png');
                                    console.log('✅ V12.9: Back captured via HTML5 canvas');
                                    
                                    // Restore current side - V12.12: Clear and repopulate
                                    uploadedImages = origImages;
                                    textElements.length = 0;
                                    origText.forEach(function(t) { textElements.push(t); });
                                    if (typeof redrawCanvas === 'function') redrawCanvas();
                                    
                                    checkBothReady();
                                }, 200);
                            }
                        };
                        img.onerror = function() {
                            loadedCount++;
                            if (loadedCount === backImages.length) {
                                backImageData = 'none';
                                checkBothReady();
                            }
                        };
                        img.src = imgData.url;
                    });
                } else if (designStates.back.textElements && designStates.back.textElements.length > 0) {
                    // Text only on back
                    var origImages = uploadedImages;
                    var origText = textElements.slice(); // V12.12: Copy current
                    
                    uploadedImages = [];
                    // V12.12: Clear and repopulate without reassigning
                    textElements.length = 0;
                    designStates.back.textElements.forEach(function(t) { textElements.push(t); });
                    
                    if (typeof redrawCanvas === 'function') {
                        redrawCanvas();
                    }
                    
                    setTimeout(function() {
                        backImageData = canvas.toDataURL('image/png');
                        console.log('✅ V12.9: Back (text only) captured');
                        
                        uploadedImages = origImages;
                        // V12.12: Clear and repopulate
                        textElements.length = 0;
                        origText.forEach(function(t) { textElements.push(t); });
                        if (typeof redrawCanvas === 'function') redrawCanvas();
                        
                        checkBothReady();
                    }, 200);
                } else {
                    backImageData = 'none';
                    checkBothReady();
                }
            } else {
                backImageData = 'none';
                checkBothReady();
            }
        } else {
            console.log('⚠️ V12.9: Back has no customization');
            backImageData = 'none';
            checkBothReady();
        }
        
        var readyCount = 0;
        function checkBothReady() {
            readyCount++;
            if (readyCount >= 2) {
                console.log('Both designs ready, proceeding...');
                proceedWithAddToCart();
            }
        }
        
        function proceedWithAddToCart() {
            // Restore current view
            if (typeof loadSavedState === 'function') {
                loadSavedState(designStates.currentSide);
            }
            
            // Determine if both sides are customized
            bothCustomized = (frontImageData && frontImageData !== 'none') && 
                            (backImageData && backImageData !== 'none');
            
            console.log('Front customized:', frontImageData !== 'none');
            console.log('Back customized:', backImageData !== 'none');
            console.log('Both customized:', bothCustomized);
            
            // Save designs via AJAX
            var designs = [];
            
            if (frontImageData && frontImageData !== 'none') {
                designs.push({side: 'front', data: frontImageData});
            }
            
            if (backImageData && backImageData !== 'none') {
                designs.push({side: 'back', data: backImageData});
            }
            
            if (designs.length === 0) {
                alert('Please customize at least one side (front or back).');
                return;
            }
            
            // Save all designs
            var savedUrls = {front: null, back: null};
            var savedCount = 0;
            
            designs.forEach(function(design) {
                $.ajax({
                    url: cdbt_ajax.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'cdbt_save_design',
                        nonce: cdbt_ajax.nonce,
                        image_data: design.data,
                        side: design.side
                    },
                    success: function(response) {
                        if (response.success) {
                            savedUrls[design.side] = response.data.url;
                            console.log('✅', design.side, 'design saved:', response.data.url);
                            savedCount++;
                            if (savedCount === designs.length) {
                                addToCartWithDesigns(savedUrls, bothCustomized, variationId);
                            }
                        } else {
                            alert('Failed to save ' + design.side + ' design.');
                        }
                    },
                    error: function() {
                        alert('Failed to save ' + design.side + ' design.');
                    }
                });
            });
        }
        
        function addToCartWithDesigns(urls, bothCustomized, variationId) {
            console.log('Adding to cart with designs:', urls);
            console.log('Both customized:', bothCustomized);
            
            // V12.12: Extract ALL image URLs from both sides
            var frontUploads = [];
            var backUploads = [];
            
            if (designStates.front.uploadedImages && designStates.front.uploadedImages.length > 0) {
                frontUploads = designStates.front.uploadedImages.map(function(img) {
                    return img.url;
                }).filter(function(url) { return url && url.length > 0; });
            }
            
            if (designStates.back.uploadedImages && designStates.back.uploadedImages.length > 0) {
                backUploads = designStates.back.uploadedImages.map(function(img) {
                    return img.url;
                }).filter(function(url) { return url && url.length > 0; });
            }
            
            console.log('📎 V12.12 (alt): Front uploads:', frontUploads);
            console.log('📎 V12.12 (alt): Back uploads:', backUploads);
            
            // Apply frame only if side has BOTH image and text
            var hasFrontImage = Array.isArray(designStates.front.uploadedImages) && designStates.front.uploadedImages.length > 0;
            var fsBack2  = (typeof selectedFrameSizeBySide !== 'undefined' ? selectedFrameSizeBySide.back : null);
            var customizationData = {
                frame_size_front: fsFront,
                frame_size_back: fsBack,
                front_design: urls.front,
                back_design: urls.back,
                both_customized: bothCustomized,
                text_elements: designStates[designStates.currentSide].textElements || [],
                uploaded_images: designStates[designStates.currentSide].uploadedImages || [],
                // V12.12: Original uploaded images for admin
                front_uploaded_images: frontUploads,
                back_uploaded_images: backUploads
            };
            
            $.ajax({
                url: cdbt_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'cdbt_add_to_cart',
                    nonce: cdbt_ajax.nonce,
                    product_id: cdbtDesignData.productId,
                    variation_id: variationId,
                    customization_data: JSON.stringify(customizationData)
                },
                success: function(response) {
                    if (response.success) {
                        alert(response.data.message);
                        window.location.href = response.data.cart_url;
                    } else {
                        alert('Error: ' + response.data);
                    }
                },
                error: function() {
                    alert('Failed to add to cart. Please try again.');
                }
            });
        }
    });
    // Initialize canvas - Mobile needs longer delay
    if (window.innerWidth <= 768) {
        console.log('CDBT: Mobile detected - Width:', window.innerWidth);
        // Wait for DOM to be fully ready and visible
        setTimeout(function() {
            console.log('CDBT: Mobile - Initializing canvas after 500ms delay');
            var canvasEl = document.getElementById('cdbt-design-canvas');
            if (canvasEl) {
                console.log('CDBT: Canvas found, initializing...');
                initCanvas();
                
                // MOBILE: Force load gallery photos after short delay
                setTimeout(function() {
                    console.log('CDBT: Mobile - Force loading gallery photos');
                    forceLoadGalleryPhotos();
                    installGalleryClickHandler();
                    installUniversalColorHandler(); // NEW: Color change handler
                }, 500);
            } else {
                console.error('CDBT: Canvas element still not found after delay!');
            }
        }, 500); // Increased delay for mobile
    } else {
        console.log('CDBT: Desktop detected - Immediate init');
        initCanvas();
        
        // Desktop: Also load gallery after short delay as backup
        setTimeout(function() {
            var $gallery = $('#cdbt-photo-gallery');
            if ($gallery.length > 0 && $gallery.find('.cdbt-gallery-photo').length === 0) {
                console.log('CDBT: Desktop - Gallery empty, force loading');
                forceLoadGalleryPhotos();
                installGalleryClickHandler();
            }
            installUniversalColorHandler(); // Always install color handler
        }, 1500);
    }
    
    // IMPORTANT: Hide delete controls on page load - they should only show when element is selected
    
    // Handle window resize for responsive canvas
    var resizeTimeout;
    $(window).on('resize orientationchange', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            console.log('CDBT: Window resized, reinitializing canvas');
            
            // Save current elements (if they exist)
            var savedText = textElements ? textElements.slice() : [];
            var savedImages = uploadedImages ? uploadedImages.slice() : [];
            var savedCurrent = typeof currentImage !== 'undefined' ? currentImage : null;
            
            // Reinitialize canvas with new dimensions
            initCanvas();
            
            // Restore elements (if they existed) - V12.12: Clear and repopulate
            if (savedText.length > 0) {
                textElements.length = 0;
                savedText.forEach(function(t) { textElements.push(t); });
            }
            if (savedImages.length > 0) uploadedImages = savedImages;
            if (savedCurrent) currentImage = savedCurrent;
            
            // Redraw
            if (typeof redrawCanvas === 'function') redrawCanvas();
        }, 250);
    });
    if (typeof hideDeleteControls === 'function') {
        if (typeof hideDeleteControls === 'function') hideDeleteControls();
        console.log('CDBT: Delete controls hidden on init');
    }
		
	if( $('#cdbt-add-text').length > 0)
		 $('.elementor-menu-cart__container').remove(); 
    
});






