/**
 * Expresse Checkout Element support
 *
 * Add support for Express Checkout Element in the single product page.
 *
 * @param {jQuery} $ jQuery
 * @param {HTMLElement} cartForm Cart form
 */
const ECESupport = ( $, cartForm  ) => {
    const init = () => {
        $.ajaxSetup({
            beforeSend:  ( jqXHR, settings ) => {
                if ( settings.data && settings.url && settings.url.includes( 'wc-ajax=wcpay_add_to_cart' ) ) {
                    let formData = {};
                    
                    let currentData = new URLSearchParams( settings.data );
                    const formEntries = Array.from( currentData.entries() );
        
                    settings.data = new URLSearchParams( getFormData( formEntries ) ).toString();
                }
            }
        });
    };

    const getFormData = ( formEntries ) => {
        const formData = new FormData( cartForm );
        formData.entries().forEach( ( [ name, value ] ) => {
            if ( [ null, undefined, 'undefined', '' ].includes( value ) ) {
                // skip empty values
                return;
            }

            try {
                // try to parse the value as JSON in case it is a stringified object or array
                // (e.g. from a file upload field)
                // this will also convert numeric strings to numbers
                value = JSON.parse( value );

                if ( Array.isArray( value ) && value.length === 0 ) {
                    // skip empty arrays
                    return;
                }
            } catch( e ) {
                // do nothing
            }

            formEntries.push( [ name, value ] );
        } );


        return formEntries;
    };

    return {
        init
    };
};		

export default ECESupport;