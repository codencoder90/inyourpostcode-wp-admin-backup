export const sanitize = ( name ) => {
	name = name || '';

	return name
		?.trim()
		.replace( /[ -//<-?[\]{}]/g, '_' )
		.replace( /_+/g, '_' )
		.replace( /^_/, '' )
		.replace( /_$/, '' );
};

