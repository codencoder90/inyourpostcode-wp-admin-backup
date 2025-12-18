/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';

/**
 * External dependencies
 */
import { RadioControl, CheckboxControl, SelectControl, Notice } from '@barn2plugins/components';
import { Controller } from 'react-hook-form';

/**
 * Internal dependencies
 */
import { optionTypes } from '../config';
import OptionFormRow from '../components/tables/option-form-row';
import AdvancedSettingsRow from '../components/tables/advanced-settings-row';
import OptionTypeSelector from '../components/fields/option-type-selector';
import OptionChoicesRepeater from '../components/fields/option-choices-repeater';
import ProductsRepeater from '../components/fields/products-repeater';
import DynamicProducts from '../components/fields/dynamic-products';
import ConditionalLogicRepeater from '../components/fields/conditional-logic-repeater';
import RichText from '../components/fields/rich-text';
import FileTypeSelect from '../components/fields/file-type-select';
import PriceFormula from '../components/fields/price-formula';
import DaySelect from '../components/fields/day-select';
import DateFormat from '../components/fields/date-format';
import { removeUnnecessarySettings, hasAdvancedSettings } from '../util';
import { adjustPriceFormulas } from '../../../common/util/common-formula-util';
import AttributeChoicesRepeater from '../components/fields/attribute-choices-repeater';
import AttributeSelect from '../components/fields/attribute-select';

