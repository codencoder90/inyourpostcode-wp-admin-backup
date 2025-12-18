/**
 * WordPress dependencies.
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';

/**
 * External dependencies.
 */
import { Button } from '@barn2plugins/components';
import { useParams } from 'react-router-dom';
import { nanoid } from 'nanoid';

/**
 * Internal dependencies.
 */
import { optionTypes, defaultOperators } from '../../config';
import { useGroupOptions } from '../../hooks/options';

const ConditionalLogicRepeater = ( { formMethods, optionId, value, onChange = () => {} } ) => {
	const defaultCondition = {
		id: nanoid(),
		optionID: false,
		optionType: false,
		operator: false,
		value: false,
	};

	const externalConditions = Object.entries( window.wpoExternalConditions ?? {} ).map( ( [ key, value ] ) => {
		return {
			key,
			...value,
		};
	} );

	const [ visibility, setVisibility ] = useState( 'show' );
	const [ relation, setRelation ] = useState( 'and' );
	const [ conditions, setConditions ] = useState( [ defaultCondition ] );
	const [ openedCondition, setOpenedCondition ] = useState( false );

	const watchOptionsField = formMethods.watch( 'options' );

	const { dirtyFields } = formMethods.formState;
	const { groupID } = useParams();
	const groupOptions = useGroupOptions( parseInt( groupID ) );

	const handleVisibilityChange = ( event ) => {
		const newVisibility = event.target.value;

		triggerOptionChange( { visibility: newVisibility } );
		setVisibility( newVisibility );
	};

	const handleRelationChange = ( event ) => {
		const newRelation = event.target.value;

		triggerOptionChange( { relation: newRelation } );
		setRelation( newRelation );
	};

	const addCondition = () => {
		const newConditions = [ ...conditions, { ...defaultCondition, id: nanoid() } ];

		triggerOptionChange( { conditions: newConditions } );

		setConditions( newConditions );
		setOpenedCondition( newConditions[ newConditions.length - 1 ].id );
	};

	const removeCondition = ( conditionId ) => {
		const newConditions = conditions.filter( ( condition ) => condition.id !== conditionId );

		if ( newConditions.length === 0 ) {
			newConditions.push( { ...defaultCondition, id: nanoid() } );
		}

		triggerOptionChange( { conditions: newConditions } );

		setConditions( newConditions );
		setOpenedCondition( false );
	};

	const handleConditionChange = ( conditionID, key, newValue ) => {
		const newConditions = conditions.map( ( condition ) =>
			condition.id === conditionID ? { ...condition, [ key ]: newValue } : condition
		);

		setConditions( newConditions );
		setOpenedCondition( conditionID );

		triggerOptionChange( { conditions: newConditions } );
	};

	const triggerOptionChange = ( changedValues ) => {
		const currentValue = {
			visibility,
			relation,
			conditions,
		};

		onChange( {
			...currentValue,
			...changedValues,
		} );
	};

	const handleConditionOptionChange = ( conditionID, newValue ) => {
		const newConditions = conditions.map( ( condition ) => {
			if ( condition.id !== conditionID ) {
				return condition;
			}

			let optionType = watchOptionsField.find( ( option ) => option.id === parseInt( newValue ) )?.type;

			if ( ! optionType ) {
				optionType = externalConditions
					.find( ( conditionSet ) => conditionSet?.options?.find( ( c ) => c.id === newValue ) )
					?.options?.find( ( c ) => c.id === newValue )?.id;
			}

			return { ...condition, ...{ optionID: newValue, optionType, operator: false, value: null } };
		} );

		setConditions( newConditions );
		setOpenedCondition( conditionID );

		onChange( {
			visibility,
			relation,
			conditions: newConditions,
		} );
	};

	const getConditionalOptions = ( optionId ) => {
		const availableOptions = watchOptionsField.filter(
			( option ) =>
				option.id !== optionId &&
				option.id !== 0 &&
				! [ 'html', 'wysiwyg', 'price_formula' ].includes( option.type ) &&
				( option.type !== 'product' ||
					( option?.settings?.product_display_style &&
						option?.settings.product_display_style !== 'product' ) )
		);

		return (
			<>
				<option value="false">{ __( 'Select a condition', 'woocommerce-product-options' ) }</option>

				{ availableOptions.length > 0 && (
					<optgroup key="optgroup-options" label={ __( 'Options', 'woocommerce-product-options' ) }>
						{ availableOptions.map( ( option ) => (
							<option key={ nanoid() } value={ option.id }>
								{ option.name }
							</option>
						) ) }
					</optgroup>
				) }

				{ externalConditions.length > 0 &&
					externalConditions.map( ( conditionGroup ) => {
						return (
							conditionGroup?.options?.length > 0 && (
								<optgroup key={ `optgroup-${conditionGroup.label}` } label={ conditionGroup.label }>
									{ conditionGroup.options.map( ( attribute ) => (
										<option key={ nanoid() } value={ attribute.id } data-operators={ conditionGroup.operators }>
											{ attribute.name }
										</option>
									) ) }
								</optgroup>
							)
						);
					} ) }
			</>
		);
	};

	useEffect( () => {
		if ( value?.conditions ) {
			setConditions( value.conditions.length === 0 ? [ defaultCondition ] : value.conditions );
		}

		if ( value?.relation ) {
			setRelation( value.relation );
		}

		if ( value?.visibility ) {
			setVisibility( value.visibility );
		}
	}, [ value ] );

	return (
		<div className="wpo-clogic-repeater">
			{ groupOptions.isFetched &&
				dirtyFields?.options &&
				dirtyFields.options.length > groupOptions.data.length && (
					<p className="wpo-clogic-unsaved-options-warning">
						{ __(
							'You need to save the product options before using them for conditional logic. Click the "Save changes" button below and then continue.'
						) }
					</p>
				) }
			<div className="wpo-clogic-repeater-visibily-relation">
				<select value={ visibility } onChange={ ( event ) => handleVisibilityChange( event ) }>
					<option value="show">{ __( 'Show', 'woocommerce-product-options' ) }</option>
					<option value="hide">{ __( 'Hide', 'woocommerce-product-options' ) }</option>
				</select>

				<span className="wpo-clogic-repeater-instructions">
					{ __( ' this option if ', 'woocommerce-product-options' ) }
				</span>

				<select value={ relation } onChange={ ( event ) => handleRelationChange( event ) }>
					<option value="and">{ __( 'All', 'woocommerce-product-options' ) }</option>
					<option value="or">{ __( 'Any', 'woocommerce-product-options' ) }</option>
				</select>

				<span className="wpo-clogic-repeater-instructions">
					{ __( 'of the following match:', 'woocommerce-product-options' ) }
				</span>
			</div>

			<table className="option-setting-repeater">
				<thead>
					<tr>
						<th colSpan={ 1 }>{ __( 'Condition', 'woocommerce-product-options' ) }</th>
						<th colSpan={ 1 }>{ __( 'Comparison', 'woocommerce-product-options' ) }</th>
						<th colSpan={ 1 }>{ __( 'Value', 'woocommerce-product-options' ) }</th>
						<th className={ 'option-setting-repeater-remove-col' } colSpan={ 1 }></th>
					</tr>
				</thead>
				<tbody>
					{ conditions.map( ( condition, index ) => {
						let selectedOption = watchOptionsField.find(
							( option ) => option.id === Number( condition.optionID )
						);

						if ( ! selectedOption ) {
							selectedOption = externalConditions
								.find( ( conditionSet ) =>
									conditionSet?.options?.find( ( attribute ) => attribute.id === condition.optionID )
								)
								?.options?.find( ( attribute ) => attribute.id === condition.optionID );
						}

						let selectedOptionChoices = [];
						switch ( selectedOption?.type ) {
							case 'product':
								selectedOptionChoices = selectedOption?.settings?.manual_products?.reduce(
									( acc, product ) => {
										if ( product?.variations?.length > 0 ) {
											return [
												...acc,
												...product.variations.map( ( variation ) => ( {
													id: variation.id,
													label: `${ product.product_name } (${ variation?.attributes
														?.map?.(
															( attribute ) =>
																`${ attribute.name.toLocaleLowerCase() }: ${
																	attribute.option
																}`
														)
														?.join( ', ' ) || '' })`,
												} ) ),
											];
										}

										return [ ...acc, { id: product.product_id, label: product.product_name } ];
									},
									[]
								);
								break;

							default:
								selectedOptionChoices = selectedOption?.choices;
						}

						let optionConfig =
							selectedOption && optionTypes.find( ( option ) => option.key === selectedOption.type );

						if ( ! optionConfig ) {
							optionConfig = {};
							const operatorType = selectedOption?.choices?.length > 0 ? 'checkbox' : 'number';
							optionConfig.operators = selectedOption && optionTypes.find( ( option ) => option.key === operatorType )?.operators;
						}

						if ( ! optionConfig.operators ) {
							optionConfig = {};
							optionConfig.operators = defaultOperators;
						}

						const operatorConfig =
							optionConfig &&
							optionConfig.operators.find( ( operator ) => operator.key === condition.operator );

						return (
							<tr
								key={ condition.id }
								className={
									'wpo-clogic-repeater-condition-row' +
									( openedCondition === condition.id ? ' is-open' : '' )
								}
								aria-expanded={ openedCondition === condition.id }
							>
								<td colSpan={ 1 } className="wpo-clogic-option-wrap">
									<label
										htmlFor={ `wpo-clogic-option-${ condition.id }-condition` }
										className="compact-label"
									>
										{ __( 'Condition', 'woocommerce-product-options' ) }
									</label>
									<select
										id={ `wpo-clogic-option-${ condition.id }-condition` }
										value={ condition?.optionID ?? defaultCondition.optionID }
										onChange={ ( event ) => {
											handleConditionOptionChange( condition.id, event.target.value );
										} }
									>
										{ getConditionalOptions( optionId ) }
									</select>
									<Dashicon
										icon={ openedCondition === condition.id ? 'arrow-up-alt2' : 'arrow-down-alt2' }
										className="wpo-clogic-condition-toggle"
										onClick={ () =>
											setOpenedCondition(
												openedCondition === condition.id ? false : condition.id
											)
										}
									/>
								</td>

								<td colSpan={ 1 } className="wpo-clogic-operator-wrap">
									<label
										htmlFor={ `wpo-clogic-option-${ condition.id }-comparison` }
										className="compact-label"
									>
										{ __( 'Comparison', 'woocommerce-product-options' ) }
									</label>
									<select
										id={ `wpo-clogic-option-${ condition.id }-comparison` }
										disabled={ condition?.optionID === 'false' }
										value={ condition?.operator ?? defaultCondition.operator }
										onChange={ ( event ) =>
											handleConditionChange( condition.id, 'operator', event.target.value )
										}
									>
										<option value="false">
											{ __( 'Select a comparison', 'woocommerce-product-options' ) }
										</option>
										{ optionConfig
											? optionConfig?.operators.map( ( operator ) => (
													<option key={ nanoid() } value={ operator.key }>
														{ operator.label }
													</option>
											  ) )
											: null }
									</select>
								</td>

								<td
									colSpan={ 1 }
									className={
										'wpo-clogic-value-wrap' + ( operatorConfig?.comparison ? '' : ' is-empty' )
									}
								>
									{ operatorConfig?.comparison ? (
										<>
											<label
												htmlFor={ `wpo-clogic-option-${ condition.id }-value` }
												className="compact-label"
											>
												{ __( 'Value', 'woocommerce-product-options' ) }
											</label>

											{ operatorConfig?.comparison === 'choices' ? (
												<select
													id={ `wpo-clogic-option-${ condition.id }-value` }
													required
													value={ condition?.value ?? defaultCondition.value }
													onChange={ ( event ) =>
														handleConditionChange(
															condition.id,
															'value',
															event.target.value
														)
													}
												>
													<option value="false">
														{ __( 'Select a choice', 'woocommerce-product-options' ) }
													</option>
													<option value="any">
														{ __( 'Any choice', 'woocommerce-product-options' ) }
													</option>
													{ selectedOptionChoices?.map( ( choice ) => (
														<option key={ nanoid() } value={ choice.id }>
															{ choice.label }
														</option>
													) ) }
												</select>
											) : null }

											{ operatorConfig?.comparison === 'text' ? (
												<input
													required
													type="text"
													value={ condition?.value ?? '' }
													onChange={ ( event ) =>
														handleConditionChange(
															condition.id,
															'value',
															event.target.value
														)
													}
												/>
											) : null }

											{ operatorConfig?.comparison === 'date' ? (
												<input
													required
													pattern="\d{4}-\d{2}-\d{2}"
													type="text"
													placeholder="YYYY-MM-DD"
													value={ condition?.value ?? '' }
													onChange={ ( event ) =>
														handleConditionChange(
															condition.id,
															'value',
															event.target.value
														)
													}
												/>
											) : null }

											{ operatorConfig?.comparison === 'number' ? (
												<input
													required
													type="number"
													value={ condition?.value ?? '' }
													onChange={ ( event ) =>
														handleConditionChange(
															condition.id,
															'value',
															event.target.value
														)
													}
												/>
											) : null }
										</>
									) : null }
								</td>

								<td colSpan={ 1 } className="wpo-clogic-trash-wrap">
									<Button
										className="wpo-option-setting-repeater-remove"
										onClick={ () => removeCondition( condition.id ) }
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
						);
					} ) }
				</tbody>
			</table>

			<Button className="wpo-option-setting-repeater-add" onClick={ addCondition }>
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
		</div>
	);
};

export default ConditionalLogicRepeater;
