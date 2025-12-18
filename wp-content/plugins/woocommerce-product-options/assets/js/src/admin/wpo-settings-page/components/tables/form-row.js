/**
 * Internal dependencies
 */
import WCTableTooltip from '../wc-table-tooltip';

/**
 * Handles the display of an individual row for the group editor form.
 *
 * @param {Object} props
 * @param {string} props.name
 * @param {string} props.label
 * @param {string} props.tooltip
 * @param {string} props.description
 * @param {Object} props.children
 * @param {string} props.className
 *
 * @return {React.ReactElement} FormRow
 */
const FormRow = ( { name, label, tooltip, description, children, className } ) => {
	return (
		<tr valign="top" className={ className }>
			<th scope="row" className="titledesc">
				<label className={ 'group-form-label' } htmlFor={ name }>
					{ label }

					{ tooltip?.length > 0 && <WCTableTooltip tooltip={ tooltip } /> }
				</label>
			</th>
			<td className="forminp">
				<fieldset>
					<legend className="screen-reader-text">
						<span>{ label }</span>
					</legend>

					{ children }

					{ description?.length > 0 && <p className="description">{ description }</p> }
				</fieldset>
			</td>
		</tr>
	);
};

export default FormRow;
