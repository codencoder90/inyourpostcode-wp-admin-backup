/**
 * Displays the content of the name column.
 *
 * @param {Object}   props
 * @param {Object}   props.table
 * @param {Function} props.onClick
 * @return {React.ReactElement} OptionNameCell
 */
const OptionNameCell = ( { table, onClick = () => {} } ) => {
	const { name, id } = table.row.original;
	const { index } = table.row;

	const handleClick = ( event ) => {
		event.preventDefault();
		onClick( event, index );
	};

	return (
		<>
			<strong>
				{ /* eslint-disable-next-line jsx-a11y/anchor-is-valid */ }
				<a href="#" onClick={ ( event ) => handleClick( event ) }>
					{ name.length > 0 ? name : '(No name)' }
				</a>
			</strong>
		</>
	);
};

export default OptionNameCell;
