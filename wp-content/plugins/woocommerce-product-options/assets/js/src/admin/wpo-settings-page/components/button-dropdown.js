/**
 * WordPress dependencies.
 */
import { useState, useRef, useEffect } from '@wordpress/element';

/**
 * External dependencies.
 */
import { Button } from '@barn2plugins/components';

const ButtonDropdown = ( { id, label, items, maxItems, forceDropdown, ...others } ) => {
	maxItems = maxItems || 10;

	const [ isOpen, setIsOpen ] = useState( false );
	const thisButton = useRef( null );
	const hasDropdown = items?.length > 1 || items[ 0 ]?.subItems?.length > 0 || forceDropdown;
	const dropdownRef = useRef( null );

	const switchDropdownPosition = () => {
		if ( isOpen && dropdownRef.current ) {
			// switch position of dropdown if it's going off the screen
			const dropdown = dropdownRef.current;
			const dropdownRect = dropdown.getBoundingClientRect();
			const buttonRect = thisButton.current.getBoundingClientRect();
			const viewportHeight = window.innerHeight;
			const dropdownBottom = buttonRect.bottom + dropdownRect.height;
			const dropdownTop = buttonRect.top - dropdownRect.height;
			if ( dropdownBottom > viewportHeight ) {
				dropdown.classList.add( 'dropup' );
			} else if ( dropdownTop < 0 ) {
				dropdown.classList.remove( 'dropup' );
			}
		}
	};

	window.addEventListener( 'scroll', switchDropdownPosition );

	const toggleDropdown = () => {
		setIsOpen( ! isOpen );
	};

	const handleOutsideClick = ( e ) => {
		if ( thisButton.current && ! thisButton.current.contains( e.target ) ) {
			setIsOpen( false );
		}
	};

	useEffect( () => {
		if ( isOpen ) {
			document.addEventListener( 'mousedown', handleOutsideClick );
			return () => {
				document.removeEventListener( 'mousedown', handleOutsideClick );
			};
		}
	}, [ isOpen ] );

	const divideItems = ( allItems ) => {
		if ( maxItems === 0 || allItems.length <= maxItems ) {
			return allItems;
		}

		const newItems = allItems.slice( 0, maxItems );
		newItems.push( {
			key: 'more',
			value: 'more',
			label: 'more...',
			subItems: allItems.slice( maxItems ),
		} );

		return newItems;
	};

	const DropdownItem = ( props ) => {
		const onClick = () => {
			if ( ! props.item?.subItems?.length ) {
				props.item.onClick();
				setIsOpen( false );
			}
		};

		return (
			// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
			<li
				key={ props.id }
				className={ `dropdown-item ${ props.item.subItems && 'has-sub-menu' }` }
				onClick={ onClick }
			>
				<span>{ props.item.label }</span>
				{ props.item.subItems && (
					<ul className="sub-menu">
						{ divideItems( props.item.subItems ).map( ( subItem ) => (
							<DropdownItem key={ subItem.key } item={ subItem } />
						) ) }
					</ul>
				) }
			</li>
		);
	};

	return (
		<div key={ id } className="button-dropdown-container" ref={ thisButton }>
			<Button
				className={ `button ${ hasDropdown ? 'button-dropdown' : '' }` }
				onClick={ () => {
					if ( hasDropdown ) {
						toggleDropdown();
					} else {
						items[ 0 ].onClick();
					}
				} }
			>
				{ label }
			</Button>
			{ hasDropdown && isOpen && (
				<div className="dropdown" ref={ dropdownRef }>
					<ul className="dropdown-menu">
						{ divideItems( items ).map( ( item ) => (
							<DropdownItem key={ item.key } item={ item } />
						) ) }
					</ul>
				</div>
			) }
		</div>
	);
};

export default ButtonDropdown;
