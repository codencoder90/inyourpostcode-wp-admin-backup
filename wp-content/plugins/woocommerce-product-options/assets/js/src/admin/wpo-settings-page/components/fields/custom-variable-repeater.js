/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import DeleteModal from '../tables/delete-modal';

const CustomVariableRepeater = ( { variables, setVariables, onFocusedFormula, onChange, onSelect } ) => {
	const [ deleteVariable, setDeleteVariable ] = useState( {} );

	const handleAddVariable = () => {
		const newVariableName = 'variable' + ( Object.keys( variables ).length + 1 );
		setVariables( [ ...variables, { name: newVariableName, formula: '' } ] );
	};

	const handleCloneVariable = ( index ) => {
		const newVariableName = 'variable' + ( Object.keys( variables ).length + 1 );
		setVariables( [ ...variables, { name: newVariableName, formula: variables[ index ].formula } ] );
	};

	const setVariableName = ( variableIndex, newVariableName ) => {
		setVariables(
			variables.map( ( variable, index ) =>
				variableIndex === index ? { name: newVariableName.replace( /\s/, '_' ), formula: variable.formula } : variable
			)
		);
	};

	const setVariableFormula = ( variableIndex, newVariableFormula ) => {
		setVariables(
			variables.map( ( variable, index ) =>
				variableIndex === index ? { name: variable.name, formula: newVariableFormula } : variable
			)
		);
	};

	const handleRemoveVariable = () => {
		const newVariables = [ ...variables ];
		newVariables.splice( deleteVariable.index, 1 );
		setVariables( newVariables );
		setDeleteVariable( {} );
	};

	return (
		<div className="wpo-custom-formula-variables">
			<div className="wpo-custom-formula-variables-title">
				<h4>{ __( 'Custom variables', 'woocommerce-product-options' ) }</h4>
				<p>{ __( 'Add custom variables to use in the price formula.', 'woocommerce-product-options' ) }</p>
			</div>
			{ variables.length > 0 && (
				<table className="option-setting-repeater wpo-variables-repeater">
					<thead className="choice-headers">
						<tr>
							<th className={ 'option-variables-repeater-name-col' } colSpan={ 1 }>
								{ __( 'Variable Name', 'woocommerce-product-options' ) }
							</th>
							<th className={ 'option-variables-repeater-formula-col' } colSpan={ 1 }>
								{ __( 'Formula', 'woocommerce-product-options' ) }
							</th>
							<th className={ 'option-setting-repeater-remove-col' } colSpan={ 1 }></th>
							<th className={ 'option-setting-repeater-clone-col' } colSpan={ 1 }></th>
						</tr>
					</thead>
					<tbody className="option-variable-repeater">
						{ variables.map( ( variable, index ) => (
							<tr key={ index } className="wpo-custom-formula-variables__item">
								<td>
									<input
										type="text"
										value={ variable.name }
										onChange={ ( e ) => setVariableName( index, e.target.value ) }
										placeholder={ __( 'variable', 'woocommerce-product-options' ) }
									/>
								</td>
								<td>
									<textarea
										value={ variable.formula || '' }
										onChange={ ( e ) => {
											setVariableFormula( index, e.target.value );
											onChange( e );
										} }
										placeholder={ __( 'formula', 'woocommerce-product-options' ) }
										onFocus={ onFocusedFormula }
										onSelect={ onSelect }
										rows={ 1 }
									/>
								</td>
								<td>
									<a
										className="button wpo-option-setting-repeater-remove"
										disabled={ false }
										title={ __( 'Remove this variable', 'woocommerce-product-options' ) }
										onClick={ () => setDeleteVariable( { index } ) }
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
									</a>
								</td>
								<td>
									<a
										className="button wpo-option-setting-repeater-clone"
										disabled={ false }
										title={ __( 'Clone this variable', 'woocommerce-product-options' ) }
										onClick={ () => handleCloneVariable( index ) }
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
									</a>
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			) }<a
				className="button wpo-option-setting-repeater-add"
				disabled={ false }
				title={ __( 'Add variable', 'woocommerce-product-options' ) }
				onClick={ () => handleAddVariable() }
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
			</a>
			<DeleteModal
				row={ deleteVariable }
				title={ __( 'Delete custom variable', 'woocommerce-product-options' ) }
				confirmMessage={ __(
					'Are you sure you want to delete this custom variable?',
					'woocommerce-product-options'
				) }
				onModalDelete={ handleRemoveVariable }
				onModalClose={ () => {
					setDeleteVariable( {} );
				} }
			/>
		</div>
	);
};

export default CustomVariableRepeater;
