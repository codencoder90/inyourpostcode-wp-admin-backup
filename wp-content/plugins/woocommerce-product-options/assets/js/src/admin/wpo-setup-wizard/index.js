import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { Fill } from '@wordpress/components';

/**
 * Returns the the components for 'barn2_setup_wizard_ready_page'
 */
const readyPageContent = () => {
	return () => {
		return (
			<Fill name="ReadyPageContent">
				<a className={ 'button' } href={ barn2_setup_wizard.skip_url }>
					{ __( 'Create product options', 'woocommerce-product-options' ) }
				</a>
			</Fill>
		);
	};
}
addFilter( 'barn2_setup_wizard_ready_page', 'wpo-wizard', readyPageContent );

/**
 * Hides the settings button on the setup wizard.
 *
 * @param {React.Component} readyStep
 */
addFilter( 'barn2_setup_wizard_show_settings_button', 'wpo-wizard', () => { return false } )