const OptionForm = ( { formMethods, index, option } ) => {
	const settings = window?.wpoSettings;
	const id = formMethods.watch( `options.${ index }.id` );
	const name = formMethods.watch( `options.${ index }.name` );
	const optionType = formMethods.watch( `options.${ index }.type` );
	const choiceType = formMethods.watch( `options.${ index }.settings.choice_type` );
	const prevChoiceTypeRef = useRef( choiceType );
	const selectedAttribute = formMethods.watch( `options.${ index }.settings.selected_attribute` );
	const choices = formMethods.watch( `options.${ index }.choices` );
	const displayLabel = formMethods.watch( `options.${ index }.settings.display_label` );
	const singleChoice = [ 'text', 'textarea', 'number', 'file_upload', 'customer_price', 'datepicker' ].includes(
		optionType
	);
	const isLivePreviewEnabled = formMethods.watch( `options.${ index }.settings.live_preview` );
	const productDisplayStyle = formMethods.watch( `options.${ index }.settings.product_display_style` );
	const quantityLimited =
		[ 'checkbox', 'images', 'text_labels' ].includes( optionType ) ||
		( optionType === 'product' && [ 'checkbox', 'image_buttons' ].includes( productDisplayStyle ) );
	const minQtyLimit = formMethods.watch( `options.${ index }.settings.choice_qty.min` );
	const maxQtyLimit = formMethods.watch( `options.${ index }.settings.choice_qty.max` );
	const numberType = formMethods.watch( `options.${ index }.settings.number_type` );
	const productSelection = formMethods.watch( `options.${ index }.settings.product_selection` );
	const dynamicProductsLimit = formMethods.watch( `options.${ index }.settings.dynamic_products.limit` );
	const displayProductsAsImageButtons = optionType === 'product' && productDisplayStyle === 'image_buttons';
	const [ columns, setColumns ] = useState( {} );

	const [ advancedSettings, setAdvancedSettings ] = useState( hasAdvancedSettings( option, optionType ) );

	const getChoicesLabel = () => {
		if ( optionType === 'customer_price' ) {
			return __( 'Label', 'woocommerce-product-options' );
		}

		if ( singleChoice ) {
			return __( 'Choice', 'woocommerce-product-options' );
		}

		return __( 'Choices', 'woocommerce-product-options' );
	};

	const supportsImages = () => {
		return (
			[ 'images' ].includes( optionType ) ||
			displayProductsAsImageButtons ||
			columns?.image ||
			( [ 'checkbox', 'radio', 'dropdown', 'color_swatches', 'text_labels' ].includes( optionType ) &&
				choices?.some( ( choice ) => choice.media ) )
		);
	};

	const supportsVariationAttributes = () => {
		return [ 'checkbox', 'dropdown', 'radio', 'text_labels', 'color_swatches', 'images' ].includes( optionType );
	};

	const getProductsLength = () => {
		if ( productSelection === 'dynamic' ) {
			return dynamicProductsLimit;
		}

		const products = [];

		const manualProducts = option.settings.manual_products;

		manualProducts?.forEach( ( product ) => {
			if ( product.type === 'simple' ) {
				products.push( product.product_id );
			} else if ( product?.variations?.length ) {
				products.push( ...product.variations.map( ( variation ) => variation.id ) );
			}
		} );

		return products?.length;
	};

	const getChoicesLength = () => {
		if ( optionType === 'product' ) {
			return getProductsLength();
		}

		return choices?.length;
	};

	useEffect( () => {
		adjustPriceFormulas( option );
	}, [ name, choices ] );

	// set default values for nested settings
	useEffect( () => {
		if ( optionType !== 'datepicker' ) {
			return;
		}

		if ( ! option?.settings?.datepicker?.date_format ) {
			formMethods.setValue( `options.${ index }.settings.datepicker.date_format`, 'F j, Y' );
		}

		if ( ! option?.settings?.datepicker?.min_time ) {
			formMethods.setValue( `options.${ index }.settings.datepicker.min_time`, '00:00' );
		}

		if ( ! option?.settings?.datepicker?.max_time ) {
			formMethods.setValue( `options.${ index }.settings.datepicker.max_time`, '23:59' );
		}

		if ( ! option?.settings?.datepicker?.minute_increment ) {
			formMethods.setValue( `options.${ index }.settings.datepicker.minute_increment`, 15 );
		}

		if ( ! option?.settings?.datepicker?.hour_increment ) {
			formMethods.setValue( `options.${ index }.settings.datepicker.hour_increment`, 1 );
		}
	}, [ optionType ] );

	useEffect( () => {
		if ( optionType !== 'product' ) {
			if ( option?.settings?.product_display_style ) {
				formMethods.setValue( `options.${ index }.settings.product_display_style`, '' );
			}
			return;
		}

		if ( ! option?.settings?.product_display_style ) {
			formMethods.setValue( `options.${ index }.settings.product_display_style`, 'image_buttons' );
		}
		if ( ! option?.settings?.product_selection ) {
			formMethods.setValue( `options.${ index }.settings.product_selection`, 'manual' );
		}
	}, [ optionType ] );

	// disable product image button attributes if option type is not products
	// useEffect( () => {
	// 	setProductImageButtonAttributes( optionType === 'product' && option.settings.product_display_style === 'image_buttons' );
	// }, [ optionType ] );

	useEffect( () => {
		if ( optionType !== 'images' && ( optionType !== 'product' || productDisplayStyle !== 'image_buttons' ) ) {
			return;
		}

		if ( ! option?.settings?.button_width ) {
			formMethods.setValue( `options.${ index }.settings.button_width`, 118 );
		}
	}, [ optionType, productDisplayStyle ] );

	useEffect( () => {
		if ( supportsImages() && option?.settings?.display_choice_image === undefined ) {
			formMethods.setValue( `options.${ index }.settings.display_choice_image`, true );
			formMethods.setValue( `options.${ index }.settings.show_in_product_gallery`, true );
		}
	}, [ optionType, columns ] );

	useEffect( () => {
		if ( optionType !== 'file_upload' ) {
			return;
		}

		if ( option?.settings?.live_preview == undefined ) {
			formMethods.setValue( `options.${ index }.settings.live_preview`, true );
		}
	}, [ optionType ] );

	/**
	 * Handle choice type default
	 */
	useEffect( () => {
		if ( ! supportsVariationAttributes() ) {
			return;
		}

		// set choice type if not set
		if ( ! option?.settings?.choice_type ) {
			formMethods.setValue( `options.${ index }.settings.choice_type`, 'custom' );
		}
	}, [ optionType ] );

	/**
	 * Set choice type back to default if option type changes from non attribute supported option
	 */
	useEffect( () => {
		if ( supportsVariationAttributes() ) {
			return;
		}

		formMethods.setValue( `options.${ index }.settings.choice_type`, 'custom' );
	}, [ optionType ] );

	/**
	 * Force required and maxQty if we have an attribute option
	 */
	useEffect( () => {
		if ( supportsVariationAttributes() && choiceType === 'variation_attributes' ) {
			formMethods.setValue( `options.${ index }.required`, true );
			formMethods.setValue( `options.${ index }.settings.choice_qty.max`, 1 );
			formMethods.setValue( `options.${ index }.settings.choice_qty.min`, null );
		}
	}, [ optionType, choiceType ] );

	/**
	 * Clear selected attribute and choices if choice type is changed to custom.
	 */
	useEffect( () => {
		if ( prevChoiceTypeRef.current === 'variation_attributes' && choiceType === 'custom' ) {
			formMethods.setValue( `options.${ index }.settings.selected_attribute`, null );
			formMethods.setValue( `options.${ index }.choices`, null );
			formMethods.setValue( `options.${ index }.required`, false );
			formMethods.setValue( `options.${ index }.settings.choice_qty`, null );
		}

		prevChoiceTypeRef.current = choiceType;
	}, [ choiceType ] );

	return (
		<>
			<table className="option-form-table widefat fixed">
				<tbody>
					<OptionFormRow
						name={ `options.${ index }.name` }
						className={ 'option-name-row' }
						label={ __( 'Option name', 'woocommerce-product-options' ) }
					>
						<input
							// eslint-disable-next-line jsx-a11y/no-autofocus
							autoFocus
							required
							id="name"
							type="text"
							className="regular-input"
							{ ...formMethods.register( `options.${ index }.name`, {
								required: true,
							} ) }
						/>

						{ ! [ 'html', 'wysiwyg' ].includes( optionType ) && (
							<Controller
								control={ formMethods.control }
								name={ `options.${ index }.display_name` }
								render={ ( { field } ) => (
									<CheckboxControl
										label={ __( 'Display', 'woocommerce-product-options' ) }
										checked={ [ '1', 1, true ].includes( field?.value ) }
										onChange={ ( value ) => field.onChange( value ) }
										isClassicStyle={ true }
									/>
								) }
							/>
						) }
					</OptionFormRow>
					<OptionFormRow
						name={ `options.${ index }.type` }
						label={ <>{ __( 'Type', 'woocommerce-product-options' ) } </> }
					>
						<Controller
							control={ formMethods.control }
							name={ `options.${ index }.type` }
							rules={ { required: true } }
							render={ ( { field } ) => (
								<OptionTypeSelector
									onChange={ ( value ) => {
										removeUnnecessarySettings( option, value );
										setAdvancedSettings( hasAdvancedSettings( option, value ) );
										field.onChange( value );
									} }
									selected={ field?.value ?? null }
								/>
							) }
						/>
					</OptionFormRow>
					{ supportsVariationAttributes() && (
						<OptionFormRow
							name={ `options.${ index }.settings.choice_type` }
							label={ __( 'Choice type', 'woocommerce-product-options' ) }
							tooltip={ __(
								'Either create custom choices directly in the WooCommerce Product Options plugin, or select existing global attributes (created via Products > Attributes) to display using WooCommerce Product Options.',
								'woocommerce-product-options'
							) }
						>
							<Controller
								control={ formMethods.control }
								name={ `options.${ index }.settings.choice_type` }
								render={ ( { field } ) => (
									<RadioControl
										selected={ field?.value ? field.value : 'custom' }
										options={ [
											{
												label: __( 'Create custom choices', 'woocommerce-product-options' ),
												value: 'custom',
											},
											{
												label: __(
													'Create choices using existing variation attributes',
													'woocommerce-product-options'
												),
												value: 'variation_attributes',
											},
										] }
										onChange={ ( value ) => field.onChange( value ) }
										default={ 'custom' }
									/>
								) }
							/>
						</OptionFormRow>
					) }

					{ supportsVariationAttributes() && choiceType === 'variation_attributes' && (
						<OptionFormRow
							name={ `options.${ index }.settings.selected_attribute` }
							label={ __( 'Variation attribute', 'woocommerce-product-options' ) }
							className="wpo-option-choices"
						>
							<Controller
								control={ formMethods.control }
								name={ `options.${ index }.settings.selected_attribute` }
								rules={ {
									required: __(
										'Please select a variation attribute.',
										'woocommerce-product-options'
									),
								} }
								render={ ( { field } ) => (
									<AttributeSelect
										option={ option }
										onChange={ ( value ) => field.onChange( value ) }
										value={ field?.value ?? [] }
									/>
								) }
							/>
						</OptionFormRow>
					) }

					{ supportsVariationAttributes() && choiceType === 'variation_attributes' && (
						<OptionFormRow
							name={ `options.${ index }.choices` }
							label={ getChoicesLabel() }
							className="wpo-option-choices"
						>
							<Controller
								control={ formMethods.control }
								name={ `options.${ index }.choices` }
								rules={ { required: true } }
								render={ ( { field } ) => (
									<AttributeChoicesRepeater
										option={ option }
										productAttribute={ selectedAttribute }
										onChange={ ( value ) => field.onChange( value ) }
										onColumnUpdate={ ( value ) => {
											setColumns( value );
										} }
										value={ field?.value ?? [] }
									/>
								) }
							/>
						</OptionFormRow>
					) }

					{ ! [ 'html', 'wysiwyg', 'price_formula', 'product' ].includes( optionType ) &&
						choiceType === 'custom' && (
							<OptionFormRow
								name={ `options.${ index }.choices` }
								label={ getChoicesLabel() }
								tooltip={
									optionType === 'customer_price'
										? __(
												'The label that appears alongside the option.',
												'woocommerce-product-options'
										  )
										: ''
								}
								className="wpo-option-choices"
							>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.choices` }
									rules={ { required: true } }
									render={ ( { field } ) => (
										<OptionChoicesRepeater
											option={ option }
											singleChoice={ singleChoice }
											maxQty={ maxQtyLimit }
											onChange={ ( value ) => field.onChange( value ) }
											onColumnUpdate={ ( value ) => {
												setColumns( value );
											} }
											value={ field?.value ?? [] }
										/>
									) }
								/>
							</OptionFormRow>
						) }
					{ supportsImages() && (
						<OptionFormRow
							name="settings.show_in_product_gallery"
							label={ __( 'Images', 'woocommerce-product-options' ) }
							tooltip={ __(
								'Update the main product image when the customer clicks on an image button; and also include choice images in the product gallery.',
								'woocommerce-product-options'
							) }
						>
							<Controller
								control={ formMethods.control }
								name={ `options.${ index }.settings.show_in_product_gallery` }
								render={ ( { field } ) => {
									return (
										<CheckboxControl
											isClassicStyle
											label={ __(
												'Update main product image when a choice is selected',
												'woocommerce-product-options'
											) }
											checked={ !! field?.value }
											onChange={ ( value ) => field.onChange( value ) }
										/>
									);
								} }
							/>
							{ [ 'checkbox', 'radio', 'dropdown', 'color_swatches', 'text_labels' ].includes( optionType ) && (
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.settings.display_choice_image` }
									render={ ( { field } ) => {
										return (
											<CheckboxControl
												isClassicStyle
												label={ sprintf(
													/* translators: %s: Option type (any multi-choice options) */
													__(
														'Display image next to each %s',
														'woocommerce-product-options'
													),
													Object.entries( {
														checkbox: __( 'checkbox' ),
														radio: __( 'radio button' ),
														dropdown: __( 'option' ),
														color_swatches: __( 'color swatch' ),
														text_labels: __( 'text label' ),
													} ).find( ( [ key ] ) => key === optionType )[ 1 ]
												) }
												checked={ !! field?.value }
												onChange={ ( value ) => field.onChange( value ) }
											/>
										);
									} }
								/>
							) }
						</OptionFormRow>
					) }
					{ optionType === 'html' && (
						<OptionFormRow
							name={ `options.${ index }.settings.html` }
							label={ __( 'Static content', 'woocommerce-product-options' ) }
						>
							<textarea
								className="html-textarea"
								rows="10"
								{ ...formMethods.register( `options.${ index }.settings.html` ) }
							/>
						</OptionFormRow>
					) }
					{ optionType === 'wysiwyg' && (
						<OptionFormRow
							name={ `options.${ index }.settings.html` }
							label={ __( 'Static content', 'woocommerce-product-options' ) }
							style={ { zIndex: 2 } } // Ensure the RichText editor is above the rest of the table rows
						>
							<Controller
								control={ formMethods.control }
								name={ `options.${ index }.settings.html` }
								render={ ( { field } ) => (
									<RichText
										onChange={ ( value ) => field.onChange( value ) }
										value={ field?.value ?? '' }
									/>
								) }
							/>
						</OptionFormRow>
					) }
					{ optionType === 'datepicker' && (
						<>
							<OptionFormRow
								name="settings[datepicker][enable_time]"
								label={ __( 'Selection options', 'woocommerce-product-options' ) }
							>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.settings.datepicker.disable_past_dates` }
									render={ ( { field } ) => (
										<CheckboxControl
											label={ __( 'Disable past dates', 'woocommerce-product-options' ) }
											checked={ [ '1', 1, true ].includes( field?.value ) }
											onChange={ ( changeValue ) => field.onChange( changeValue ) }
											isClassicStyle
										/>
									) }
								/>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.settings.datepicker.disable_future_dates` }
									render={ ( { field } ) => (
										<CheckboxControl
											label={ __( 'Disable future dates', 'woocommerce-product-options' ) }
											checked={ [ '1', 1, true ].includes( field?.value ) }
											onChange={ ( changeValue ) => field.onChange( changeValue ) }
											isClassicStyle
										/>
									) }
								/>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.settings.datepicker.disable_today` }
									render={ ( { field } ) => (
										<CheckboxControl
											label={ __( 'Disable today', 'woocommerce-product-options' ) }
											checked={ [ '1', 1, true ].includes( field?.value ) }
											onChange={ ( changeValue ) => field.onChange( changeValue ) }
											isClassicStyle
										/>
									) }
								/>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.settings.datepicker.enable_time` }
									render={ ( { field } ) => (
										<CheckboxControl
											label={ __( 'Enable time', 'woocommerce-product-options' ) }
											checked={ [ '1', 1, true ].includes( field?.value ) }
											onChange={ ( changeValue ) => field.onChange( changeValue ) }
											isClassicStyle
										/>
									) }
								/>
							</OptionFormRow>
							<OptionFormRow
								name="settings[datepicker][disable_days]"
								label={ __( 'Disable days', 'woocommerce-product-options' ) }
								tooltip={ __(
									'Select the days of the week to disable.',
									'woocommerce-product-options'
								) }
								style={ { zIndex: 2 } } // Ensure the DaySelect dropdown is above the rest of the table rows
							>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.settings.datepicker.disable_days` }
									render={ ( { field } ) => (
										<DaySelect
											onChange={ ( changeValue ) => field.onChange( changeValue ) }
											value={ field.value }
										/>
									) }
								/>
							</OptionFormRow>
						</>
					) }
					{ optionType === 'price_formula' && (
						<>
							<OptionFormRow
								name={ `options.${ index }.settings.formula` }
								label={ __( 'Formula', 'woocommerce-product-options' ) }
								style={ { zIndex: 2 } } // Ensure the PriceFormula dropdown buttons are above the rest of the table rows
							>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.settings.formula` }
									render={ ( { field } ) => (
										<PriceFormula
											index={ index }
											onChange={ ( value ) => field.onChange( value ) }
											value={ field?.value ?? '' }
											formMethods={ formMethods }
										/>
									) }
								/>
							</OptionFormRow>

							<OptionFormRow
								name={ `options.${ index }.settings.price_suffix` }
								label={ __( 'Price display suffix', 'woocommerce-product-options' ) }
								tooltip={ __(
									'Define text to be displayed after the product price. E.g. "per meter".',
									'woocommerce-product-options'
								) }
							>
								<input
									type="text"
									className="regular-input"
									{ ...formMethods.register( `options.${ index }.settings.price_suffix` ) }
								/>
							</OptionFormRow>

							<OptionFormRow
								name={ `options.${ index }.settings.exclude_product_price` }
								label={ __( 'Ignore main product price', 'woocommerce-product-options' ) }
								tooltip={ __(
									'Enable this to prevent the main product price from being included in the total product price. E.g. if the main product price is $20 to indicate that a product is priced by the meter, enable this option to prevent $20 from being added to the calculated price.',
									'woocommerce-product-options'
								) }
							>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.settings.exclude_product_price` }
									render={ ( { field } ) => (
										<CheckboxControl
											checked={ [ '1', 1, true ].includes( field?.value ) }
											onChange={ ( changeValue ) => field.onChange( changeValue ) }
											isClassicStyle
										/>
									) }
								/>
							</OptionFormRow>
						</>
					) }
					{ optionType === 'product' && (
						<>
							<OptionFormRow
								name={ `options.${ index }.settings.product_selection` }
								label={ __( 'Product selection' ) }
								tooltip={ __(
									'You can either choose individual products to display as options, or select them dynamically based on criteria such as their category.'
								) }
							>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.settings.product_selection` }
									render={ ( { field } ) => (
										<RadioControl
											selected={ field?.value ? field.value : 'manual' }
											options={ [
												{
													label: __(
														'Select specific products',
														'woocommerce-product-options'
													),
													value: 'manual',
												},
												{
													label: __(
														'Select products dynamically',
														'woocommerce-product-options'
													),
													value: 'dynamic',
												},
											] }
											onChange={ ( value ) => field.onChange( value ) }
											default={ 'manual' }
										/>
									) }
								/>
							</OptionFormRow>

							{ [ null, 'manual' ].includes( productSelection ) && (
								<OptionFormRow
									name={ `options.${ index }.settings.manual_products` }
									label="Products"
									tooltip={ __( 'Select one or more products and/or categories to display.' ) }
									className={ 'wpo-manual-products' }
								>
									<Controller
										control={ formMethods.control }
										name={ `options.${ index }.settings.manual_products` }
										rules={ { required: true } }
										render={ ( { field } ) => (
											<ProductsRepeater
												optionType={ optionType }
												singleChoice={ singleChoice }
												maxQty={ maxQtyLimit }
												onChange={ ( value ) => field.onChange( value ) }
												value={ field?.value ?? [] }
											/>
										) }
									/>
								</OptionFormRow>
							) }

							{ productSelection === 'dynamic' && (
								<OptionFormRow
									name={ `options.${ index }.settings.dynamic_products` }
									label="Dynamic products"
									tooltip={ __(
										'Choose which categories to display products from. Only Simple products can be displayed dynamically.',
										'woocommerce-product-options'
									) }
									className={ 'wpo-dynamic-products' }
								>
									<Controller
										control={ formMethods.control }
										name={ `options.${ index }.settings.dynamic_products` }
										render={ ( { field } ) => (
											<DynamicProducts
												optionType={ optionType }
												singleChoice={ singleChoice }
												maxQty={ maxQtyLimit }
												onChange={ ( value ) => field.onChange( value ) }
												value={ field?.value ?? [] }
											/>
										) }
									/>
								</OptionFormRow>
							) }

							<OptionFormRow
								name={ `options.${ index }.settings.product_display_style` }
								label={ __( 'Display choices as', 'woocommerce-product-options' ) }
							>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.settings.product_display_style` }
									render={ ( { field } ) => (
										<SelectControl
											value={ field?.value ?? 'image_buttons' }
											options={ [
												{
													label: __( 'Image buttons', 'woocommerce-product-options' ),
													value: 'image_buttons',
												},
												{
													label: __( 'Checkboxes', 'woocommerce-product-options' ),
													value: 'checkbox',
												},
												{
													label: __( 'Radio buttons', 'woocommerce-product-options' ),
													value: 'radio',
												},
												{
													label: __( 'Dropdown select', 'woocommerce-product-options' ),
													value: 'dropdown',
												},
												{
													label: __( 'Products', 'woocommerce-product-options' ),
													value: 'product',
												},
											] }
											onChange={ ( value ) => {
												field.onChange( value );
											} }
										/>
									) }
								/>
							</OptionFormRow>
						</>
					) }
					{ [ 'file_upload', 'text', 'textarea' ].includes( optionType ) && settings?.use_live_preview && (
						<OptionFormRow
							name={ 'live_preview' }
							label={ __( 'Live Preview', 'woocommerce-product-options' ) }
							className="wpo-live-preview-row"
						>
							<Controller
								control={ formMethods.control }
								name={ `options.${ index }.settings.live_preview` }
								render={ ( { field } ) => (
									<label className="wpo-live-preview" htmlFor="settings.live_preview">
										<CheckboxControl
											checked={ [ '1', 1, true ].includes( field?.value ) }
											label={ __( 'Enable live preview', 'woocommerce-product-options' ) }
											onChange={ ( changeValue ) => field.onChange( changeValue ) }
											isClassicStyle
										/>
									</label>
								) }
							/>
							{ isLivePreviewEnabled && (
								<>
									<Controller
										control={ formMethods.control }
										name={ `options.${ index }.settings.live_preview_button_text` }
										render={ () => (
											<label
												className="wpo-live-preview-button-text"
												htmlFor="settings.live_preview_button_text"
											>
												<span className="wpo-live-preview-button-text-label">
													{ __( 'Preview button', 'woocommerce-product-options' ) }
												</span>
												<input
													id="settings.live_preview_button_text"
													type="text"
													className="regular-input"
													{ ...formMethods.register(
														`options.${ index }.settings.live_preview_button_text`
													) }
													defaultValue={ settings?.live_preview_button_text }
												/>
											</label>
										) }
									/>
									{ /*[ 'text', 'textarea' ].includes( optionType ) && (
										<Controller
											control={ formMethods.control }
											name={ `options.${ index }.settings.live_preview_allowed_fonts` }
											render={ () => (
												<label
													className="wpo-live-preview-allowed-fonts"
													htmlFor="settings.live_preview_allowed_fonts"
												>
													<span className="wpo-live-preview-button-text-label">
														{ __( 'Preview button', 'woocommerce-product-options' ) }
													</span>
													<input
														id="settings.live_preview_allowed_fonts"
														type="text"
														className="regular-input"
														{ ...formMethods.register(
															`options.${ index }.settings.live_preview_allowed_fonts`
														) }
														defaultValue={ settings?.live_preview_allowed_fonts }
													/>
												</label>
											) }
										/>
									) */ null}
									<Notice isDismissible={ false } status="info">
										{ __(
											// translators: %s: link to the Media library
											'You should set the printable areas for each product image by editing the image in the Media Library.',
											'woocommerce-product-options'
										) }
										<a
											href="https://barn2.com/kb/live-preview"
											className="wpo-live-preview-documentation"
										>
											<Dashicon icon="book" />
											{ __( 'Documentation', 'woocommerce-product-options' ) }
										</a>
									</Notice>
								</>
							) }
						</OptionFormRow>
					) }
					{ ! [ 'html', 'wysiwyg', 'price_formula' ].includes( optionType ) && (
						<>
							<OptionFormRow
								name="description"
								label={ __( 'Description', 'woocommerce-product-options' ) }
								tooltip={ __(
									'Enter an optional description to display underneath the product options.',
									'woocommerce-product-options'
								) }
							>
								<textarea { ...formMethods.register( `options.${ index }.description` ) } />
							</OptionFormRow>
						</>
					) }
					{ ( displayProductsAsImageButtons || [ 'images' ].includes( optionType ) ) && (
						<OptionFormRow
							name={ 'button_width' }
							label={ __( 'Image width', 'woocommerce-product-options' ) }
						>
							<Controller
								control={ formMethods.control }
								name={ `options.${ index }.settings.button_width` }
								render={ () => (
									<label className="wpo-image-buttons-width-label" htmlFor="settings.button_width">
										<input
											type="number"
											step="1"
											min="1"
											className="regular-input wpo-image-buttons-width-field"
											{ ...formMethods.register( `options.${ index }.settings.button_width` ) }
										/>
										{ __( 'px', 'woocommerce-product-options' ) }
									</label>
								) }
							/>
						</OptionFormRow>
					) }
					{ ( displayProductsAsImageButtons || [ 'color_swatches', 'images' ].includes( optionType ) ) && (
						<OptionFormRow
							name={ 'display_label' }
							label={ __( 'Display', 'woocommerce-product-options' ) }
						>
							<Controller
								control={ formMethods.control }
								name={ `options.${ index }.settings.display_label` }
								render={ ( { field } ) => (
									<RadioControl
										selected={ field?.value?.toString() ?? '0' }
										options={ [
											/* translators: %s: Option type label */
											{
												label: sprintf(
													/* translators: %s: Option type label */
													__( 'Display %s only', 'woocommerce-product-options' ),
													optionType === 'product'
														? __( 'images', 'woocommerce-product-options' )
														: optionTypes[
																optionTypes.findIndex(
																	( optionConfig ) => optionConfig.key === optionType
																)
														  ].label.toLowerCase()
												),
												value: '0',
											},
											/* translators: %s: Option type label */
											{
												label: sprintf(
													/* translators: %s: Option type label */
													__( 'Display label and %s', 'woocommerce-product-options' ),
													optionType === 'product'
														? __( 'images', 'woocommerce-product-options' )
														: optionTypes[
																optionTypes.findIndex(
																	( optionConfig ) => optionConfig.key === optionType
																)
														  ].label.toLowerCase()
												),
												value: '1',
											},
										] }
										onChange={ ( value ) => field.onChange( value ) }
									/>
								) }
							/>
						</OptionFormRow>
					) }
					{ ( displayProductsAsImageButtons || [ 'images' ].includes( optionType ) ) &&
						displayLabel === '1' && (
							<OptionFormRow
								name={ 'label_position' }
								label={ __( 'Label position', 'woocommerce-product-options' ) }
							>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.settings.label_position` }
									render={ ( { field } ) => (
										<SelectControl
											value={ field?.value ? field.value : 'full' }
											options={ [
												{
													label: __( 'Full overlay', 'woocommerce-product-options' ),
													value: 'full',
												},
												{
													label: __( 'Full overlay on hover', 'woocommerce-product-options' ),
													value: 'full_hover',
												},
												{
													label: __( 'Partial overlay', 'woocommerce-product-options' ),
													value: 'partial',
												},
												{
													label: __( 'Above image', 'woocommerce-product-options' ),
													value: 'above',
												},
												{
													label: __( 'Below image', 'woocommerce-product-options' ),
													value: 'below',
												},
											] }
											onChange={ ( value ) => field.onChange( value ) }
										/>
									) }
								/>
							</OptionFormRow>
						) }
					{ ! [ 'html', 'wysiwyg', 'price_formula' ].includes( optionType ) &&
						productDisplayStyle !== 'product' &&
						choiceType !== 'variation_attributes' && (
							<OptionFormRow
								name="required"
								label={ __( 'Required', 'woocommerce-product-options' ) }
								tooltip={ __(
									'Force customers to select an option before they can add the product to the cart.',
									'woocommerce-product-options'
								) }
							>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.required` }
									render={ ( { field } ) => (
										<CheckboxControl
											checked={ [ '1', 1, true ].includes( field?.value ) }
											onChange={ ( changeValue ) => field.onChange( changeValue ) }
											isClassicStyle
										/>
									) }
								/>
							</OptionFormRow>
						) }
					<AdvancedSettingsRow
						label={ __( 'Advanced settings', 'woocommerce-product-options' ) }
						opened={ advancedSettings }
						onClick={ () => setAdvancedSettings( ! advancedSettings ) }
					/>
					{ advancedSettings && optionType === 'file_upload' && (
						<>
							<OptionFormRow
								name="settings[file_upload_size]"
								label={ __( 'Maximum file size (MB)', 'woocommerce-product-options' ) }
							>
								<input
									type="number"
									min="0"
									className="regular-input"
									{ ...formMethods.register( `options.${ index }.settings.file_upload_size` ) }
								/>
							</OptionFormRow>

							<OptionFormRow
								name="settings[file_upload_items_max]"
								label={ __( 'Maximum number of files', 'woocommerce-product-options' ) }
							>
								<input
									type="number"
									step={ 1 }
									min={ 1 }
									className="regular-input"
									{ ...formMethods.register( `options.${ index }.settings.file_upload_items_max` ) }
								/>
							</OptionFormRow>

							<OptionFormRow
								name="settings[file_upload_allowed_types]"
								label={ __( 'Allowed file types', 'woocommerce-product-options' ) }
								style={ { zIndex: 2 } } // Ensure the FileTypeSelect dropdown is above the rest of the table rows
							>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.settings.file_upload_allowed_types` }
									render={ ( { field } ) => (
										<FileTypeSelect
											value={ field?.value }
											onChange={ ( value ) => field.onChange( value ) }
										/>
									) }
								/>
							</OptionFormRow>
						</>
					) }
					{ advancedSettings && quantityLimited && choiceType !== 'variation_attributes' && (
						<OptionFormRow
							name="settings.choice_qty"
							label={ __( 'Choice restrictions', 'woocommerce-product-options' ) }
							tooltip={ __(
								'Set the minimum and maximum number of choices that can be selected.',
								'woocommerce-product-options'
							) }
						>
							<div className="wpo-options-min-max-field">
								<div className="wpo-options-min-field">
									<label htmlFor="settings.choice_qty.min">
										{ __( 'Minimum', 'woocommerce-product-options' ) }
									</label>
									<input
										type="number"
										min="0"
										max={ getChoicesLength() ?? 1 }
										step="1"
										className="regular-input"
										{ ...formMethods.register( `options.${ index }.settings.choice_qty.min` ) }
									/>
								</div>

								<div className="wpo-options-max-field">
									<label htmlFor="settings.choice_qty.max">
										{ __( 'Maximum', 'woocommerce-product-options' ) }
									</label>
									<input
										type="number"
										step="1"
										min={ minQtyLimit }
										max={ getChoicesLength() ?? minQtyLimit }
										className="regular-input"
										{ ...formMethods.register( `options.${ index }.settings.choice_qty.max` ) }
									/>
								</div>
							</div>
						</OptionFormRow>
					) }
					{ advancedSettings && optionType === 'number' && (
						<>
							<OptionFormRow
								name="settings.default_value"
								className={ 'option-default-value-row' }
								label={ __( 'Default value', 'woocommerce-product-options' ) }
							>
								<input
									type="number"
									className="regular-input"
									{ ...formMethods.register( `options.${ index }.settings.default_value` ) }
									step={ numberType === 'whole' ? 1 : 'any' }
								/>
							</OptionFormRow>
							<OptionFormRow
								name="settings.number_type"
								className={ 'option-step-row' }
								label={ __( 'Number type', 'woocommerce-product-options' ) }
							>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.settings.number_type` }
									render={ ( { field } ) => (
										<RadioControl
											selected={ field?.value ?? 'whole' }
											options={ [
												{
													label: __( 'Whole number', 'woocommerce-product-options' ),
													value: 'whole',
												},
												{
													label: __( 'Decimal', 'woocommerce-product-options' ),
													value: 'decimal',
												},
											] }
											onChange={ ( value ) => field.onChange( value ) }
										/>
									) }
								/>
							</OptionFormRow>
							<OptionFormRow
								name="settings.number_limits"
								label={ __( 'Number limits', 'woocommerce-product-options' ) }
							>
								<div className="wpo-options-min-max-field">
									<div className="wpo-options-min-field">
										<label htmlFor="settings.number_limits.min">
											{ __( 'Minimum', 'woocommerce-product-options' ) }
										</label>
										<input
											type="number"
											min="0"
											className="regular-input"
											{ ...formMethods.register(
												`options.${ index }.settings.number_limits.min`
											) }
											step={ numberType === 'whole' ? 1 : 'any' }
										/>
									</div>

									<div className="wpo-options-max-field">
										<label htmlFor="settings.number_limits.max">
											{ __( 'Maximum', 'woocommerce-product-options' ) }
										</label>
										<input
											type="number"
											min="0"
											className="regular-input"
											{ ...formMethods.register(
												`options.${ index }.settings.number_limits.max`
											) }
											step={ numberType === 'whole' ? 1 : 'any' }
										/>
									</div>
								</div>
							</OptionFormRow>
						</>
					) }
					{ advancedSettings && [ 'text', 'textarea' ].includes( optionType ) && (
						<OptionFormRow
							name="settings.choice_char"
							label={ __( 'Character limits', 'woocommerce-product-options' ) }
						>
							<div className="wpo-options-min-max-field">
								<div className="wpo-options-min-field">
									<label htmlFor="settings.choice_char.min">
										{ __( 'Minimum', 'woocommerce-product-options' ) }
									</label>
									<input
										type="number"
										min="0"
										step="1"
										className="regular-input"
										{ ...formMethods.register( `options.${ index }.settings.choice_char.min` ) }
									/>
								</div>
								<div className="wpo-options-max-field">
									<label htmlFor="settings.choice_char.max">
										{ __( 'Maximum', 'woocommerce-product-options' ) }
									</label>
									<input
										type="number"
										className="regular-input"
										{ ...formMethods.register( `options.${ index }.settings.choice_char.max` ) }
									/>
								</div>
							</div>
						</OptionFormRow>
					) }
					{ advancedSettings && optionType === 'datepicker' && (
						<>
							<OptionFormRow
								name="settings[datepicker][date_format]"
								label={ __( 'Date format', 'woocommerce-product-options' ) }
							>
								<Controller
									control={ formMethods.control }
									name={ `options.${ index }.settings.datepicker.date_format` }
									render={ ( { field } ) => (
										<DateFormat
											onChange={ ( changeValue ) => field.onChange( changeValue ) }
											value={ field.value }
										/>
									) }
								/>
							</OptionFormRow>
							<OptionFormRow
								name="settings[datepicker][date_limits]"
								label={ __( 'Date limits', 'woocommerce-product-options' ) }
								tooltip={ __(
									'Enter a date in the format YYYY-MM-DD, or enter a dynamic date such as +6d to disable the date which is 6 days from the current date.',
									'woocommerce-product-options'
								) }
							>
								<div className="wpo-options-min-max-field">
									<div className="wpo-options-min-field">
										<label htmlFor="settings.datepicker.min_date">
											{ __( 'Minimum', 'woocommerce-product-options' ) }
										</label>
										<input
											type="text"
											className="regular-input"
											{ ...formMethods.register(
												`options.${ index }.settings.datepicker.min_date`
											) }
										/>
									</div>

									<div className="wpo-options-max-field">
										<label htmlFor="settings.datepicker.max_date">
											{ __( 'Maximum', 'woocommerce-product-options' ) }
										</label>
										<input
											type="text"
											className="regular-input"
											{ ...formMethods.register(
												`options.${ index }.settings.datepicker.max_date`
											) }
										/>
									</div>
								</div>
							</OptionFormRow>
							<OptionFormRow
								name="settings[datepicker][disable_dates]"
								label={ __( 'Disable dates', 'woocommerce-product-options' ) }
								tooltip={ __(
									'Enter a comma separated list of dates in the format YYYY-MM-DD, or enter a dynamic date such as +6d to disable the date which is 6 days from the current date.',
									'woocommerce-product-options'
								) }
							>
								<input
									type="text"
									className="regular-input"
									{ ...formMethods.register(
										`options.${ index }.settings.datepicker.disable_dates`
									) }
								/>
							</OptionFormRow>
							<OptionFormRow
								name="settings[datepicker][time_limits]"
								label={ __( 'Time limits', 'woocommerce-product-options' ) }
								tooltip={ __(
									'Enter a start and end time to restrict the available times.',
									'woocommerce-product-options'
								) }
							>
								<div className="wpo-options-min-max-field">
									<div className="wpo-options-min-field">
										<label htmlFor="settings.datepicker.min_time">
											{ __( 'Minimum', 'woocommerce-product-options' ) }
										</label>
										<input
											type="text"
											className="regular-input"
											{ ...formMethods.register(
												`options.${ index }.settings.datepicker.min_time`
											) }
										/>
									</div>

									<div className="wpo-options-max-field">
										<label htmlFor="settings.datepicker.max_time">
											{ __( 'Maximum', 'woocommerce-product-options' ) }
										</label>
										<input
											type="text"
											className="regular-input"
											{ ...formMethods.register(
												`options.${ index }.settings.datepicker.max_time`
											) }
										/>
									</div>
								</div>
							</OptionFormRow>
							<OptionFormRow
								name="settings[datepicker][time_increment]"
								label={ __( 'Time increment', 'woocommerce-product-options' ) }
								tooltip={ __(
									'Choose the time increments for the time picker.',
									'woocommerce-product-options'
								) }
							>
								<div className="wpo-options-min-max-field">
									<div className="wpo-options-min-field">
										<label htmlFor="settings.datepicker.hour_increment">
											{ __( 'Hours', 'woocommerce-product-options' ) }
										</label>
										<input
											type="number"
											min="1"
											max="24"
											className="regular-input"
											{ ...formMethods.register(
												`options.${ index }.settings.datepicker.hour_increment`
											) }
										/>
									</div>

									<div className="wpo-options-max-field">
										<label htmlFor="settings.datepicker.minute_increment">
											{ __( 'Minutes', 'woocommerce-product-options' ) }
										</label>
										<input
											type="number"
											min="1"
											max="60"
											className="regular-input"
											{ ...formMethods.register(
												`options.${ index }.settings.datepicker.minute_increment`
											) }
										/>
									</div>
								</div>
							</OptionFormRow>
						</>
					) }
					{ advancedSettings && (
						<OptionFormRow
							name="conditional_logic"
							label={ __( 'Conditional logic', 'woocommerce-product-options' ) }
						>
							<Controller
								control={ formMethods.control }
								name={ `options.${ index }.conditional_logic` }
								render={ ( { field } ) => (
									<ConditionalLogicRepeater
										formMethods={ formMethods }
										optionId={ id }
										onChange={ ( value ) => field.onChange( value ) }
										value={ field?.value ?? [] }
									/>
								) }
							/>
						</OptionFormRow>
					) }
					{ advancedSettings && (
						<OptionFormRow
							name="settings.custom_css_class"
							label={ __( 'Custom CSS class', 'woocommerce-product-options' ) }
							tooltip={ __(
								'Enter additional CSS classes for styling purposes.',
								'woocommerce-product-options'
							) }
						>
							<input
								type="text"
								className="regular-input"
								{ ...formMethods.register( `options.${ index }.settings.custom_css_class` ) }
							/>
						</OptionFormRow>
					) }
				</tbody>
			</table>

			<input type={ 'hidden' } { ...formMethods.register( `options.${ index }.id` ) } />
			<input type={ 'hidden' } { ...formMethods.register( `options.${ index }.group_id` ) } />
			<input type={ 'hidden' } { ...formMethods.register( `options.${ index }.menu_order` ) } />
		</>
	);
};

export default OptionForm;
