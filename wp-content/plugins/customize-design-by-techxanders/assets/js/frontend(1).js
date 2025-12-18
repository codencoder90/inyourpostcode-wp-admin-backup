// CDBT Frontend JS - Version 2.1 - VARIATION FIX (with transform handles)
console.log('CDBT: Frontend JavaScript loaded - Version 2.1 - VARIATION FIX');

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
    
    var canvas = document.getElementById('cdbt-design-canvas');
    var ctx = canvas ? canvas.getContext('2d') : null;
    var currentImage = null;
    var textElements = [];
    var uploadedImages = [];
    var selectedFrameSize = null;
    var selectedTextElement = null;
    var isDragging = false;
    var dragOffset = { x: 0, y: 0 };

    // --- NEW: resize/transform state ---
    var isResizing = false;
    var resizeHandleSize = 10;
    var activeHandle = null; // 'tl', 'tr', 'bl', 'br' for text or image
    var resizeStart = null; // { mouseX, mouseY, origFontSize, origBoxWidth, origX, origY }

    // --- NEW: image-specific resize state ---
    var isImageResizing = false;
    var imageResizeStart = null; // { mouseX, mouseY, origW, origH, origX, origY, aspect }
    // -----------------------------------
    
    if (!canvas || !ctx) {
        return;
    }
    
    // Initialize canvas
    function initCanvas() {
        canvas.width = 600;
        canvas.height = 400;
        
        // Load first image if available
        if (cdbtDesignData.photos.length > 0) {
            loadImage(cdbtDesignData.photos[0].url);
        }
    }
    
    // Load image on canvas
    function loadImage(imageUrl) {
        var img = new Image();
        img.onload = function() {
            // Calculate aspect ratio
            var aspectRatio = img.width / img.height;
            var canvasWidth = canvas.width;
            var canvasHeight = canvas.height;
            
            var drawWidth, drawHeight;
            
            if (aspectRatio > canvasWidth / canvasHeight) {
                drawWidth = canvasWidth;
                drawHeight = canvasWidth / aspectRatio;
            } else {
                drawHeight = canvasHeight;
                drawWidth = canvasHeight * aspectRatio;
            }
            
            var x = (canvasWidth - drawWidth) / 2;
            var y = (canvasHeight - drawHeight) / 2;
            
            currentImage = {
                img: img,
                x: x,
                y: y,
                width: drawWidth,
                height: drawHeight
            };
            
            redrawCanvas();
        };
        img.src = imageUrl;
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
        var half = resizeHandleSize / 2;
        var handles = {
            tl: { x: imgElement.x - half, y: imgElement.y - half },
            tr: { x: imgElement.x + imgElement.width - half, y: imgElement.y - half },
            bl: { x: imgElement.x - half, y: imgElement.y + imgElement.height - half },
            br: { x: imgElement.x + imgElement.width - half, y: imgElement.y + imgElement.height - half }
        };
        for (var key in handles) {
            var h = handles[key];
            if (x >= h.x && x <= h.x + resizeHandleSize && y >= h.y && y <= h.y + resizeHandleSize) {
                return key;
            }
        }
        return null;
    }
    
    // Helper: detect which handle (if any) is at canvas coords x,y for given text element
    function getHandleAt(x, y, el) {
        if (!el) return null;
        var box = getTransformBox(el);
        var half = resizeHandleSize / 2;
        var handles = {
            tl: { x: box.x - half, y: box.y - half },
            tr: { x: box.x + box.w - half, y: box.y - half },
            bl: { x: box.x - half, y: box.y + box.h - half },
            br: { x: box.x + box.w - half, y: box.y + box.h - half }
        };
        for (var key in handles) {
            var h = handles[key];
            if (x >= h.x && x <= h.x + resizeHandleSize && y >= h.y && y <= h.y + resizeHandleSize) {
                return key;
            }
        }
        return null;
    }
    
    // Redraw canvas
    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
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
            ctx.drawImage(
                imgElement.img,
                imgElement.x,
                imgElement.y,
                imgElement.width,
                imgElement.height
            );
            
             if (imgElement === canvas.selectedImageElement) {
                 let img = imgElement;
                ctx.strokeStyle = '#007cba';
                ctx.lineWidth = 2;
                ctx.strokeRect(img.x, img.y, img.width, img.height);

                var half = resizeHandleSize / 2;
                var handles = [
                    { x: img.x - half, y: img.y - half }, // TL
                    { x: img.x + img.width - half, y: img.y - half }, // TR
                    { x: img.x - half, y: img.y + img.height - half }, // BL
                    { x: img.x + img.width - half, y: img.y + img.height - half } // BR
                ];
                ctx.fillStyle = '#007cba';
                handles.forEach(h => ctx.fillRect(h.x, h.y, resizeHandleSize, resizeHandleSize));
            }
        });
        
        // Draw text elements
        textElements.forEach(function(textElement) {
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
            
            // Draw selection border + handles if selected
            if (textElement === selectedTextElement) {
                // draw selection box
                var box = getTransformBox(textElement);
                ctx.strokeStyle = '#007cba';
                ctx.lineWidth = 2;
                ctx.strokeRect(box.x, box.y, box.w, box.h);
                
                // draw handles
                var half = resizeHandleSize / 2;
                var handles = [
                    { x: box.x - half, y: box.y - half }, // tl
                    { x: box.x + box.w - half, y: box.y - half }, // tr
                    { x: box.x - half, y: box.y + box.h - half }, // bl
                    { x: box.x + box.w - half, y: box.y + box.h - half } // br
                ];
                ctx.fillStyle = '#007cba';
                handles.forEach(function(h) {
                    ctx.fillRect(h.x, h.y, resizeHandleSize, resizeHandleSize);
                });
            }
        });
    }
    
    // Frame size selection
    $('input[name="cdbt_frame_size"]').change(function() {
        var index = $(this).val();
        selectedFrameSize = cdbtDesignData.frameSizes[index];
        
        console.log('CDBT: Frame size selected:', selectedFrameSize);
        console.log('CDBT: Currency symbol:', cdbtDesignData.currency);
        
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
        
        var textElement = {
            content: textContent,
            x: canvas.width / 2,
            y: canvas.height / 2,
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
        redrawCanvas();
    });
    
    // Text formatting controls
    function updateTextFormatting() {
        if (!selectedTextElement) return;
        
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
    }
    
    $('#cdbt-font-size').on('input', function() {
        if (selectedTextElement) {
            selectedTextElement.fontSize = parseInt($(this).val());
            $('#cdbt-font-size-value').text(selectedTextElement.fontSize + 'px');
            redrawCanvas();
        }
    });
    
    $('#cdbt-font-color').change(function() {
        if (selectedTextElement) {
            selectedTextElement.color = $(this).val();
            redrawCanvas();
        }
    });
    
    $('#cdbt-font-family').change(function() {
        if (selectedTextElement) {
            selectedTextElement.fontFamily = $(this).val();
            redrawCanvas();
        }
    });
    
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
        
        redrawCanvas();
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
                        // Calculate proper size maintaining aspect ratio
                        var dimensions = calculateImageSize(img.width, img.height);
                        
                        var imgElement = {
                            img: img,
                            x: 50,
                            y: 50,
                            width: dimensions.width,
                            height: dimensions.height,
                            url: response.data.url
                        };
                        
                        uploadedImages.push(imgElement);
                        
                        // Auto-select uploaded image and show delete controls
                        canvas.selectedImageElement = imgElement;
                        selectedTextElement = null;
                        $('#cdbt-text-formatting').hide();
                        showDeleteControls('image', 'Uploaded Image');
                        redrawCanvas();
                        
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
                redrawCanvas();
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
                redrawCanvas();
                return;
            }
        }
        
        // If nothing selected
        selectedTextElement = null;
        canvas.selectedImageElement = null;
        $('#cdbt-text-formatting').hide();
        hideDeleteControls();
        redrawCanvas();
    });
    
    canvas.addEventListener('mousemove', function(e) {
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

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

            redrawCanvas();
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

            redrawCanvas();
            return;
        }
        
        // If dragging (move text or image)
        if (!isDragging) {
            // change cursor when hovering handles
            var hoveringHandle = null;
            if (canvas.selectedImageElement) {
                hoveringHandle = getImageHandleAt(x, y, canvas.selectedImageElement);
            }
            if (!hoveringHandle && selectedTextElement) {
                hoveringHandle = getHandleAt(x, y, selectedTextElement);
            }

            if (hoveringHandle) {
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
            redrawCanvas();
        }
    });
    
    canvas.addEventListener('mouseup', function() {
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

        // ensure formatting UI reflects final selection
        if (selectedTextElement) updateTextFormatting();
    });
    
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
    
    // Delete element functionality
    $('.options-element #cdbt-delete-element').click(function() {
        if (selectedTextElement) {
            // Remove text element
            var index = textElements.indexOf(selectedTextElement);
            if (index > -1) {
                textElements.splice(index, 1);
                selectedTextElement = null;
                $('#cdbt-text-formatting').hide();
                hideDeleteControls();
                redrawCanvas();
            }
        } else if (canvas.selectedImageElement) {
            // Remove image element
            var index = uploadedImages.indexOf(canvas.selectedImageElement);
            if (index > -1) {
                uploadedImages.splice(index, 1);
                canvas.selectedImageElement = null;
                hideDeleteControls();
                redrawCanvas();
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
                        
                        redrawCanvas();
                        
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
        
    console.log('CDBT: Add to cart button clicked - DEBUG VERSION 3.0');

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

    var designImageData = canvas.toDataURL('image/png');
    var attachmentFile = $('#cdbt-attachment-file')[0]?.files[0] || null;

    console.log('CDBT: Attachment file selected:', attachmentFile ? attachmentFile.name : 'none');

        $('#cdbt-add-to-cart').attr("disabled", true);
        $('#cdbt-add-to-cart').html("Loading...");
    // Use FormData to include file + data
    var formData = new FormData();
    formData.append('action', 'cdbt_save_design');
    formData.append('nonce', cdbt_ajax.nonce);
    formData.append('product_id', cdbtDesignData.productId);
    formData.append('variation_id', variationId || 0);
    formData.append('image_data', designImageData);
    formData.append('frame_size', selectedFrameSize);

    // Add design customization data
    var customizationData = {
        frame_size: selectedFrameSize,
        text_elements: textElements,
        uploaded_images: uploadedImages.map(function(img) {
            return {
                url: img.url,
                x: img.x,
                y: img.y,
                width: img.width,
                height: img.height
            };
        })
    };
    formData.append('customization_data', JSON.stringify(customizationData));

    // Add attachment if selected
    if (attachmentFile) {
        formData.append('attachment', attachmentFile);
    }

    console.log('CDBT: Sending FormData:', formData);

    $.ajax({
        url: cdbt_ajax.ajax_url,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        beforeSend: function() {
            console.log('CDBT: Uploading design + attachment...');
        },
        success: function(response) {
            
            console.log('CDBT: Server response:', response);
           if (response.success) {
                    // Check which sides have customization
                    var hasFrontCustomization = designStates.front.canvasJSON || 
                                               (designStates.front.textElements && designStates.front.textElements.length > 0) ||
                                               (designStates.front.uploadedImages && designStates.front.uploadedImages.length > 0);

                    var hasBackCustomization = designStates.back.canvasJSON || 
                                              (designStates.back.textElements && designStates.back.textElements.length > 0) ||
                                              (designStates.back.uploadedImages && designStates.back.uploadedImages.length > 0);

                    var bothCustomized = hasFrontCustomization && hasBackCustomization;

                    console.log('🎨 Front customized:', hasFrontCustomization);
                    console.log('🎨 Back customized:', hasBackCustomization);
                    console.log('🎨 Both customized:', bothCustomized);

                    // Prepare customization data with front/back support
                    var customizationData = {
                        frame_size: selectedFrameSize,
                        design_image: response.data.url,
                        attachment_url: response.data.attachment_url ? response.data.attachment_url  : "" ,
                        text_elements: textElements,
                        uploaded_images: uploadedImages.map(function(img) {
                            return {
                                url: img.url,
                                x: img.x,
                                y: img.y,
                                width: img.width,
                                height: img.height
                            };
                        }),
                        // NEW: Front/Back design support for cart display and pricing
                        front_design: hasFrontCustomization ? response.data.url : null,
                        back_design: hasBackCustomization ? response.data.url : null,
                        both_customized: bothCustomized  // CRITICAL: This triggers Frame × 2 pricing
                    };
                    
                    console.log('CDBT: Customization data prepared:', customizationData);
                    console.log('🎨 FINAL DATA - front_design:', customizationData.front_design);
                    console.log('🎨 FINAL DATA - back_design:', customizationData.back_design);
                    console.log('🎨 FINAL DATA - both_customized:', customizationData.both_customized);
                    console.log('CDBT: Final variation ID being sent:', variationId);
                    console.log('CDBT: Is variable product:', cdbtDesignData.isVariable);
                    console.log('CDBT: Variation ID from form field:', $('#cdbt-variation-id').val());
                    
                    // Prepare AJAX data - FORCE variation_id to be included
                    var ajaxData = {
                        action: 'cdbt_add_to_cart',
                        nonce: cdbt_ajax.nonce,
                        product_id: cdbtDesignData.productId,
                        variation_id: String(variationId || '0'),
                        customization_data: JSON.stringify(customizationData)
                    };
                    
                    console.log('CDBT: AJAX data being sent:', ajaxData);
                    
                    // Manually construct POST data to ensure variation_id is included
                    var postData = 'action=cdbt_add_to_cart';
                    postData += '&nonce=' + encodeURIComponent(cdbt_ajax.nonce);
                    postData += '&product_id=' + encodeURIComponent(cdbtDesignData.productId);
                    postData += '&variation_id=' + encodeURIComponent(variationId || '0');
                    postData += '&customization_data=' + encodeURIComponent(JSON.stringify(customizationData));
                    
                    console.log('CDBT: Manual POST data:', postData);
                    
                    // Add to cart - FORCE variation_id parameter
                    $.ajax({
                        url: cdbt_ajax.ajax_url,
                        type: 'POST',
                        data: postData,
                        beforeSend: function(xhr, settings) {
                            console.log('CDBT: About to send AJAX request');
                            console.log('CDBT: Data being sent:', settings.data);
                        },
                        success: function(response) {
                            if (response.success) {
                                alert(response.data.message);
                                window.location.href = response.data.cart_url;
                            } else {
                                  $('#cdbt-add-to-cart').attr("disabled", false);
        $('#cdbt-add-to-cart').html("Add to Cart");
                                alert('Error: ' + response.data);
                            }
                        },
                        error: function() {
                            
                              $('#cdbt-add-to-cart').attr("disabled", false);
        $('#cdbt-add-to-cart').html("Add to Cart");
                            alert('Failed to add to cart. Please try again.');
                        }
                    });
                } else {
                    
                    
        $('#cdbt-add-to-cart').attr("disabled", false);
        $('#cdbt-add-to-cart').html("Add to Cart");
                    alert('Failed to save design. Please try again.');
                }
        },
        error: function(xhr) {
            console.error('CDBT: AJAX error:', xhr.responseText);
            alert('Failed to add to cart. Please try again.');
        }
    });
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
    
    var currentColorPhotos = {
        front: null,
        back: null
    };
    
    // Save current canvas state before switching
    function saveCurrentState() {
        var side = designStates.currentSide;
        console.log('💾 Saving', side, 'state...');
        
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
                    url: imgEl.url
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
                    url: imgData.url
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
    function loadSavedState(side) {
        console.log('📂 Loading', side, 'state...');
        
        // First restore text elements
        if (typeof textElements !== 'undefined' && designStates[side].textElements) {
            textElements = JSON.parse(JSON.stringify(designStates[side].textElements));
            console.log('📝 Restored', textElements.length, 'text elements');
        }
        
        // Reload uploaded images from URLs (this recreates Image objects)
        var savedImageData = designStates[side].uploadedImages;
        if (savedImageData && savedImageData.length > 0) {
            console.log('🔄 Reloading', savedImageData.length, 'uploaded images...');
            reloadUploadedImages(savedImageData, function(reloadedImages) {
                // Replace uploadedImages with newly loaded ones
                uploadedImages = reloadedImages;
                console.log('✅ Reloaded', uploadedImages.length, 'images with Image objects');
                
                // Now load canvas and redraw
                loadCanvasForSide(side);
            });
        } else {
            // No uploaded images, just load canvas
            uploadedImages = [];
            loadCanvasForSide(side);
        }
        
        designStates.currentSide = side;
    }
    
    // Helper to load canvas for a side
    function loadCanvasForSide(side) {
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
                                redrawCanvas();
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
                if (currentColorPhotos[side]) {
                    console.log('Loading base image for', side, ':', currentColorPhotos[side]);
                    if (typeof loadImage === 'function') {
                        loadImage(currentColorPhotos[side]);
                        
                        // After base image loads, redraw uploaded images
                        if (uploadedImages.length > 0 && typeof redrawCanvas === 'function') {
                            setTimeout(function() {
                                console.log('🎨 Redrawing', uploadedImages.length, 'uploaded images on new side');
                                redrawCanvas();
                            }, 500);
                        }
                    }
                }
            }
        } else {
            // Canvas not Fabric yet - just load the image directly
            console.log('⚠️ Canvas not ready yet, loading image directly');
            if (currentColorPhotos[side] && typeof loadImage === 'function') {
                console.log('Loading base image for', side, ':', currentColorPhotos[side]);
                loadImage(currentColorPhotos[side]);
                
                // Redraw uploaded images after delay
                if (uploadedImages.length > 0 && typeof redrawCanvas === 'function') {
                    setTimeout(function() {
                        console.log('🎨 Redrawing', uploadedImages.length, 'uploaded images');
                        redrawCanvas();
                    }, 800);
                }
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
            
            // Check if LEFT side color select exists (variation selector)
            var $leftColorSelect = $('select[name="attribute_pa_color"]').length > 0 ? 
                                    $('select[name="attribute_pa_color"]') : 
                                    $('#pa_color');
            
            if ($leftColorSelect.length === 0) {
                console.log('Left color select not found yet');
                if (attempts < maxAttempts) {
                    setTimeout(tryInstallHandler, 500);
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
                
                // Load front by default
                if (photos.front && typeof loadImage === 'function') {
                    console.log('Loading front image by default');
                    loadImage(photos.front);
                    designStates.currentSide = 'front';
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
            
            // Install photo click handler with front/back switching
            $(document).on('click.colorphotos', '.cdbt-gallery-photo', function() {
                var imageUrl = $(this).data('url');
                var side = $(this).data('side');
                
                console.log('🖼️ Photo clicked:', side, imageUrl);
                
                // Save current state before switching
                saveCurrentState();
                
                // Highlight selected photo
                $('.cdbt-gallery-photo').css('border-color', 'transparent');
                $(this).css('border-color', '#46b450');
                
                // Load saved state for clicked side
                loadSavedState(side);
                
                console.log('✅ Switched to', side, 'design');
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
                }
            }, 1000);
        }
        
        // Start trying
        tryInstallHandler();
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
        
        // Save current state first
        if (typeof saveCurrentState === 'function') {
            saveCurrentState();
        }
        
        var frontImageData = null;
        var backImageData = null;
        var bothCustomized = false;
        
        // Capture front design
        if (designStates.front.canvasJSON && typeof canvas !== 'undefined' && canvas && typeof canvas.loadFromJSON === 'function') {
            console.log('✅ Front has customization');
            try {
                canvas.loadFromJSON(designStates.front.canvasJSON, function() {
                    frontImageData = canvas.toDataURL('image/png');
                    console.log('Front design captured');
                    checkBothReady();
                });
            } catch (e) {
                console.log('⚠️ Could not capture front design:', e);
                frontImageData = 'none';
                checkBothReady();
            }
        } else {
            console.log('⚠️ Front has no customization');
            frontImageData = 'none';
            checkBothReady();
        }
        
        // Capture back design
        if (designStates.back.canvasJSON && typeof canvas !== 'undefined' && canvas && typeof canvas.loadFromJSON === 'function') {
            console.log('✅ Back has customization');
            try {
                canvas.loadFromJSON(designStates.back.canvasJSON, function() {
                    backImageData = canvas.toDataURL('image/png');
                    console.log('Back design captured');
                    checkBothReady();
                });
            } catch (e) {
                console.log('⚠️ Could not capture back design:', e);
                backImageData = 'none';
                checkBothReady();
            }
        } else {
            console.log('⚠️ Back has no customization');
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
            
            var customizationData = {
                frame_size: selectedFrameSize,
                front_design: urls.front,
                back_design: urls.back,
                both_customized: bothCustomized,
                text_elements: designStates[designStates.currentSide].textElements || [],
                uploaded_images: designStates[designStates.currentSide].uploadedImages || []
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

       /**/
    // Initialize
    initCanvas();
    
    // IMPORTANT: Hide delete controls on page load - they should only show when element is selected
    if (typeof hideDeleteControls === 'function') {
        hideDeleteControls();
        console.log('CDBT: Delete controls hidden on init');
    }
		
	if( $('#cdbt-add-text').length > 0)
		 $('.elementor-menu-cart__container').remove(); 
    
});