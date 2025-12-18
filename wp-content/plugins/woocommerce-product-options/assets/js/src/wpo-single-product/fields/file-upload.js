import Dropzone from 'dropzone';
import { __ } from '@wordpress/i18n';

const fileUpload = ( addToCartForm, addtoCartButton = null ) => {
	const form = addToCartForm;
	const submitButton = addtoCartButton ?? form.querySelector( 'button.single_add_to_cart_button' );

	function init() {
		if ( ! ( form instanceof HTMLFormElement ) || ! ( submitButton instanceof HTMLButtonElement ) ) {
			return false;
		}

		const dropzoneElements = form.querySelectorAll( '.wpo-field-file_upload' );

		Array.from( dropzoneElements ).forEach( ( element ) => {
			const dropzone = element.querySelector( '.dropzone' );

			if ( dropzone.dropzone ) {
				return;
			}

			const previewTemplate = document.querySelector( '.wpo-dropzone-preview' ).innerHTML;

			const maxFiles = dropzone.dataset?.maxFiles ? parseInt( dropzone.dataset.maxFiles ) : null;

			const dictionary = {
				dictDefaultMessage: __( 'Drop files here to upload', 'woocommerce-product-options' ),
				dictFallbackMessage: __(
					'Your browser does not support drag\'n\'drop file uploads.',
					'woocommerce-product-options'
				),
				dictFallbackText: __(
					'Please use the fallback form below to upload your files like in the olden days.',
					'woocommerce-product-options'
				),
				dictInvalidFileType: __( 'You can\'t upload files of this type.', 'woocommerce-product-options' ),
				dictResponseError: __( 'Server responded with {{statusCode}} code.', 'woocommerce-product-options' ),
				dictCancelUpload: __( 'Cancel upload', 'woocommerce-product-options' ),
				dictUploadCanceled: __( 'Upload canceled.', 'woocommerce-product-options' ),
				dictCancelUploadConfirmation: __(
					'Are you sure you want to cancel this upload?',
					'woocommerce-product-options'
				),
				dictMaxFilesExceeded: __( 'You can not upload any more files.', 'woocommerce-product-options' ),
				dictFileTooBig: __(
					'File is too big ({{filesize}} MB). Max filesize: {{maxFilesize}} MB.',
					'woocommerce-product-options'
				),
				dictRemoveFile:
					'<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" role="img" aria-hidden="true" focusable="false"><path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21ZM15.5303 8.46967C15.8232 8.76256 15.8232 9.23744 15.5303 9.53033L13.0607 12L15.5303 14.4697C15.8232 14.7626 15.8232 15.2374 15.5303 15.5303C15.2374 15.8232 14.7626 15.8232 14.4697 15.5303L12 13.0607L9.53033 15.5303C9.23744 15.8232 8.76256 15.8232 8.46967 15.5303C8.17678 15.2374 8.17678 14.7626 8.46967 14.4697L10.9393 12L8.46967 9.53033C8.17678 9.23744 8.17678 8.76256 8.46967 8.46967C8.76256 8.17678 9.23744 8.17678 9.53033 8.46967L12 10.9393L14.4697 8.46967C14.7626 8.17678 15.2374 8.17678 15.5303 8.46967Z"></path></svg>',
			}

			return new Dropzone( dropzone, {
				url: `${ wpoSettings.rest_url }/file-upload`,
				acceptedFiles: dropzone.dataset?.fileTypes ? dropzone.dataset.fileTypes : null,
				maxFilesize: dropzone.dataset?.maxFilesize ? parseInt( dropzone.dataset.maxFilesize ) : null,
				maxFiles: dropzone.dataset?.maxFiles ? parseInt( dropzone.dataset.maxFiles ) : null,
				addRemoveLinks: true,
				createImageThumbnails: !! wpoSettings?.create_thumbnails,
				thumbnailMethod: 'contain',
				thumbnailWidth: 160,
				thumbnailHeight: 160,
				previewTemplate,
				...dictionary,
				// disable object shorthand so we have access to dropzone (this)
				// eslint-disable-next-line object-shorthand
				init: function () {
					this.on( 'error', ( file, error ) => {
						for ( const node of file.previewElement.querySelectorAll( '[data-dz-errormessage]' ) ) {
							const errorMessage = typeof error === 'string' ? error : error.message;
							node.textContent = typeof errorMessage === 'string' ? errorMessage : errorMessage.error;
						}
					} );

					this.on( 'success', ( file, response ) => {
						const valueInput = element.querySelector(
							`input[name="wpo-option[option-${ element.dataset.optionId }]"]`
						);
						const files = JSON.parse( valueInput.value );

						files.push( response.url );
						valueInput.value = JSON.stringify( files );

						const totalSize = parseInt( valueInput?.dataset?.size || 0 );

						valueInput.dataset.size = totalSize + file.size;

						// trigger change on the field for price calculation and conditional logic
						const event = new Event( 'change' );
						valueInput.dispatchEvent( event );
						element.dispatchEvent( event );
					} );

					this.on( 'sending', function ( file, xhr, formData ) {
						// Disable the submit button
						submitButton.disabled = true;

						// Add option id
						formData.append( 'option_id', element.dataset.optionId );
					} );

					this.on( 'queuecomplete', function () {
						// Re-enable the submit button
						submitButton.disabled = false;
					} );

					this.on( 'removedfile', function ( file ) {
						const valueInput = element.querySelector(
							`input[name="wpo-option[option-${ element.dataset.optionId }]"]`
						);

						let files = JSON.parse( valueInput.value );
						const response = JSON.parse( file.xhr.response );

						files = files.filter( ( url ) => url !== response.url );
						valueInput.value = JSON.stringify( files );

						const totalSize = parseInt( valueInput?.dataset?.size || 0 );
						valueInput.dataset.size = totalSize - file.size;

						if ( this.getAcceptedFiles().length < maxFiles ) {
							dropzone.querySelector( 'span.dz-button-label' ).innerHTML =
								__( 'Drop files here to upload', 'woocommerce-product-options' );
						}

						// trigger change on the field for price calculation and conditional logic
						const event = new Event( 'change' );
						valueInput.dispatchEvent( event );
						element.dispatchEvent( event );
					} );

					this.on( 'maxfilesexceeded', function ( file ) {
						this.removeFile( file );
						dropzone.querySelector( 'span.dz-button-label' ).innerHTML = __(
							'Maximum number of files reached'
						);
					} );
				},
			} );
		} );
	}

	return { init };
};

export default fileUpload;
