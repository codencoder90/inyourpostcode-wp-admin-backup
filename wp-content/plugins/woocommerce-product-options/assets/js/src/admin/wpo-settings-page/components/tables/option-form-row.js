/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import WCTableTooltip from '../wc-table-tooltip';

/**
 * Option form row component.
 *
 * @param {Object}  props
 * @param {string}  props.name
 * @param {string}  props.label
 * @param {string}  props.tooltip
 * @param {string}  props.description
 * @param {Object}  props.children
 * @param {boolean} props.topAligned
 * @param {string}  props.className
 * @return {React.ReactElement} OptionFormRow
 */
const OptionFormRow = ( { name, label, tooltip, description, children, topAligned, className, style } ) => {
	const classes = classNames( 'option-form-label', {
		'top-aligned': topAligned === true,
	} );

	return (
		<tr valign="top" className={ className } style={ style }>
			<td className={ classes }>
				<label htmlFor={ name }>
					{ label }
					{ tooltip?.length > 0 && <WCTableTooltip tooltip={ tooltip } /> }
				</label>
			</td>
			<td className="option-form-input">
				{ children }
				{ description?.length > 0 && <p className="description">{ description }</p> }
			</td>
		</tr>
	);
};

export default OptionFormRow;
