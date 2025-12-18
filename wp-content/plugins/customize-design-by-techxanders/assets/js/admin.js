jQuery(document).ready(function($) {
    
    // Toggle customize settings visibility
    $('#_cdbt_enable_customize').change(function() {
        if ($(this).is(':checked')) {
            $('#cdbt_customize_settings').show();
        } else {
            $('#cdbt_customize_settings').hide();
        }
    });
    
    // Frame size management
    var frameIndex = $('#cdbt_frame_sizes .cdbt_frame_size_row').length;
    
    // Add frame size
    $('#cdbt_add_frame_size').click(function(e) {
        e.preventDefault();
        
        var template = $('#cdbt_frame_size_template').html();
        var html = template.replace(/{{index}}/g, frameIndex);
        
        $('#cdbt_frame_sizes').append(html);
        frameIndex++;
    });
    
    // Remove frame size
    $(document).on('click', '.cdbt_remove_frame_size', function(e) {
        e.preventDefault();
        $(this).closest('.cdbt_frame_size_row').remove();
    });
    
    // Photo gallery selector
    var mediaUploader;
    
    $('#cdbt_select_photos').click(function(e) {
        e.preventDefault();
        
        if (mediaUploader) {
            mediaUploader.open();
            return;
        }
        
        mediaUploader = wp.media.frames.file_frame = wp.media({
            title: 'Choose Photos for Design',
            button: {
                text: 'Choose Photos'
            },
            multiple: true,
            library: {
                type: 'image'
            }
        });
        
        mediaUploader.on('select', function() {
            var attachments = mediaUploader.state().get('selection').toJSON();
            var photoIds = [];
            var photosHtml = '';
            
            attachments.forEach(function(attachment) {
                photoIds.push(attachment.id);
                photosHtml += '<div class="cdbt_photo_preview" data-id="' + attachment.id + '">';
                photosHtml += '<img src="' + attachment.sizes.thumbnail.url + '" alt="" />';
                photosHtml += '<button type="button" class="cdbt_remove_photo">&times;</button>';
                photosHtml += '</div>';
            });
            
            // Get existing photos
            var existingIds = $('#cdbt_design_photos').val().split(',').filter(function(id) {
                return id !== '';
            });
            
            // Merge with new photos
            var allIds = existingIds.concat(photoIds);
            
            $('#cdbt_design_photos').val(allIds.join(','));
            $('#cdbt_selected_photos').append(photosHtml);
        });
        
        mediaUploader.open();
    });
    
    // Remove photo
    $(document).on('click', '.cdbt_remove_photo', function(e) {
        e.preventDefault();
        
        var photoId = $(this).parent().data('id');
        var currentIds = $('#cdbt_design_photos').val().split(',');
        var newIds = currentIds.filter(function(id) {
            return id != photoId;
        });
        
        $('#cdbt_design_photos').val(newIds.join(','));
        $(this).parent().remove();
    });
    
});