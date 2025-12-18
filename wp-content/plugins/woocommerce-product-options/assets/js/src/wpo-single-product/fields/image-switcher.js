const wpoGalleryImageReset = () => {
	const $ = window.jQuery;

	if ( typeof $.fn.slick === 'function' ) {
		$( '.tbh-carousel' ).slick( 'slickGoTo', 0 );
	}
};

const wpoImageUpdate = ( form, imageButton ) => {
	const $ = window.jQuery;

	const $product = $( form.closest( '.product' ) ),
		$productGallery = $product.find( '.images' ),
		$galleryNav = $product.find( '.flex-control-nav' ),
		imageData = JSON.parse( imageButton?.dataset?.image ?? false );

	if ( imageData?.src ) {
		// See if gallery has a matching image we can slide to.
		const slideToImage = $galleryNav.find( 'li img[src="' + imageData?.gallery_thumbnail_src + '"]' );

		if ( slideToImage.length > 0 ) {
			slideToImage.trigger( 'click' );
			form.setAttribute( 'current-image', imageData?.image_id );
			window.setTimeout( function () {
				$( window ).trigger( 'resize' );
				$productGallery.trigger( 'woocommerce_gallery_init_zoom' );
			}, 20 );
			return;
		}

		if ( typeof $.fn.slick === 'function' && imageData?.gallery_thumbnail_src ) {
			const $slickCarousel = $( '.thb-carousel' );
			const index = $slickCarousel.find( `div[data-thumb="${ imageData.gallery_thumbnail_src }"]` ).index();

			$slickCarousel.slick( 'slickGoTo', index );
		}
	} else {
		wpoGalleryImageReset();
	}
};

const switchWooGalleryImage = ( imageField, activeContainer ) => {
	const $ = window.jQuery;
	const form = ( imageField || activeContainer )?.closest( 'form' );

	if ( ! form ) {
		return;
	}

	const productContainer = form.closest( '.product' );
	const productGallery = productContainer.querySelector( '.images' );
	const galleryImage = productGallery?.querySelector( 'img.wp-post-image' );
	const galleryNav = productContainer.querySelector( '.flex-control-nav' );

	if ( imageField === false ) {
		$( galleryNav?.querySelector( 'li:nth-child(1) img' ) ).trigger( 'click' );
		wpoGalleryImageReset();
		return;
	}

	const imageData = JSON.parse( imageField?.dataset?.image ?? false );
	const galleryThumbnailSrc = imageData?.gallery_thumbnail_src ?? '';

	if ( activeContainer?.classList.contains( 'wpo-image-selected' ) ) {
		wpoGalleryImageReset();
	}

	if ( galleryImage?.dataset && ! galleryImage.dataset.srcset ) {
		galleryImage.dataset.srcset = galleryImage.srcset;
	}

	// See if gallery has a matching image we can slide to.
	const slideToImage = galleryNav?.querySelectorAll( 'li img[src="' + galleryThumbnailSrc + '"]' );

	if ( slideToImage?.length > 0 ) {
		$( slideToImage ).trigger( 'click' );

		window.setTimeout( function () {
			$( window ).trigger( 'resize' );
			$( productGallery ).trigger( 'woocommerce_gallery_init_zoom' );
		}, 20 );
	} else {
		// Otherwise, just update the image src.
		wpoImageUpdate( form, imageField );
	}
};

const imageSwitcher = () => {
	function init() {
		Array.from( document.querySelectorAll( '.wpo-field-with-images' ) ).forEach( ( imageField ) => {
			const inputTag = imageField?.classList?.contains( 'wpo-field-dropdown' ) ? 'option' : 'input';
			const activeContainer = imageField.querySelector( '.wpo-image-active' );
			const inputElements = imageField.querySelectorAll( inputTag );

			Array.from( inputElements ).forEach( ( input ) => {
				input.addEventListener( 'change', () => {
					if ( Array.from( inputElements ).filter( ( element ) => element?.checked ).length < 1 ) {
						switchWooGalleryImage( false, activeContainer );
					}
				} );
			} );

			imageField.addEventListener( 'click', ( event ) => {
				if ( imageField.classList.contains( 'wpo-field-dropdown' ) ) {
					// Dropdowns are the only option type that uses a select element
					// and store the data-image attribute on the option element.
					const select = imageField.querySelector( 'select' );
					if ( select ) {
						const option = select.querySelector( `[value="${ event.target?.dataset?.value }"]` );
						if ( option ) {
							switchWooGalleryImage( option, activeContainer );
						}
					}
				} else {
					switchWooGalleryImage( event.target.closest( '[data-image]' ), activeContainer );
				}
			} );
		} );
	}

	return { init };
};

export default imageSwitcher();
