import { getModules, initModules } from './module-loader';

( function ( $ ) {
	__webpack_public_path__ = window?.wpoSettings?.module_path_url;

	/**
	 * Default
	 */
	document.addEventListener( 'DOMContentLoaded', function () {
		getModules().then( ( modules ) => {
			initModules( modules );
		} ).catch( ( error ) => {
			console.error( error );
		} );
	} );

} )( jQuery );
