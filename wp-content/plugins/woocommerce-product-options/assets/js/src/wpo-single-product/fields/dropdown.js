import { __ } from '@wordpress/i18n';
import NiceSelect from '../../../../../node_modules/nice-select2/dist/js/nice-select2.js';

const dropdown = () => {
	function init() {
		Array.from( document.querySelectorAll( '.wpo-field-dropdown select:not(.initialized)' ) ).forEach(
			( select ) => {
				select._niceSelect = new NiceSelect( select, {
					placeholder: select.placeholder || __( 'Select an option', 'woocommerce-product-options' ),
				} );
				select.classList.add( 'initialized' );
			}
		);
	}

	return { init };
};

export default dropdown();
