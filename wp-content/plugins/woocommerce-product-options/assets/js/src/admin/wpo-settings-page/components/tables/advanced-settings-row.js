/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Option form row component.
 *
 * @param {Object}   props
 * @param {boolean}  props.opened
 * @param {Function} props.onClick
 * @return {React.ReactElement} AdvancedSettingsRow
 */
const AdvancedSettingsRow = ( { opened, onClick } ) => {
	const onToggle = ( event ) => {
		event?.target?.closest( 'button' )?.blur();
		onClick();
	};

	return (
		<tr valign="top" className="advanced-settings-row">
			<td className="option-form-label">
				<button type="button" className="button-link no-outline" onClick={ onToggle }>
					<span className="advanced-settings-icon dashicons dashicons-admin-generic" />
					<span className="advanced-settings-label">
						{ __( 'Advanced settings', 'woocommerce-product-options' ) }
					</span>
					{ opened && <span className="advanced-settings-toggle dashicons dashicons-arrow-up-alt2" /> }
					{ ! opened && <span className="advanced-settings-toggle dashicons dashicons-arrow-down-alt2" /> }
				</button>
			</td>
			<td className="option-form-input"></td>
		</tr>
	);
};

export default AdvancedSettingsRow;
