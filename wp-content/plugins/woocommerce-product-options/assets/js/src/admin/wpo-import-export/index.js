/**
 * WordPress dependencies
 */
import { createRoot } from 'react-dom/client';

/**
 * Internal dependencies.
 */
import ImportExport from './app.js';

const domElement = document.getElementById( 'barn2-wpo-import-export-root' );
const uiElement = <ImportExport />;

if ( domElement ) {
	createRoot( domElement ).render( uiElement );
}
