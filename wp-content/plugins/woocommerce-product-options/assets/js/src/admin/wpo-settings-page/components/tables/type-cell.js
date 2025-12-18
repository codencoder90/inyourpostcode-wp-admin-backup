/**
 * Internal dependencies
 */ import { optionTypes, visualOptionTypes } from '../../config';

/**
 * Displays the content of the type column.
 *
 * @param {Object} props
 * @param {Object} props.table
 * @return {Object} JSX
 */
const TypeCell = ( { table } ) => {
	const { type } = table.row.original;

	const configArray = [ 'html', 'wysiwyg' ].includes( type ) ? visualOptionTypes : optionTypes;

	return configArray[ configArray.findIndex( ( optionConfig ) => optionConfig.key === type ) ]?.label;
};

export default TypeCell;
