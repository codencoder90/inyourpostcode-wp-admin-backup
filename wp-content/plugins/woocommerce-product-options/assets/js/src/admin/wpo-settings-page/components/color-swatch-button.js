/**
 * WordPress dependencies.
 */
import { useState } from '@wordpress/element';
import { ColorPicker } from '@wordpress/components';

/**
 * External dependencies.
 */
import { Button, Popover } from '@barn2plugins/components';

const ColorSwatchButton = ( { color = '#000000', onChange = () => {} } ) => {
	const [ colorPickerActive, setColorPickerActive ] = useState( false );

	return (
		<Popover
			position="bottom"
			align="center"
			content={ <ColorPicker color={ color } onChange={ onChange } /> }
			contentClassName={ 'wpo-color-popover' }
		>
			<Button
				disabled={ colorPickerActive }
				className="color-button"
				onClick={ () => {
					setColorPickerActive( ! colorPickerActive );
				} }
			>
				<div
					className="color-block"
					style={ {
						backgroundColor: color,
					} }
				></div>
			</Button>
		</Popover>
	);
};

export default ColorSwatchButton;
