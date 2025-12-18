/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { VisuallyHidden } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { optionTypes, visualOptionTypes } from '../../config';
import WCTableTooltip from '../wc-table-tooltip';

/**
 * External dependencies.
 */
import { Icon } from '@wordpress/icons';
import classNames from 'classnames';

const OptionTypeSelector = ( { onChange = () => {}, selected } ) => {
	const [ selectedType, setType ] = useState( selected );

	const onChangeCallback = ( event ) => {
		const { name } = event.target;

		setType( name );
		onChange( name );
	};

	const typeButtons = optionTypes.map( ( type ) => {
		const labelClass = classNames( {
			'wpo-type-label': true,
			selected: type.key === selectedType,
		} );

		return (
			<label className={ labelClass } htmlFor={ type.key } key={ type.key }>
				<VisuallyHidden>
					<input
						id={ type.key }
						name={ type.key }
						type="radio"
						checked={ type.key === selectedType }
						onChange={ onChangeCallback }
					/>
				</VisuallyHidden>

				<Icon size={ 32 } icon={ type.icon } />

				<span>{ type.label }</span>
			</label>
		);
	} );

	const visualTypeButtons = visualOptionTypes.map( ( type ) => {
		const labelClass = classNames( {
			'wpo-type-label': true,
			selected: type.key === selectedType,
		} );

		return (
			<label className={ labelClass } htmlFor={ type.key } key={ type.key }>
				<VisuallyHidden>
					<input
						id={ type.key }
						name={ type.key }
						type="radio"
						checked={ type.key === selectedType }
						onChange={ onChangeCallback }
					/>
				</VisuallyHidden>

				<Icon size={ 32 } icon={ type.icon } />

				<span>{ type.label }</span>
			</label>
		);
	} );

	return (
		<div className="wpo-option-types">
			<div className="wpo-type-selector">{ typeButtons }</div>
			<h4>
				{ __( 'Static content', 'woocommerce-product-options' ) }{ ' ' }
				<WCTableTooltip
					tooltip={ __(
						'Use static content to add extra information before, after or between your product options - for example, this is useful for adding headings between the options.',
						'woocommerce-product-options'
					) }
				/>
			</h4>
			<div className="wpo-type-selector">{ visualTypeButtons }</div>
		</div>
	);
};

export default OptionTypeSelector;
