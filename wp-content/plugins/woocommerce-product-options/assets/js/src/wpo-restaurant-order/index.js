import { getModules, initModules } from '../wpo-single-product/module-loader';

( function ( $ ) {
	__webpack_public_path__ = window?.wpoSettings?.module_path_url;

	/**
	 * WooCommerce Restauarant Ordering (Custom init)
	 */
	$( document.body ).on( 'wro:modal:open', () => {
		getModules().then( ( modules ) => {
			initModules( modules );
		} ).catch( ( error ) => {
			console.error( error );
		} );
	} );
} )( jQuery );
