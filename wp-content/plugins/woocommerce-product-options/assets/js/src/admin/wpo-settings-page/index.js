/**
 * WordPress dependencies
 */
import { createRoot } from 'react-dom/client';

/**
 * External dependencies
 */
import { HashRouter } from 'react-router-dom';

/**
 * Internal dependencies.
 */
import AdminEditor from './app.js';

const domElement = document.getElementById( 'barn2-wpo-settings-root' );
const uiElement = (
	<HashRouter>
		<AdminEditor />
	</HashRouter>
);

if ( domElement ) {
	createRoot( domElement ).render( uiElement );
}
