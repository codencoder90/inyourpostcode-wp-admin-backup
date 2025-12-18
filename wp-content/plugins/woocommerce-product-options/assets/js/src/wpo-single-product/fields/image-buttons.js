const imageButtons = ( addToCartForm ) => {
	const form = addToCartForm;

	function init() {
		const imageButtonsOptions = Array.from( form.querySelectorAll( '.wpo-image-buttons' ) );
		imageButtonsOptions.forEach( ( imageButtonsOption ) => {
			setLineClamp( imageButtonsOption );
		} );
	}

	function setLineClamp( imageButtonsOption ) {
		const imageWrap = imageButtonsOption?.querySelector( '.wpo-image-wrap' );
		const imageText = imageWrap?.querySelector( '.wpo-image-text' );
		const imageLabel = imageText?.querySelector( '.wpo-image-label' );

		if ( ! imageLabel ) {
			return;
		}

		const overlayFactor = imageButtonsOption.classList.contains( 'wpo-image-buttons-partial' ) ? .5 : 1;
		const height = overlayFactor * imageWrap.getBoundingClientRect().height;
		const lineHeight = parseFloat( getComputedStyle( imageLabel )[ 'line-height' ].replace( 'px', '' ) );
		const lineClamp = Math.floor( height / lineHeight ) - 2;
		imageButtonsOption.style.setProperty('--wpo-image-buttons-line-clamp', lineClamp );
	}

	return { init };
};

export default imageButtons;
