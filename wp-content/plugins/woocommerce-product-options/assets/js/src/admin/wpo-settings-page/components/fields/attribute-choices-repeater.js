/**
 * WordPress dependencies.
 */
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FormToggle, Dashicon } from '@wordpress/components';

/**
 * External dependencies.
 */
import { nanoid } from 'nanoid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

/**
 * Internal dependencies.
 */
import WCTableTooltip from '../wc-table-tooltip';
import ColorSwatchButton from '../color-swatch-button';
import ImageButton from '../image-button';
import CustomColumnPopover from './custom-column-popover';
import { useProductAttributes } from '../../hooks/options';

const AttributeChoicesRepeater = ( {
	option,
	productAttribute,
	value,
	onChange = () => {},
	onColumnUpdate = () => {},
} ) => {
	const optionType = option?.type;
	const previousType = useRef( optionType );
	const [ choicesLoaded, setChoicesLoaded ] = useState( false );
	const [ openedChoice, setOpenedChoice ] = useState( false );

	const containerClasses = 'option-setting-repeater wpo-choices-repeater';

	const { attributes, selectedAttribute } = useProductAttributes( productAttribute );
	const attributeTerms = selectedAttribute[ 0 ]?.terms || [];

	useEffect( () => {
		onColumnUpdate( columnState );
	} );

	const defaultChoice = {
		id: nanoid(),
		label: '',
		value: '',
		price_type: 'no_cost',
		pricing: '',
		selected: false,
		color: null,
		media: null,
		wholesale: {},
	};

	const [ choices, setChoices ] = useState( [ defaultChoice ] );
	const singleChoice = choices.length === 1;
	const [ columnState, setColumnState ] = useState( {
		image: false,
		value: false,
		selected: false,
	} );

	const getColumnWidths = () => {
		const widths = {
			handle: '20px',
			label: '1fr',
			value: '112px',
			color: '60px',
			image: '86px',
			selected: '80px',
			settings: '60px',
		};

		const colWidths = [];

		if ( ! singleChoice ) {
			colWidths.push( widths.handle );
		}

		colWidths.push( widths.label );

		if ( columnState.value ) {
			colWidths.push( widths.value );
		}

		if ( optionType === 'color_swatches' ) {
			colWidths.push( widths.color );
		}

		if ( optionType === 'images' || columnState.image ) {
			colWidths.push( widths.image );
		}

		if ( columnState.selected ) {
			colWidths.push( widths.selected );
		}

		colWidths.push( widths.settings );

		return colWidths.join( ' ' );
	};

	/**
	 * Handle a value change for a choice.
	 *
	 * @param {any}    changeValue
	 * @param {string} key
	 * @param {string} choiceId
	 */
	const handleChoiceChange = ( changeValue, key, choiceId ) => {
		const newChoices = choices.map( ( choice ) => {
			if ( choice.id !== choiceId ) {
				return choice;
			}

			return { ...choice, [ key ]: changeValue };
		} );

		setChoices( newChoices );
		onChange( newChoices );
	};

	/**
	 * Handles the selected toggle. Only one choice can be selected for attribute choices.
	 *
	 * @param {boolean} selected
	 * @param {string}  choiceId
	 */
	const handleSelectedChange = ( selected, choiceId ) => {
		const newChoices = choices.map( ( choice ) => ( choice.id === choiceId ? { ...choice, selected } : choice ) );

		newChoices.forEach( ( choice ) => {
			if ( choice.id !== choiceId ) {
				choice.selected = false;
			}
		} );

		setChoices( newChoices );
		onChange( newChoices );
	};

	/**
	 * Handles the drag and drop of choices.
	 *
	 * @param {Array} result
	 */
	const onDragEnd = ( result ) => {
		// dropped outside the list
		if ( ! result.destination ) {
			return;
		}

		const reorderedChoices = choices;
		const [ moved ] = reorderedChoices.splice( result.source.index, 1 );

		reorderedChoices.splice( result.destination.index, 0, moved );

		setChoices( reorderedChoices );
		onChange( reorderedChoices );
	};

	const getItemStyle = ( isDragging, draggableStyle ) => ( {
		userSelect: 'none',

		...draggableStyle,
		...( isDragging
			? {
					gridAutoFlow: 'column',
					gap: '20px',
					backgroundColor: '#f7f7f7',
					border: '1px solid #e2e4e7',
					borderRadius: '6px',
			  }
			: {} ),
	} );

	/**
	 * Get the edit term link for an attribute term slug.
	 *
	 * @param {string} termSlug
	 * @return {string}
	 */
	const getTermLink = ( termSlug ) => {
		const term = attributeTerms.find( ( term ) => term.id === termSlug );

		return term?.link ?? '';
	};

	/**
	 * Get the image id for a choice.
	 *
	 * @param {Object} choice
	 * @return {?string}
	 */
	const getImageId = ( choice ) => {
		// if we already have the image id, return it
		if ( choice.media ) {
			return choice.media;
		}

		// if wfp active check for default image from term
		if ( wpoSettings.isProductFiltersActive ) {
			const term = attributeTerms.find( ( term ) => term.id === choice.term );

			if ( term?.wfpImage ) {
				return term.wfpImage;
			}
		}

		return null;
	};

	/**
	 * Get the color for a choice.
	 *
	 * @param {Object} choice
	 * @return {string}
	 */
	const getColor = ( choice ) => {
		// if we already have the color, return it
		if ( choice.color ) {
			return choice.color;
		}

		// if wfp active check for default color from term
		if ( wpoSettings.isProductFiltersActive ) {
			const term = attributeTerms.find( ( term ) => term.id === choice.term );

			if ( term?.wfpColor ) {
				return term.wfpColor;
			}
		}

		return '#000000';
	};

	/**
	 * Set the previous option type as the current if it doesn't match?
	 */
	useEffect( () => {
		if ( optionType !== previousType.current ) {
			previousType.current = optionType;
		}
	}, [ optionType ] );

	/**
	 * Check if a non default choice exists in the first choice of the saved value?
	 */
	useEffect( () => {
		if (
			JSON.stringify( [ { ...value?.[ 0 ], id: '' } ] ) !== JSON.stringify( [ { ...defaultChoice, id: '' } ] )
		) {
			setChoicesLoaded( true );
		}
	}, [ value ] );

	/**
	 * Handle populating the choices from the attribute terms.
	 */
	useEffect( () => {
		if ( attributeTerms.length === 0 ) {
			return;
		}

		if ( attributeTerms.length > 0 && value.length === 0 ) {
			const termChoices = attributeTerms.map( ( term ) => ( {
				id: nanoid(),
				label: term.label,
				value: '',
				term: term.id,
				price_type: 'no_cost',
				pricing: '',
				selected: false,
				color: null,
				media: null,
				wholesale: {},
			} ) );

			setChoices( termChoices );
			onChange( termChoices );
			return;
		}

		// Handle merging saved choices with attribute terms
		if ( value?.length > 0 ) {
			const termMap = new Map( attributeTerms.map( ( term ) => [ term.id, term ] ) );

			// Filter out saved choices that correspond to removed terms
			const validSavedChoices = value.filter( ( choice ) => termMap.has( choice.term ) );

			// Create new choices for new terms that don't exist in saved choices
			const existingSavedValues = new Set( validSavedChoices.map( ( choice ) => choice.term ) );
			const newTermChoices = attributeTerms
				.filter( ( term ) => ! existingSavedValues.has( term.id ) )
				.map( ( term ) => ( {
					id: nanoid(),
					label: term.label,
					value: '',
					term: term.id,
					price_type: 'no_cost',
					pricing: '',
					selected: false,
					color: '#000000',
					media: null,
					wholesale: {},
				} ) );

			// Merge valid saved choices with new term choices
			const mergedChoices = [
				...validSavedChoices.map( ( choice ) => ( {
					...choice,
					// Ensure the label is synced with the current term label
					label: termMap.get( choice.term ).label,
				} ) ),
				...newTermChoices,
			];

			setChoices( mergedChoices );

			// Sync the saved choices with the merged choices if they are different
			if ( JSON.stringify( value ) !== JSON.stringify( mergedChoices ) ) {
				onChange( mergedChoices );
			}
		}
	}, [ attributeTerms, value ] );

	/**
	 * Set the column state if the choices are loaded (based on above use effect of the first option value)
	 */
	useEffect( () => {
		if ( choicesLoaded ) {
			setColumnState( {
				image: value.some( ( choice ) => choice.media ),
				value: value.some( ( choice ) => choice.value !== '' ),
				selected: value.some( ( choice ) => choice.selected ),
			} );
		}
	}, [ choicesLoaded ] );

	return (
		<>
			{ ! productAttribute ? (
				<div>{ __( 'Please select a variation attribute.', 'woocommerce-product-options' ) }</div>
			) : (
				<table className={ containerClasses } style={ { gridTemplateColumns: getColumnWidths() } }>
					<thead className="choice-headers">
						<tr>
							{ ! singleChoice && (
								<th className="option-setting-repeater-draggable-col" colSpan={ 1 }></th>
							) }
							<th className={ 'option-choices-repeater-label-col' } colSpan={ 1 }>
								{ __( 'Label', 'woocommerce-product-options' ) }
							</th>
							{ columnState.value && (
								<th className={ 'option-choices-repeater-value-col' } colSpan={ 1 }>
									{ __( 'Formula value', 'woocommerce-product-options' ) }
									<WCTableTooltip
										tooltip={ __(
											'A value that can be used in price formulas.',
											'woocommerce-product-options'
										) }
									/>
								</th>
							) }
							{ optionType === 'color_swatches' && (
								<th className={ 'option-choices-repeater-color-col' } colSpan={ 1 }>
									{ __( 'Color', 'woocommerce-product-options' ) }
								</th>
							) }
							{ ( optionType === 'images' || columnState.image ) && (
								<th className={ 'option-choices-repeater-image-col' } colSpan={ 1 }>
									{ __( 'Image', 'woocommerce-product-options' ) }
								</th>
							) }
							{ columnState.selected && (
								<th className={ 'option-choices-repeater-selected-col' } colSpan={ 1 }>
									{ __( 'Selected', 'woocommerce-product-options' ) }
									<WCTableTooltip
										tooltip={ __(
											'If you set a default option then this will be pre-selected on the product page.'
										) }
									/>
								</th>
							) }

							<th className={ 'option-setting-repeater-column-settings-col' } colSpan={ 1 }>
								<CustomColumnPopover
									setColumnState={ setColumnState }
									columnState={ columnState }
									disabled={ {
										image: choices.some( ( choice ) => choice.media ),
										value: false,
										selected: choices.some( ( choice ) => choice?.selected ),
										wholesale: true,
									} }
									imageCheckboxUnavailable={ optionType === 'images' }
								/>
							</th>
						</tr>
					</thead>
					<DragDropContext onDragEnd={ onDragEnd }>
						<Droppable droppableId="droppable">
							{ ( droppableProvided, droppableSnapshot ) => (
								<tbody { ...droppableProvided.droppableProps } ref={ droppableProvided.innerRef }>
									{ choices.map( ( choice, index ) => {
										return (
											<Draggable
												key={ choice.id }
												draggableId={ `${ choice.id }` }
												index={ index }
											>
												{ ( draggableProvided, draggableSnapshot ) => (
													<tr
														ref={ draggableProvided.innerRef }
														{ ...draggableProvided.draggableProps }
														className={
															'wpo-choice' +
															( openedChoice === choice.id ? ' is-open' : '' )
														}
														style={ getItemStyle(
															draggableSnapshot.isDragging,
															draggableProvided.draggableProps.style
														) }
													>
														{ ! singleChoice && (
															<td
																{ ...draggableProvided.dragHandleProps }
																className="drag-handle-wrap"
															>
																<Dashicon icon={ 'menu' } />
															</td>
														) }

														<td colSpan={ 1 } className="label-wrap">
															<label
																htmlFor={ `wpo-option-${ option.id }-choice-${ choice.id }-label` }
																className="compact-label"
															>
																{ __( 'Label', 'woocommerce-product-options' ) }
															</label>
															<input
																id={ `wpo-option-${ option.id }-choice-${ choice.id }-label` }
																required
																type="text"
																disabled={ true }
																value={ choice?.label ?? defaultChoice.label }
																name={ `wpo-option-${ option.id }-choice-${ choice.id }-label` }
																onChange={ ( event ) =>
																	handleChoiceChange(
																		event.target.value,
																		'label',
																		choice.id
																	)
																}
															/>
															<Dashicon
																icon={
																	openedChoice === choice.id
																		? 'arrow-up-alt2'
																		: 'arrow-down-alt2'
																}
																className="choice-toggle"
																onClick={ () =>
																	setOpenedChoice(
																		openedChoice === choice.id ? false : choice.id
																	)
																}
															/>
														</td>

														{ columnState.value && (
															<td colSpan={ 1 } className="value-wrap">
																<label
																	htmlFor={ `wpo-choice-${ choice.id }-value` }
																	className="compact-label"
																>
																	{ __( 'Value', 'woocommerce-product-options' ) }
																	<WCTableTooltip
																		tooltip={ __(
																			'A value that can be used in price formulas.',
																			'woocommerce-product-options'
																		) }
																	/>
																</label>
																<input
																	id={ `wpo-choice-${ choice.id }-value` }
																	type="text"
																	value={ choice?.value ?? defaultChoice.value }
																	onChange={ ( event ) =>
																		handleChoiceChange(
																			event.target.value,
																			'value',
																			choice.id
																		)
																	}
																/>
															</td>
														) }

														{ optionType === 'color_swatches' && (
															<td colSpan={ 1 } className="color-wrap">
																<label
																	htmlFor={ `wpo-choice-${ choice.id }-color` }
																	className="compact-label"
																>
																	{ __( 'Color', 'woocommerce-product-options' ) }
																</label>
																<ColorSwatchButton
																	id={ `wpo-choice-${ choice.id }-color` }
																	onChange={ ( color ) =>
																		handleChoiceChange( color, 'color', choice.id )
																	}
																	color={ getColor( choice ) }
																/>
															</td>
														) }

														{ ( optionType === 'images' || columnState.image ) && (
															<td colSpan={ 1 } className="image-wrap">
																<label
																	htmlFor={ `wpo-choice-${ choice.id }-image` }
																	className="compact-label"
																>
																	{ __( 'Image', 'woocommerce-product-options' ) }
																</label>
																<ImageButton
																	id={ `wpo-choice-${ choice.id }-image` }
																	onChange={ ( imageId ) =>
																		handleChoiceChange(
																			imageId,
																			'media',
																			choice.id
																		)
																	}
																	imageId={ getImageId( choice ) }
																/>
															</td>
														) }

														{ columnState.selected && (
															<td colSpan={ 1 } className="selected-wrap">
																<label
																	htmlFor={ `wpo-choice-${ choice.id }-selected` }
																	className="compact-label"
																>
																	{ __( 'Selected', 'woocommerce-product-options' ) }
																</label>
																<FormToggle
																	id={ `wpo-choice-${ choice.id }-selected` }
																	checked={
																		choice?.selected ?? defaultChoice.selected
																	}
																	onChange={ () => {
																		handleSelectedChange(
																			! choice.selected,
																			choice.id
																		);
																	} }
																/>
															</td>
														) }

														<td colSpan={ 1 } className="column-settings-wrap">
															<a href={ getTermLink( choice.term ) } target="_blank">
																<Dashicon icon={ 'external' } />
															</a>
														</td>
													</tr>
												) }
											</Draggable>
										);
									} ) }
									{ droppableProvided.placeholder }
								</tbody>
							) }
						</Droppable>
					</DragDropContext>
				</table>
			) }
			<div className="wpo-attribute-options-footer">
				<div className="wpo-attribute-options-note">
					{ __(
						'All terms are listed above, but only those which are available as variations for the current product will appear on the front end.',
						'woocommerce-product-options'
					) }
					<br />
					{ __(
						'To change the name and price of each choice, edit the variation on the Edit Product page.',
						'woocommerce-product-options'
					) }
				</div>
				<div className="wpo-attribute-options-documentation">
					<a
						href="https://barn2.com/kb/creating-product-options/#choice-type"
						target="_blank"
						rel="noreferrer"
					>
						<Dashicon icon="book" />
						{ __( 'Documentation', 'woocommerce-product-options' ) }
					</a>
				</div>
			</div>
		</>
	);
};

export default AttributeChoicesRepeater;
