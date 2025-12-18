import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

window.addEventListener( 'DOMContentLoaded', () => {
    __webpack_public_path__ = wpoSettings.module_path_url;

    const wpoLightbox = new PhotoSwipeLightbox( {
        gallery: '.woocommerce-page .cart_item, .woocommerce-page .order_item',
        children: 'a[href*="wpo-uploads"]',
        showHideAnimationType: 'zoom',
        showAnimationDuration: 150,
        hideAnimationDuration: 150,
        
        pswpModule: () => import(
            /*webpackChunkName: "photoswipe"*/
            'photoswipe'
        ),
    } )

    wpoLightbox.init();

    window.jQuery( document.body ).on( 'updated_checkout updated_cart_totals', () => {
        wpoLightbox.init();
    } );
} );