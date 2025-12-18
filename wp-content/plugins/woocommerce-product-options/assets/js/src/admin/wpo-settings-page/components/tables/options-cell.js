import { useGroupOptions } from '../../hooks/options';

/**
 * Displays the number of options associated to the group
 *
 * @param {Object} props
 * @param {Object} props.table
 * @return {number} optionsCount
 */
const OptionsCell = ( { table } ) => {
	const { options } = table.row.original;
	return options?.length ?? 0;
};

export default OptionsCell;
