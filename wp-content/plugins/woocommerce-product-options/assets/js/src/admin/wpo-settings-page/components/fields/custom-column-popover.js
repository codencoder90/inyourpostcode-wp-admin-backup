/**
 * External dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Popover } from '@barn2plugins/components';

const CustomColumnPopover = ( { setColumnState, columnState, disabled, imageCheckboxUnavailable = false } ) => {
    const [ currentState, setCurrentState ] = useState( { ...columnState } );
	
	const checkboxes = [
		{
			key: 'value',	
			label: __( 'Formula value', 'woocommerce-product-options' ),
		},
		! imageCheckboxUnavailable && {
			key: 'image',
			label: __( 'Image', 'woocommerce-product-options' ),
		},
		{
			key: 'selected',
			label: __( 'Selected by default', 'woocommerce-product-options' ),
		},
		wpoSettings?.isWholesaleProActive && {
			key: 'wholesale',
			label: __( 'Wholesale price', 'woocommerce-product-options' ),
		},
	].filter( Boolean );

	const triggerEscape = () => {
		const event = new window.KeyboardEvent( 'keydown', {
			key: 'Escape',
		} );

		document.dispatchEvent( event );
	};

	const onSave = () => {
		setColumnState( currentState );
		triggerEscape();
	};

	const onCancel = () => {
		setCurrentState( columnState );
		triggerEscape();
	};

	const onColumnChange = ( event ) => {
		const { id, checked } = event.target;

		setCurrentState( { ...currentState, [ id.replace( '-custom-column', '' ) ]: checked } );
	};

	const getPopoverContent = () => {
		return (
			<div className="wpo-custom-column-popover">
				<h4>{ __( 'Select which columns to display', 'woocommerce-product-options' ) }</h4>
				<ul className="column-list">
					{ checkboxes.map( ( checkbox ) => {
						const { key, label } = checkbox;
						const id = `${ key }-custom-column`;
						return (
							<li key={ id }>
								<label htmlFor={ id }>
									<input
										id={id }
										type="checkbox"
										checked={ currentState[ key ] }
										onChange={ onColumnChange }
										disabled={ disabled[ key ] }
									/>
									{ label }
								</label>
							</li>
						)
					} ) }
				</ul>
				<div className="inline-button-group">
					<Button variant="primary" onClick={ onSave }>
						{ __( 'Save changes' ) }
					</Button>
					<Button variant="secondary" onClick={ onCancel }>
						{ __( 'Cancel' ) }
					</Button>
				</div>
			</div>
		);
	};

	const popover = (
		<Popover content={ getPopoverContent() } position={ 'bottom' } align={ 'end' } onClickOutside={ onCancel }>
			<div className="wpo-custom-columns-popover-toggle"></div>
		</Popover>
	);

	useEffect( () => {
		setCurrentState( columnState );
	}, [ columnState ] );

	return popover;
};

export default CustomColumnPopover;
