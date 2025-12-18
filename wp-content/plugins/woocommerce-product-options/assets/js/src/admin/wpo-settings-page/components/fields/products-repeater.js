/**
 * WordPress dependencies.
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies.
 */
import { Button } from '@barn2plugins/components';
import { nanoid } from 'nanoid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { usePreviousDifferent, useDebouncedValue } from 'rooks';
import classnames from 'classnames';
import { useMultipleAdminNotifications } from '@barn2plugins/react-helpers';

/**
 * Internal dependencies.
 */
import WCTableTooltip from '../wc-table-tooltip';
import { spinner, crossX } from '../../svg';

const ProductsRepeater = ( { optionType, singleChoice = false, maxQty, value, onChange = () => {} } ) => {
	const previousType = usePreviousDifferent( optionType );
	const { setNotification } = useMultipleAdminNotifications();
	const [ draggableTop, setDraggableTop ] = useState( 0 );

	const containerClasses = classnames( 'option-setting-repeater wpo-choices-repeater wpo-products-repeater', {
		'wpo-choices-is-customer-price': optionType === 'customer_price',
	} );

	// Track the product search term.
	const [ searchTerm, setSearchTerm ] = useState( {} );
	// Track a debounced search term.
	const [ debouncedSearchTerm ] = useDebouncedValue( searchTerm, 500 );

	// default choice
	const defaultChoice = {
		id: nanoid(),
		label: '',
		product_id: '',
		product_name: '',
		pricing: false,
		attributes: [],
	};

	const [ choices, setChoices ] = useState( [ defaultChoice ] );
	const [ isSearchingVariations, setIsSearchingVariations ] = useState( false );
	const [ currentChoice, setCurrentChoice ] = useState( '' );
	const [ productVariations, setProductVariations ] = useState( [] );
	const [ isSearchingProduct, setIsSearchingProduct ] = useState( false );
	const [ wcSearchedProducts, setWcSearchedProducts ] = useState( false );
	const [ productsLoaded, setProductsLoaded ] = useState( false );

	/**
	 * Adds a new empty choice to the list.
	 *
	 * @param {Event} event
	 */
	const addChoice = ( event ) => {
		event.preventDefault();

		setChoices( ( prevChoices ) => [ ...prevChoices, defaultChoice ] );
	};

	/**
	 * Removes a choice from the list.
	 *
	 * @param {string} choiceId
	 */
	const removeChoice = ( choiceId ) => {
		const changedChoices = choices?.filter( ( choice ) => choice.id !== choiceId );

		setProductVariations( [
			...productVariations?.filter( ( choiceVariations ) => {
				return choiceVariations.choiceId !== choiceId;
			} ),
		] );

		if ( changedChoices.length === 0 ) {
			changedChoices.push( defaultChoice );
		}

		setChoices( changedChoices );
		onChange( changedChoices );

		// reset the search
		setWcSearchedProducts( false );
		setSearchTerm( [] );
	};

	/**
	 * On component mount, trigger an automated search for selected products.
	 */
	// useEffect( () => {
	// 	if ( ! choices || ! Array.isArray( choices ) || choices.length < 1 ) {
	// 		return;
	// 	}
	// 	// list the product ids
	// 	const productIDs = choices.map( ( choice ) => choice.label );
	// 	// fetch the products from rest api
	// 	const fetchProducts = async () => {
	// 		const includeParams = new URLSearchParams( {
	// 			include: productIDs,
	// 			per_page: productIDs.length,
	// 		} );

	// 		const wcProducts = await apiFetch( {
	// 			path: `/wc/v3/products/?${ includeParams.toString() }`,
	// 		} ).catch( () => {
	// 			setNotification( 'error', 'There was a problem fetching your products.' );
	// 		} );
	// 		// update the choices with product names
	// 		choices.map( ( choice ) => {
	// 			const product = wcProducts.find( ( product ) => product.id === choice.label );
	// 			if ( product?.id === choice.label ) {
	// 				choice.label = product.name;
	// 				choice.product_name = product.name;
	// 				return choice;
	// 			}
	// 		} );

	// 		setChoices( choices );
	// 	};

	// 	fetchProducts();
	// }, [ productsLoaded ] );

	/**
	 * Return the selected products
	 *
	 * @returns {string} excludeSelectedProduct
	 */
	const selectedProducts = () => {
		if ( ! choices || ! Array.isArray( choices ) || choices.length < 1 ) {
			return;
		}
		// list the product ids
		const productIDs = choices.map( ( choice ) => choice.product_id );
		return productIDs.join( ',' );
	};

	/**
	 * On product search term change, trigger a search.
	 */
	useEffect( () => {
		if ( debouncedSearchTerm ) {
			searchProducts();
		}
	}, [ debouncedSearchTerm ] );

	/**
	 * Search the products from the WC API on use of debounced search term.
	 *
	 * @return {Array} wcProducts
	 */
	const searchProducts = async () => {
		// return if not searched for products yet
		if ( ! searchTerm.value ) {
			return;
		}
		// get the search product term and choice id
		const productName = searchTerm.value;
		const choiceId = searchTerm.choiceId;
		const excludeSelectedProduct = selectedProducts();

		setIsSearchingProduct( true );

		const searchParams = new URLSearchParams( {
			search: productName,
			exclude: excludeSelectedProduct,
		} );

		const wcProducts = await apiFetch( {
			path: `/wc/v3/products/?${ searchParams.toString() }`,
		} ).catch( () => {
			setNotification(
				'error',
				__( 'There was a problem fetching your products', 'woocommerce-product-options' )
			);
		} );
		setIsSearchingProduct( false );

		const onlySimpleAndVariableProducts = wcProducts?.filter(
			( product ) => product.type === 'simple' || product.type === 'variable'
		);

		const productsWithChoiceId = onlySimpleAndVariableProducts.map( ( product ) => {
			return { ...product, choiceId };
		} );

		setWcSearchedProducts( productsWithChoiceId );
	};

	/**
	 * Handle a value change for a choice.
	 *
	 * @param {obj} product
	 * @param {obj} choice
	 */
	const handleProductChange = ( product, choice ) => {
		const newChoices = [ ...choices.filter( ( includedChoice ) => includedChoice.id !== choice.id ), choice ];

		// reset the search
		setWcSearchedProducts( false );
		setSearchTerm( [] );
		// set new choices
		setChoices( newChoices );
		onChange( newChoices );

		if ( product.type === 'variable' ) {
			setIsSearchingVariations( true );
		}
	};

	const handleVariationAdd = ( variation, choiceProduct ) => {
		const newChoices = choices.map( ( choice ) => {
			if ( choice.id !== choiceProduct.id ) {
				return choice;
			}

			if ( choice.variations?.length > 0 ) {
				choice.variations.push( {
					id: variation.id,
					name: variation.name,
					attributes: variation.attributes,
				} );
			} else {
				choice.variations = [
					{
						id: variation.id,
						name: variation.name,
						attributes: variation.attributes,
					},
				];
			}

			return choice;
		} );

		setChoices( newChoices );
		onChange( newChoices );
	};

	const handleClearVariation = ( variation, choiceProduct ) => {
		const newChoices = choices.map( ( choice ) => {
			if ( choice.id !== choiceProduct.id ) {
				return choice;
			}
			const filteredVariations = choice.variations?.filter(
				( variationItem ) => variationItem.id !== variation.id
			);

			choice.variations = filteredVariations;

			return choice;
		} );

		setChoices( newChoices );
		onChange( newChoices );
	};

	const onDragStart = ( draggableProps ) => {
		const tr = document.querySelector(
			`.wpo-manual-products tr[data-rfd-draggable-id="${ draggableProps.draggableId }"]`
		);
		setDraggableTop( tr.rowIndex * tr.offsetHeight );
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
	};

	useEffect( () => {
		if ( ! isSearchingVariations ) {
			return;
		}

		fetchVariations();
	}, [ isSearchingVariations, currentChoice ] );

	const fetchVariations = async () => {
		let variations = productVariations.find( ( choiceVariations ) => {
			return choiceVariations.choiceId === currentChoice.id;
		} )?.variations;

		if ( ! variations || variations.length === 0 ) {
			if ( ! currentChoice.product_id ) {
				setIsSearchingVariations( false );
				return;
			}

			const params = new URLSearchParams( {
				per_page: 100,
			} );

			variations = await apiFetch( {
				path: `/wc/v3/products/${ currentChoice.product_id }/variations/?${ params.toString() }`,
			} ).catch( () => {
				setNotification( 'error', 'There was a problem fetching your products.' );
			} );
		}

		const otherChoicesProductVariations = productVariations?.filter( ( choiceVariations ) => {
			return choiceVariations.choiceId !== currentChoice.id;
		} );

		setProductVariations( [
			...( otherChoicesProductVariations ?? {} ),
			{
				choiceId: currentChoice.id,
				variations,
			},
		] );

		setIsSearchingVariations( false );
	};

	const getItemStyle = ( isDragging, draggableStyle ) => {
		return {
			// display: 'flex',
			userSelect: 'none',
			// padding: '0',
			// margin: '0',

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
		};
	};

	const getListStyle = ( isDraggingOver ) => ( {
		// borderColor: isDraggingOver ? '#2271b1' : '#e2e4e7',
		// padding: '8px',
		// width: 250,
	} );

	/**
	 * Keep only the first choice if the type is a single choice field.
	 */
	useEffect( () => {
		if ( ! value ) {
			setChoices( [ defaultChoice ] );
		}

		if ( value.length > 0 ) {
			setChoices( singleChoice ? [ value[ 0 ] ] : value );
			setProductsLoaded( true );
		}
	}, [ value, singleChoice ] );

	/**
	 * Remove char_count pricing if the option type does not support it
	 */
	// useEffect( () => {
	// 	if ( [ 'text', 'text_area' ].includes( previousType ) && choices[ 0 ].price_type === 'char_count' ) {
	// 		setChoices( [ { ...choices[ 0 ], ...{ price_type: 'no_cost', pricing: false } } ] );
	// 	}
	// }, [ previousType ] );

	useEffect( () => {
		if ( ! currentChoice ) {
			return;
		}

		if ( currentChoice.product_id && currentChoice.type === 'variable' ) {
			setIsSearchingVariations( true );
		}
	}, [ currentChoice ] );

	return (
		<>
			<table className={ containerClasses }>
				<thead className="choice-headers">
					<tr>
						{ ! singleChoice && (
							<th className="option-setting-repeater-draggable-col" colSpan={ 1 }>
								{ ' ' }
								<WCTableTooltip
									tooltip={ __( 'Drag to reorder', 'woocommerce-product-options' ) }
								/>{ ' ' }
							</th>
						) }
						<th colSpan={ 1 }>{ __( 'Product', 'woocommerce-product-options' ) }</th>
						<th colSpan={ 1 }>{ __( 'Variation', 'woocommerce-product-options' ) }</th>
						<th className={ 'option-setting-repeater-remove-col' } colSpan={ 1 }></th>
					</tr>
				</thead>
				<DragDropContext onDragEnd={ onDragEnd } onDragStart={ onDragStart }>
					<Droppable droppableId="droppable">
						{ ( droppableProvided, droppableSnapshot ) => (
							<tbody
								{ ...droppableProvided.droppableProps }
								ref={ droppableProvided.innerRef }
								style={ getListStyle( droppableSnapshot.isDraggingOver ) }
							>
								{ choices.map( ( choice, index ) => {
									const availableVariations =
										productVariations
											?.find( ( pv ) => pv.choiceId === choice.id )
											?.variations?.filter( ( variation ) => {
												return (
													! choice?.attributes ||
													variation?.attributes?.length === choice?.attributes?.length
												);
											} ) || [];

									return (
										<Draggable
											key={ choice.id }
											draggableId={ `${ choice.id }` }
											index={ index }
											axis="y"
										>
											{ ( draggableProvided, draggableSnapshot ) => (
												<tr
													ref={ draggableProvided.innerRef }
													{ ...draggableProvided.draggableProps }
													className="wpo-choice"
													style={ getItemStyle(
														draggableSnapshot.isDragging,
														draggableProvided.draggableProps.style,
														draggableProvided.draggableProps[ 'data-rfd-draggable-id' ]
													) }
													data-has-variations={ choice.variations?.length > 0 }
													onClick={ () => setCurrentChoice( choice ) }
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
														{ ! choice?.product_id && (
															<input
																required
																type="text"
																value={ searchTerm.value }
																placeholder={ __(
																	'Search for products',
																	'woocommerce-product-options'
																) }
																onChange={ ( event ) => {
																	setSearchTerm( {
																		value: event.target.value,
																		choiceId: choice.id,
																	} );
																} }
															/>
														) }

														{ choice?.product_id && (
															<input
																readOnly
																type="text"
																value={
																	choice?.product_name ?? defaultChoice.product_name
																}
															/>
														) }

														{ currentChoice.id === choice.id && isSearchingProduct && (
															<div className="wpo-products-loader">{ spinner }</div>
														) }

														{ currentChoice.id === choice.id &&
															! isSearchingProduct &&
															wcSearchedProducts?.length === 0 && (
																<div className="barn2-search-list__list is-not-found wpo-products-not-found">
																	<div className="components-notice is-info">
																		<div className="components-notice__content">
																			{ __(
																				'No products found',
																				'woocommerce-product-options'
																			) }
																		</div>
																	</div>
																</div>
															) }

														{ currentChoice.id === choice.id &&
															! isSearchingProduct &&
															wcSearchedProducts?.length > 0 && (
																<ul className="barn2-search-list__list wpo-products-option-search">
																	{ wcSearchedProducts.map( ( product, index ) => {
																		return (
																			<li key={ index }>
																				<label
																					onClick={ () => {
																						choice = {
																							...choice,
																							label: product.name,
																							product_id: product.id,
																							product_name: product.name,
																							type: product.type,
																							attributes:
																								product.type ===
																								'variable'
																									? product.attributes
																									: [],
																							variations:
																								product.type ===
																								'variable'
																									? []
																									: false,
																						};
																						setCurrentChoice( choice );
																						handleProductChange(
																							product,
																							choice
																						);
																					} }
																					className="barn2-search-list__item"
																				>
																					<span className="barn2-search-list__item-label">
																						<span className="barn2-search-list__item-name">
																							{ product.name }
																						</span>
																					</span>
																				</label>
																			</li>
																		);
																	} ) }
																</ul>
															) }
													</td>

													<td colSpan={ 1 } className="variations-wrap">
														{ choice.type === 'simple' && (
															<div className="wpo-product-simple-na">N/A</div>
														) }

														{ choice.type === 'variable' &&
															currentChoice?.id !== choice.id &&
															! choice.variations?.length > 0 && (
																<div className="wpo-product-simple-na">
																	{ __(
																		'Please select one or more variations.',
																		'woocommerce-product-options'
																	) }
																</div>
															) }

														{ currentChoice?.id === choice.id && isSearchingVariations && (
															<div className="wpo-products-loader">{ spinner }</div>
														) }

														{ currentChoice?.id === choice.id &&
															availableVariations?.length > 0 &&
															! isSearchingVariations && (
																<>
																	<ul className="barn2-search-list__list wpo-products-option-search">
																		{ availableVariations
																			?.filter(
																				( variationItem ) =>
																					! choice.variations
																						?.map( ( v ) => v.id )
																						.includes( variationItem.id )
																			)
																			.map( ( variation ) => {
																				const variationOptions =
																					variation?.attributes
																						.map?.( ( obj ) => obj.option )
																						.join?.( ', ' ) ?? '';

																				return (
																					<li key={ variation.id }>
																						<label
																							className="barn2-search-list__item"
																							onClick={ () =>
																								handleVariationAdd(
																									variation,
																									choice
																								)
																							}
																						>
																							<span className="barn2-search-list__item-label">
																								<span className="barn2-search-list__item-name">
																									{ variationOptions }
																								</span>
																							</span>
																						</label>
																					</li>
																				);
																			} ) }
																	</ul>
																</>
															) }

														{ currentChoice?.id === choice.id &&
															choice.product_id !== '' &&
															choice.attributes?.length > 0 &&
															! isSearchingVariations &&
															availableVariations?.length === 0 && (
																<div className="wpo-product-simple-na">
																	{ __(
																		'No usable variations found',
																		'woocommerce-product-options'
																	) }
																	{
																		<WCTableTooltip
																			tooltip={ __(
																				'You can only use variations that are defined for all the attributes used in a variable product.',
																				'woocommerce-product-options'
																			) }
																		/>
																	}
																</div>
															) }

														{ choice.variations?.length > 0 && (
															<>
																<div
																	className="barn2-search-list__selected wpo-selected-variations"
																	style={ {
																		minHeight: 'unset',
																		height: 'fit-content',
																	} }
																>
																	<ul>
																		{ choice.variations?.map( ( variation, id ) => {
																			const variationOptions =
																				variation.attributes
																					.map( ( obj ) => obj.option )
																					.join( ', ' );

																			return (
																				<li key={ id }>
																					<span className="barn2-tag has-remove">
																						<span
																							className="barn2-tag__text"
																							id="barn2-tag__label-16"
																						>
																							<span className="screen-reader-text">
																								{ variation.name ||
																									variationOptions }
																							</span>
																							<span aria-hidden="true">
																								{ variation.name ||
																									variationOptions }
																							</span>
																						</span>
																						<button
																							type="button"
																							aria-describedby="barn2-tag__label-16"
																							className="components-button barn2-tag__remove"
																							aria-label={
																								variation.name
																							}
																							onClick={ () =>
																								handleClearVariation(
																									variation,
																									choice
																								)
																							}
																						>
																							{ crossX }
																						</button>
																					</span>
																				</li>
																			);
																		} ) }
																	</ul>
																</div>
															</>
														) }
													</td>

													<td colSpan={ 1 } className="trash-wrap">
														<Button
															className="wpo-option-setting-repeater-remove"
															title={ __(
																'Remove this choice',
																'woocommerce-product-options'
															) }
															disabled={ false }
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

export default ProductsRepeater;
