/**
 * WordPress dependencies.
 */
import { useState, useEffect, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FormToggle, Dashicon } from '@wordpress/components';

/**
 * WooCommerce dependencies.
 */
import CurrencyFactory from '@woocommerce/currency';

/**
 * External dependencies.
 */
import { Button, Popover } from '@barn2plugins/components';
import { nanoid } from 'nanoid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import classnames from 'classnames';

/**
 * Internal dependencies.
 */
import WCPriceInput from './wc-price-input';
import WCPercentageInput from './wc-percentage-input';
import WCTableTooltip from '../wc-table-tooltip';
import ColorSwatchButton from '../color-swatch-button';
import ImageButton from '../image-button';
import CustomColumnPopover from './custom-column-popover';
import { getCustomPriceTypes } from '../../../../common/util/user-defined-functions';

const OptionChoicesRepeater = ( {
	option,
	singleChoice = false,
	maxQty,
	value,
	onChange = () => {},
	onColumnUpdate = () => {},
} ) => {
	const optionType = option?.type;
	const storeCurrency = useMemo( () => CurrencyFactory( wpoSettings.currency ), [ wpoSettings.currency ] );
	const previousType = useRef( optionType );
	const [ choicesLoaded, setChoicesLoaded ] = useState( false );
	const [ openedChoice, setOpenedChoice ] = useState( false );

	const containerClasses = classnames( 'option-setting-repeater wpo-choices-repeater', {
		'wpo-choices-is-single-choice': singleChoice,
		'wpo-choices-is-customer-price': optionType === 'customer_price',
	} );

	useEffect( () => {
		onColumnUpdate( columnState );
	} );

	/**
	 * Wholesale Pricing.
	 */
	const hasWholesaleRoles = wpoSettings?.isWholesaleProActive;

	const defaultChoice = {
		id: nanoid(),
		label: '',
		value: '',
		price_type: 'no_cost',
		pricing: '',
		selected: false,
		color: '#000000',
		media: null,
		wholesale: {},
	};
	const [ choices, setChoices ] = useState( [ defaultChoice ] );
	const [ columnState, setColumnState ] = useState( {
		image: false,
		value: false,
		selected: false,
		wholesale: false,
	} );

	const pricingComponents = {
		no_cost: {
			component: InputDisabled,
		},
		flat_fee: {
			component: WCPriceInput,
			props: {
				required: true,
				storeCurrency,
			},
		},
		quantity_based: {
			component: WCPriceInput,
			props: {
				required: true,
				storeCurrency,
			},
		},
		percentage_inc: {
			component: WCPercentageInput,
			props: {
				required: true,
				storeCurrency,
			},
		},
		percentage_dec: {
			component: WCPercentageInput,
			props: {
				required: true,
				storeCurrency,
				max: 100,
			},
		},
		char_count: {
			component: WCPriceInput,
			props: {
				required: true,
				storeCurrency,
			},
		},
		file_count: {
			component: WCPriceInput,
			props: {
				required: true,
				storeCurrency,
			},
		},
		...getCustomPriceTypes(),
	};

	const getColumnWidths = () => {
		const widths = {
			handle: '20px',
			label: '2fr',
			value: '112px',
			color: '60px',
			price_type: '1fr',
			pricing: '112px',
			wholesale: '78px',
			image: '86px',
			selected: '80px',
			remove: '32px',
			clone: '32px',
		};

		const colWidths = [];

		if ( ! singleChoice ) {
			colWidths.push( widths.handle );
		}

		colWidths.push( widths.label );

		if ( optionType === 'customer_price' ) {
			return colWidths.join( ' ' );
		}

		if ( ! singleChoice && columnState.value ) {
			colWidths.push( widths.value );
		}

		if ( optionType === 'color_swatches' ) {
			colWidths.push( widths.color );
		}

		colWidths.push( widths.price_type );
		colWidths.push( widths.pricing );

		if ( hasWholesaleRoles && columnState.wholesale ) {
			colWidths.push( widths.wholesale );
		}

		if ( optionType === 'images' || ( ! singleChoice && columnState.image ) ) {
			colWidths.push( widths.image );
		}

		if ( ! singleChoice && columnState.selected ) {
			colWidths.push( widths.selected );
		}

		if ( ! singleChoice ) {
			colWidths.push( widths.remove );
			colWidths.push( widths.clone );
		}

		return colWidths.join( ' ' );
	};

	/**
	 * Adds a new empty choice to the list.
	 *
	 * @param {Event} event
	 */
	const addChoice = ( event ) => {
		event.preventDefault();

		setChoices( ( prevChoices ) => [ ...prevChoices, defaultChoice ] );
		setOpenedChoice( defaultChoice.id );
	};

	/**
	 * Removes a choice from the list.
	 *
	 * @param {string} choiceId
	 */
	const removeChoice = ( choiceId ) => {
		const changedChoices = choices.filter( ( choice ) => choice.id !== choiceId );

		if ( changedChoices.length === 0 ) {
			changedChoices.push( defaultChoice );
		}

		setChoices( changedChoices );
		onChange( changedChoices );
	};

	/**
	 * Removes a choice from the list.
	 *
	 * @param {string} choiceId
	 */
	const cloneChoice = ( choiceId ) => {
		const clonedIndex = choices.findIndex( ( choice ) => choice.id === choiceId );

		if ( clonedIndex >= 0 ) {
			const match = choices[ clonedIndex ]?.label?.match?.( /\d+$/ );

			let newLabel = choices[ clonedIndex ].label;
			if ( match ) {
				newLabel = newLabel.replace( /\d+$/, parseInt( match[ 0 ] ) + 1 );
			} else {
				newLabel += ' 2';
			}

			const clonedChoice = {
				...choices[ clonedIndex ],
				id: nanoid(),
				label: newLabel,
				selected: false,
			};

			const changedChoices = [ ...choices ]
				.splice( 0, clonedIndex + 1 )
				.concat( clonedChoice, [ ...choices ].splice( clonedIndex + 1 ) );

			setChoices( changedChoices );
			setOpenedChoice( clonedChoice.id );
			onChange( changedChoices );
		}
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

			if ( key === 'price_type' && changeValue === 'no_cost' ) {
				return { ...choice, ...{ [ key ]: changeValue, pricing: false } };
			}

			if ( key === 'pricing' ) {
				return { ...choice, [ key ]: parseFloat( changeValue ) };
			}

			return { ...choice, [ key ]: changeValue };
		} );

		setChoices( newChoices );
		onChange( newChoices );
	};

	/**
	 * Handles the selected toggle.
	 *
	 * Checkboxes can have multiple toggles active.
	 *
	 * @param {boolean} selected
	 * @param {string}  choiceId
	 */
	const handleSelectedChange = ( selected, choiceId ) => {
		const newChoices = choices.map( ( choice ) => ( choice.id === choiceId ? { ...choice, selected } : choice ) );

		if (
			( ! [ 'checkbox', 'images', 'text_labels' ].includes( optionType ) && selected ) ||
			( [ 'checkbox', 'images', 'text_labels' ].includes( optionType ) && parseInt( maxQty ) === 1 && selected )
		) {
			newChoices.forEach( ( choice ) => {
				if ( choice.id !== choiceId ) {
					choice.selected = false;
				}
			} );
		}

		setChoices( newChoices );
		onChange( newChoices );
	};

	const onDragStart = ( draggableProps ) => {
		const tr = document.querySelector( `.wpo-choices-repeater tr[data-rfd-draggable-id="${draggableProps.draggableId}"]` );
		setDraggableTop( tr.rowIndex * tr.offsetHeight );
	}

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

	useEffect( () => {
		if ( optionType !== previousType.current ) {
			previousType.current = optionType;
		}
	}, [ optionType ] );

	useEffect( () => {
		if (
			JSON.stringify( [ { ...value?.[ 0 ], id: '' } ] ) !== JSON.stringify( [ { ...defaultChoice, id: '' } ] )
		) {
			setChoicesLoaded( true );
		}
	}, [ value ] );

	/**
	 * Keep only the first choice if the type is a single choice field.
	 */
	useEffect( () => {
		if ( ! value || value.length === 0 ) {
			setChoices( [ defaultChoice ] );
		}

		if ( value.length > 0 ) {
			setChoices( singleChoice ? [ value[ 0 ] ] : value );
		}
	}, [ value, singleChoice ] );

	useEffect( () => {
		if ( choicesLoaded ) {
			setColumnState( {
				image: value.some( ( choice ) => choice.media ),
				value: value.some( ( choice ) => choice.value !== '' ),
				selected: value.some( ( choice ) => choice.selected ),
				wholesale: value.some( ( choice ) => {
					return (
						Object.values( choice?.wholesale ?? {} ).filter( ( x ) => x !== null && x !== '' ).length > 0
					);
				} ),
			} );
		}
	}, [ choicesLoaded ] );

	/**
	 * Remove char_count and file_count pricing if the option type does not support it
	 */
	useEffect( () => {
		if ( [ 'text', 'text_area' ].includes( previousType ) && choices[ 0 ].price_type === 'char_count' ) {
			setChoices( [ { ...choices[ 0 ], ...{ price_type: 'no_cost', pricing: false } } ] );
		}
		if ( [ 'file_upload' ].includes( previousType ) && choices[ 0 ].price_type === 'file_count' ) {
			setChoices( [ { ...choices[ 0 ], ...{ price_type: 'no_cost', pricing: false } } ] );
		}
	}, [ previousType ] );

	/**
	 * If the maxQty is 1, disable the selected toggle on choices after the first one.
	 */
	useEffect( () => {
		const selectedChoices = choices.filter( ( choice ) => choice.selected );

		if ( parseInt( maxQty ) === 1 && selectedChoices.length > 1 ) {
			const newChoices = choices.map( ( choice ) => {
				if ( choice.selected && choice.id !== selectedChoices[ 0 ].id ) {
					return { ...choice, selected: false };
				}

				return choice;
			} );

			setChoices( newChoices );
			onChange( newChoices );
		}
	}, [ maxQty ] );

	return (
		<>
			<table className={ containerClasses } style={ { gridTemplateColumns: getColumnWidths() } }>
				<thead className="choice-headers">
					<tr>
						{ ! singleChoice && <th className="option-setting-repeater-draggable-col" colSpan={ 1 }></th> }
						<th className={ 'option-choices-repeater-label-col' } colSpan={ 1 }>
							{ __( 'Label', 'woocommerce-product-options' ) }
						</th>
						{ ! singleChoice && columnState.value && (
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

						{ optionType !== 'customer_price' && (
							<>
								<th className={ 'option-choices-repeater-price-type-col' } colSpan={ 1 }>
									{ __( 'Price Type', 'woocommerce-product-options' ) }
								</th>
								<th className={ 'option-choices-repeater-pricing-col' } colSpan={ 1 }>
									{ __( 'Pricing', 'woocommerce-product-options' ) }
								</th>
							</>
						) }

						{ hasWholesaleRoles && columnState.wholesale && (
							<th className={ 'option-choices-repeater-wholesale-col' } colSpan={ 1 }>
								{ __( 'Wholesale', 'woocommerce-product-options' ) }
							</th>
						) }

						{ ( optionType === 'images' || ( ! singleChoice && columnState.image ) ) && (
							<th className={ 'option-choices-repeater-image-col' } colSpan={ 1 }>
								{ __( 'Image', 'woocommerce-product-options' ) }
							</th>
						) }

						{ ! singleChoice && columnState.selected && (
							<th className={ 'option-choices-repeater-selected-col' } colSpan={ 1 }>
								{ __( 'Selected', 'woocommerce-product-options' ) }
								<WCTableTooltip
									tooltip={ __(
										'If you set a default option then this will be pre-selected on the product page.'
									) }
								/>
							</th>
						) }
						{ ! singleChoice && (
							<>
								<th className={ 'option-setting-repeater-remove-col' } colSpan={ 1 }></th>
								<th className={ 'option-setting-repeater-clone-col' } colSpan={ 1 }>
									<CustomColumnPopover
										setColumnState={ setColumnState }
										columnState={ columnState }
										disabled={ {
											image: choices.some( ( choice ) => choice.media ),
											value: choices.some( ( choice ) => choice.value?.trim?.() !== '' ),
											selected: choices.some( ( choice ) => choice?.selected ),
											wholesale: choices.some( ( choice ) =>
												Object.values( choice?.wholesale ?? {} ).some(
													( x ) => x !== null && x?.trim?.() !== ''
												)
											),
										} }
										imageCheckboxUnavailable={ optionType === 'images' }
									/>
								</th>
							</>
						) }
					</tr>
				</thead>
				<DragDropContext onDragEnd={ onDragEnd }>
					<Droppable droppableId="droppable">
						{ ( droppableProvided, droppableSnapshot ) => (
							<tbody { ...droppableProvided.droppableProps } ref={ droppableProvided.innerRef }>
								{ choices.map( ( choice, index ) => {
									const priceType = choice?.price_type ?? 'no_cost';
									const PricingComponent = pricingComponents[ priceType ].component;
									const pricingComponentProps = pricingComponents[ priceType ].props;

									const wholesalePopoverClass = classnames( 'wpo-wholesale-popover-icon', {
										'is-empty':
											! choice?.wholesale ||
											Object.values( choice.wholesale ).every( ( x ) => x === null || x === '' ),
									} );

									return (
										<Draggable key={ choice.id } draggableId={ choice.id } index={ index }>
											{ ( draggableProvided, draggableSnapshot ) => (
												<tr
													ref={ draggableProvided.innerRef }
													{ ...draggableProvided.draggableProps }
													className={
														'wpo-choice' + ( openedChoice === choice.id ? ' is-open' : '' )
													}
													style={ {
                                                        ...getItemStyle(
                                                            draggableSnapshot.isDragging,
                                                            draggableProvided.draggableProps.style
                                                        ),
                                                    } }
												>
													<td
														{ ...draggableProvided.dragHandleProps }
														className="drag-handle-wrap"
													>
														<Dashicon icon={ 'menu' } />
													</td>

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

													{ ! singleChoice && columnState.value && (
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
																color={ choice?.color ?? '#000000' }
															/>
														</td>
													) }

													{ optionType !== 'customer_price' && (
														<td colSpan={ 1 } className="price_type-wrap">
															<label
																htmlFor={ `wpo-choice-${ choice.id }-price_type` }
																className="compact-label"
															>
																{ __( 'Price Type', 'woocommerce-product-options' ) }
															</label>
															<select
																id={ `wpo-choice-${ choice.id }-price_type` }
																value={ choice?.price_type ?? defaultChoice.price_type }
																onChange={ ( event ) =>
																	handleChoiceChange(
																		event.target.value,
																		'price_type',
																		choice.id
																	)
																}
															>
																<option value={ 'no_cost' }>
																	{ __( 'No cost', 'woocommerce-product-options' ) }
																</option>
																<option value={ 'flat_fee' }>
																	{ __( 'Flat fee', 'woocommerce-product-options' ) }
																</option>
																<option value={ 'quantity_based' }>
																	{ __(
																		'Quantity-based fee',
																		'woocommerce-product-options'
																	) }
																</option>
																<option value={ 'percentage_inc' }>
																	{ __(
																		'Percentage increase',
																		'woocommerce-product-options'
																	) }
																</option>
																<option value={ 'percentage_dec' }>
																	{ __(
																		'Percentage decrease',
																		'woocommerce-product-options'
																	) }
																</option>
																{ [ 'text', 'textarea' ].includes( optionType ) && (
																	<option value={ 'char_count' }>
																		{ __(
																			'Character count',
																			'woocommerce-product-options'
																		) }
																	</option>
																) }
																{ [ 'file_upload' ].includes( optionType ) && (
																	<option value={ 'file_count' }>
																		{ __(
																			'File count',
																			'woocommerce-product-options'
																		) }
																	</option>
																) }
															</select>
														</td>
													) }

													{ optionType !== 'customer_price' && (
														<td colSpan={ 1 } className="pricing-wrap">
															<label
																htmlFor={ `wpo-choice-${ choice.id }-pricing` }
																className="compact-label"
															>
																{ __( 'Pricing', 'woocommerce-product-options' ) }
															</label>
															<PricingComponent
																id={ `wpo-choice-${ choice.id }-pricing` }
																{ ...pricingComponentProps }
																onChange={ ( newValue ) =>
																	handleChoiceChange( newValue, 'pricing', choice.id )
																}
																value={ choice?.pricing ?? defaultChoice.pricing }
															/>
														</td>
													) }

													{ optionType !== 'customer_price' &&
														hasWholesaleRoles &&
														columnState.wholesale && (
															<td colSpan={ 1 } className="wholesale-wrap">
																{
																	<>
																		<label
																			htmlFor={ `wpo-choice-${ choice.id }-wholesale` }
																			className="compact-label"
																		>
																			{ __(
																				'Wholesale',
																				'woocommerce-product-options'
																			) }
																		</label>
																		{ ! [ 'char_count', 'no_cost' ].includes(
																			choice?.price_type
																		) && (
																			<Popover
																				content={
																					<WholesaleRolePricing
																						choice={ choice }
																						value={
																							choice?.wholesale ??
																							defaultChoice.wholesale
																						}
																						onChange={ (
																							wholesalePricing
																						) => {
																							handleChoiceChange(
																								wholesalePricing,
																								'wholesale',
																								choice.id
																							);
																						} }
																					/>
																				}
																			>
																				<div
																					id={ `wpo-choice-${ choice.id }-wholesale` }
																					className={ wholesalePopoverClass }
																					style={ { display: 'inline' } }
																				>
																					<svg
																						xmlns="http://www.w3.org/2000/svg"
																						viewBox="0 0 512 512"
																						width="24"
																						height="24"
																						fill="#e2e4e7"
																					>
																						<path d="M471 261.4 260.9 49.8l-1.5-1.5h-.4c-8.3-7.9-17.9-12-29.9-12.3l-99.7-3.7-4.4-.2c-11.2.2-22.2 4.5-30.7 13.1L45.1 94.3c-9 9-13.1 20.9-13.1 32.7v.1l.3 4.2 6.7 97.3v2.1c1 8.7 4.5 17.3 10.4 24.4l5.5 5.4 206.3 208.8 3.1 3.1c11.9 10.5 30 10 41.3-1.4L471 304.4c11.8-11.8 12-31.1 0-43zM144 192c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48z" />
																					</svg>
																				</div>
																			</Popover>
																		) }
																	</>
																}
															</td>
														) }

													{ ( optionType === 'images' ||
														( ! singleChoice && columnState.image ) ) && (
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
																	handleChoiceChange( imageId, 'media', choice.id )
																}
																imageId={ choice?.media ?? null }
															/>
														</td>
													) }

													{ ! singleChoice && columnState.selected && (
														<td colSpan={ 1 } className="selected-wrap">
															<label
																htmlFor={ `wpo-choice-${ choice.id }-selected` }
																className="compact-label"
															>
																{ __( 'Selected', 'woocommerce-product-options' ) }
															</label>
															<FormToggle
																id={ `wpo-choice-${ choice.id }-selected` }
																checked={ choice?.selected ?? defaultChoice.selected }
																onChange={ () => {
																	handleSelectedChange(
																		! choice.selected,
																		choice.id
																	);
																} }
															/>
														</td>
													) }

													{ ! singleChoice && (
														<>
															<td colSpan={ 1 } className="trash-wrap">
																<Button
																	className="wpo-option-setting-repeater-remove"
																	disabled={ false }
																	title={ __(
																		'Remove this choice',
																		'woocommerce-product-options'
																	) }
																	onClick={ () => removeChoice( choice.id ) }
																>
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		viewBox="-2 -2 24 24"
																		width="24"
																		height="24"
																		aria-hidden="true"
																		focusable="false"
																		style={ { fill: 'currentColor' } }
																	>
																		<path d="M4 9h12v2H4V9z"></path>
																	</svg>
																</Button>
															</td>
															<td colSpan={ 1 } className="clone-wrap">
																<Button
																	className="wpo-option-setting-repeater-clone"
																	disabled={ false }
																	title={ __(
																		'Duplicate this choice',
																		'woocommerce-product-options'
																	) }
																	onClick={ () => cloneChoice( choice.id ) }
																>
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		viewBox="-10 -20 130 160"
																		width="24"
																		height="24"
																		aria-hidden="true"
																		focusable="false"
																		style={ { fill: 'currentColor' } }
																	>
																		<path d="M89.62,13.96v7.73h12.19h0.01v0.02c3.85,0.01,7.34,1.57,9.86,4.1c2.5,2.51,4.06,5.98,4.07,9.82h0.02v0.02 v73.27v0.01h-0.02c-0.01,3.84-1.57,7.33-4.1,9.86c-2.51,2.5-5.98,4.06-9.82,4.07v0.02h-0.02h-61.7H40.1v-0.02 c-3.84-0.01-7.34-1.57-9.86-4.1c-2.5-2.51-4.06-5.98-4.07-9.82h-0.02v-0.02V92.51H13.96h-0.01v-0.02c-3.84-0.01-7.34-1.57-9.86-4.1 c-2.5-2.51-4.06-5.98-4.07-9.82H0v-0.02V13.96v-0.01h0.02c0.01-3.85,1.58-7.34,4.1-9.86c2.51-2.5,5.98-4.06,9.82-4.07V0h0.02h61.7 h0.01v0.02c3.85,0.01,7.34,1.57,9.86,4.1c2.5,2.51,4.06,5.98,4.07,9.82h0.02V13.96L89.62,13.96z M79.04,21.69v-7.73v-0.02h0.02 c0-0.91-0.39-1.75-1.01-2.37c-0.61-0.61-1.46-1-2.37-1v0.02h-0.01h-61.7h-0.02v-0.02c-0.91,0-1.75,0.39-2.37,1.01 c-0.61,0.61-1,1.46-1,2.37h0.02v0.01v64.59v0.02h-0.02c0,0.91,0.39,1.75,1.01,2.37c0.61,0.61,1.46,1,2.37,1v-0.02h0.01h12.19V35.65 v-0.01h0.02c0.01-3.85,1.58-7.34,4.1-9.86c2.51-2.5,5.98-4.06,9.82-4.07v-0.02h0.02H79.04L79.04,21.69z M105.18,108.92V35.65v-0.02 h0.02c0-0.91-0.39-1.75-1.01-2.37c-0.61-0.61-1.46-1-2.37-1v0.02h-0.01h-61.7h-0.02v-0.02c-0.91,0-1.75,0.39-2.37,1.01 c-0.61,0.61-1,1.46-1,2.37h0.02v0.01v73.27v0.02h-0.02c0,0.91,0.39,1.75,1.01,2.37c0.61,0.61,1.46,1,2.37,1v-0.02h0.01h61.7h0.02 v0.02c0.91,0,1.75-0.39,2.37-1.01c0.61-0.61,1-1.46,1-2.37h-0.02V108.92L105.18,108.92z"></path>
																	</svg>
																</Button>
															</td>
														</>
													) }
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

			{ ! singleChoice && (
				<Button
					className="wpo-option-setting-repeater-add"
					onClick={ addChoice }
					disabled={ false }
					title={ __( 'Add a choice', 'woocommerce-product-options' ) }
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						width="24"
						height="24"
						aria-hidden="true"
						focusable="false"
						style={ { fill: 'currentColor' } }
					>
						<path d="M18 11.2h-5.2V6h-1.6v5.2H6v1.6h5.2V18h1.6v-5.2H18z"></path>
					</svg>
				</Button>
			) }
		</>
	);
};

const InputDisabled = () => <input type="text" disabled />;

const WholesaleRolePricing = ( { choice, value, onChange = () => {} } ) => {
	const storeCurrency = useMemo( () => CurrencyFactory( wpoSettings.currency ), [ wpoSettings.currency ] );

	const pricingComponents = {
		flat_fee: {
			component: WCPriceInput,
			props: {
				storeCurrency,
			},
		},
		quantity_based: {
			component: WCPriceInput,
			props: {
				storeCurrency,
			},
		},
		percentage_inc: {
			component: WCPercentageInput,
			props: {
				storeCurrency,
			},
		},
		percentage_dec: {
			component: WCPercentageInput,
			props: {
				storeCurrency: {
					...storeCurrency,
					max: 100,
				},
			},
		},
		char_count: {
			component: WCPriceInput,
			props: {
				storeCurrency,
			},
		},
		file_count: {
			component: WCPriceInput,
			props: {
				storeCurrency,
			},
		},
	};

	const wholesaleRoles = Object.values( wpoSettings.wholesaleRoles );
	const [ wholesalePricing, setWholesalePricing ] = useState( value ?? {} );

	const priceType = choice?.price_type ?? 'no_cost';
	const PricingComponent = pricingComponents[ priceType ].component;
	const pricingComponentProps = pricingComponents[ priceType ].props;

	const infoMessage = useMemo( () => {
		switch ( choice?.price_type ) {
			case 'flat_fee':
			case 'quantity_based':
				return __( 'Set specific pricing for your wholesale roles.', 'woocommerce-product-options' );
			case 'percentage_inc':
			case 'percentage_dec':
				return __( 'Set specific percentages for your wholesale roles.', 'woocommerce-product-options' );
			default:
				return null;
		}
	}, [ choice ] );

	const renderWholesalePricingInputs = () => {
		return (
			<div className="wpo-wholesale-pricing">
				{ wholesaleRoles.map( ( role ) => {
					return (
						<div className="wpo-wholesale-pricing-role" key={ `wpo-${ role.name }` }>
							<label htmlFor={ role.name }>
								<strong>{ role.label }</strong>
							</label>
							<PricingComponent
								{ ...pricingComponentProps }
								onChange={ ( newValue ) => handleWholeSalePricingChange( role.name, newValue ) }
								value={ wholesalePricing?.[ role.name ] ?? '' }
							/>
						</div>
					);
				} ) }
			</div>
		);
	};

	const handleWholeSalePricingChange = ( role, amount ) => {
		amount = parseFloat( amount );

		if ( isNaN( amount ) ) {
			delete wholesalePricing[ role ];
			setWholesalePricing( { ...wholesalePricing } );
			return;
		}

		setWholesalePricing( { ...wholesalePricing, [ role ]: parseFloat( amount ) } );
	};

	useEffect( () => {
		onChange( wholesalePricing );
	}, [ wholesalePricing ] );

	return (
		<>
			<span>{ infoMessage }</span>
			{ renderWholesalePricingInputs() }
		</>
	);
};

export default OptionChoicesRepeater;
