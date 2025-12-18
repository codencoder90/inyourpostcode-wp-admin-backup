/**
 * WordPress dependencies
 */
import { date } from '@wordpress/date';

const DateFormat = ( { value, onChange = () => {} } ) => {
	const renderPreview = () => {
		if ( ! value ) {
			return date( 'F j, Y', new Date() );
		}

		return date( value, new Date() );
	};

	return (
		<div className="wpo-option-date-format">
			<input
				type="text"
				placeholder={ 'F j, Y' }
				value={ value }
				onChange={ ( e ) => onChange( e.target.value ) }
			/>
			<span className="wpo-option-date-format-preview">{ renderPreview() }</span>
		</div>
	);
};

export default DateFormat;
