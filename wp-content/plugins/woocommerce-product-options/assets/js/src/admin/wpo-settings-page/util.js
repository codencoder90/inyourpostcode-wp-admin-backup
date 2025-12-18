export const capitalize = ( string ) => {
	return ( string && string[ 0 ].toUpperCase() + string.slice( 1 ) ) || '';
};

export const getAdvancedSettingsNames = () => {
	return [
		'file_upload_size',
		'file_upload_items_max',
		'file_upload_allowed_types',
		'choice_qty',
		'show_in_product_gallery',
		'default_value',
		'number_type',
		'number_limits',
		'choice_char',
		'datepicker',
	];
};

export const getDefaultAdvancedSettings = ( optionType ) => {
	if ( ! optionType ) {
		return {};
	}

	const defaultAdvancedSettingsByType = {
		file_upload: {
			file_upload_size: '',
			file_upload_items_max: '',
			file_upload_allowed_types: [ 'jpg', 'jpeg', 'jpe', 'png', 'docx', 'xlsx', 'pptx', 'pdf' ],
		},
		checkbox: {
			choice_qty: {
				min: '',
				max: '',
			},
		},
		images: {
			choice_qty: {
				min: '',
				max: '',
			},
			show_in_product_gallery: false,
		},
		text_labels: {
			choice_qty: {
				min: '',
				max: '',
			},
		},
		number: {
			default_value: '',
			number_type: 'whole',
			number_limits: {
				min: '',
				max: '',
			},
		},
		text: {
			choice_char: {
				min: '',
				max: '',
			},
		},
		textarea: {
			choice_char: {
				min: '',
				max: '',
			},
		},
		datepicker: {
			datepicker: {
				date_format: 'F j, Y',
				hour_increment: 1,
				max_time: '23:59',
				min_time: '00:00',
				minute_increment: 15,
			},
		},
		product: {
			choice_qty: {
				min: '',
				max: '',
			},
			show_in_product_gallery: false,
		},
	};

	return defaultAdvancedSettingsByType[ optionType ] || {};
};

export const getAdvancedSettings = ( option, optionType ) => {
	const defaultAdvancedSettings = getDefaultAdvancedSettings( optionType );
	const advancedSettingsKeys = Object.entries( defaultAdvancedSettings ).map( ( entry ) => entry[ 0 ] );

	if ( ! option?.settings ) {
		return {};
	}

	const settings = Object.entries( option.settings ).filter( ( entry ) => {
		const orderedSettings = Object.fromEntries(
			Object.entries( entry[ 1 ] ?? {} )
				.sort( ( a, b ) => a[ 0 ].localeCompare( b[ 0 ] ) )
				.filter( ( a ) => a[ 1 ] )
		);
		const orderedDefaultSettings = Object.fromEntries(
			Object.entries( defaultAdvancedSettings[ entry[ 0 ] ] ?? {} )
				.sort( ( a, b ) => a[ 0 ].localeCompare( b[ 0 ] ) )
				.filter( ( a ) => a[ 1 ] )
		);
		return (
			advancedSettingsKeys.includes( entry[ 0 ] ) &&
			JSON.stringify( orderedDefaultSettings ) !== JSON.stringify( orderedSettings )
		);
	} );

	return Object.fromEntries( settings );
};

export const removeUnnecessarySettings = ( option, optionType ) => {
	if ( ! option?.settings ) {
		return;
	}

	const defaultAdvancedSettings = getDefaultAdvancedSettings( optionType );
	const advancedSettingsKeys = Object.entries( defaultAdvancedSettings ).map( ( e ) => e[ 0 ] );
	const settings = Object.entries( option.settings ).filter( ( entry ) => {
		return advancedSettingsKeys.includes( entry[ 0 ] ) && defaultAdvancedSettings[ entry[ 0 ] ] !== entry[ 1 ];
	} );

	const advancedSettingsNames = getAdvancedSettingsNames();
	advancedSettingsNames.forEach( ( name ) => {
		const setting = settings.filter( ( s ) => s[ 0 ] === name );
		if ( setting.length === 0 ) {
			delete option.settings[ name ];
		}
	} );
};

export const hasAdvancedSettings = ( option, optionType ) => {
	if ( ! optionType ) {
		return false;
	}

	const hasConditionalLogic = option?.conditional_logic?.conditions?.length > 0;

	if ( hasConditionalLogic ) {
		return true;
	}

	const advancedSettings = getAdvancedSettings( option, optionType );

	return Object.entries( advancedSettings ).length > 0;
};
