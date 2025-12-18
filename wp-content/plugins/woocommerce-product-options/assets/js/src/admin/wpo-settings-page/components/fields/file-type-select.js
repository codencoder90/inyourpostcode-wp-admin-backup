import { __ } from '@wordpress/i18n';

import { MultiselectControl } from '@barn2plugins/components';

const FileTypeSelect = ( { value, onChange = () => {} } ) => {
	/**
	 * Convert the file types to a format the multiselect control can use.
	 *
	 * @param {Array} fileExtensions
	 * @return {Array} multiSelectStructure formatted for the multiselect control
	 */
	const convertFileExtensionsStructureForMultiSelect = ( fileExtensions ) => {
		fileExtensions = fileExtensions.sort( ( a, b ) => a.localeCompare( b ) );
		return fileExtensions.map( ( fileExtension ) => ( {
			label: fileExtension.includes( '|' ) ? fileExtension.replaceAll( '|', ' | ' ) : fileExtension,
			value: fileExtension,
		} ) );
	};

	/**
	 * Convert the file types to an array of extensions.
	 *
	 * @param {Array} multiSelectStructure
	 * @return {Array} fileExtensions formatted for the multiselect control
	 */
	const convertMultiSelectStructureToFileExtensions = ( multiSelectStructure ) => {
		return multiSelectStructure.map( ( fileExtension ) => fileExtension.value );
	};

	return (
		<MultiselectControl
			className="wpo-option-file-upload-allowed-types"
			label={ __( 'Select one or more file types', 'woocommerce-product-options' ) }
			placeholder={ __( 'Allowed file types', 'woocommerce-product-options' ) }
			suggestions={ convertFileExtensionsStructureForMultiSelect( Object.keys( wpoSettings.fileTypes ) ) }
			value={
				value
					? convertFileExtensionsStructureForMultiSelect( value )
					: convertFileExtensionsStructureForMultiSelect( [
							'jpg|jpeg|jpe',
							'png',
							'docx',
							'xlsx',
							'pptx',
							'pdf',
					  ] )
			}
			onChange={ ( newValues ) => onChange( convertMultiSelectStructureToFileExtensions( newValues ) ) }
			searchable
		/>
	);
};

export default FileTypeSelect;
