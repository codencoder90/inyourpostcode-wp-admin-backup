import { getModules, initModules } from '../wpo-single-product/module-loader';
import wptMultiCart from '../wpo-single-product/integration/wpt-multi-cart';

( function ( $ ) {
	__webpack_public_path__ = window?.wpoSettings?.module_path_url;

	/**
	 * WooCommerce Product Table
	 */
	$( document ).on( 'draw.wcpt responsiveDisplay.wcpt', '.wc-product-table', ( event, table ) => {
		const tableElement = table.$table.get( 0 );
		const cartForms = tableElement?.querySelectorAll( 'form.cart' );

		if ( table.config.multiAddToCart ) {
			cartForms.forEach( ( cartForm ) => {
				wptMultiCart( cartForm ).init();
			} );
		}

		getModules().then( ( modules ) => {
			initModules( modules, cartForms );
		} ).catch( ( error ) => {
			console.error( error );
		} );
	} );
} )( jQuery );
