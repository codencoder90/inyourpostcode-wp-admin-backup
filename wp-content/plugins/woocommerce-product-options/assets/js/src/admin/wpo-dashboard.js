import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

( function( $ ) {
    'use strict';

    $( document ).on( 'ready', ( event ) => {
        $( document ).on( 'click', '#missing_wlp a', ( event ) => {
            event.preventDefault();
            const $link = $( event.target );
            $link.css( 'opacity', 0.5 );
            const $notice = $( '#missing_wlp' );
            $.ajax( {
                url: window.ajaxurl,
                type: 'POST',
                data: {
                    action: 'wpo_install_wlp',
                    nonce: window?.wpoAdmin?.nonce
                },
                success: ( response ) => {
                    if ( ! response?.data?.notice ) {
                        response.data.type = 'error';
                    }
                    response.data.notice = response?.data?.notice || __( 'An error occurred while processing your request.', 'woocommerce-product-options' );
                    $notice.fadeOut( 100, () => {
                        $notice.get(0).outerHTML = response.data.notice;
                        $notice.removeClass( 'notice-error notice-success notice-warning notice-info' );
                        $notice.addClass( `notice-${ response.data.type }` );
                        $notice.fadeIn( 100 );
                    } );
                },
                error: ( response ) => {
                    if ( ! response?.data?.notice ) {
                        response.data.type = 'error';
                    }
                    response.data.notice = response?.data?.notice || __( 'An error occurred while processing your request.', 'woocommerce-product-options' );
                    $notice.fadeOut( 100, () => {
                        $notice.get(0).outerHTML = response.data.notice;
                        $notice.removeClass( 'notice-error notice-success notice-warning notice-info' );
                        $notice.addClass( `notice-${ response.data.type }` );
                        $notice.fadeIn( 100 );
                    } );
                }
            } );
        } );

        $( document ).on( 'click', '#wpo_formula_conversion a.action-export', ( event ) => {
            event.preventDefault();
            const $notice = $( '#wpo_formula_conversion' );
            const $buttons = $notice.find( '.notice-buttons a.button' );
            $notice.find( 'p.error-message' ).remove();
            $buttons.attr( 'disabled', 'disabled' );

            apiFetch( { path: '/wc-product-options/v1/groups/export/?id=' } )
                .then( ( groups ) => {
                    const blob = new Blob( [ JSON.stringify( groups ) ], { type: 'application/json' } );
                    const url = URL.createObjectURL( blob );
                    const a = document.createElement( 'a' );
                    a.href = url;
                    const name = [
                        'wpo-export',
                        window.location.hostname,
                        new Date().toISOString().split( '.' )[ 0 ].replace( /[-:T]/g, '' ),
                    ];
                    a.download = `${ name.join( '-' ) }.json`;
                    document.body.appendChild( a );
                    a.click();
                    URL.revokeObjectURL( url );
                    event.target.disabled = false;
                    $buttons.attr( 'disabled', null );
                } )
                .catch( ( error ) => {
                    const $errorMessage = $notice.append( '<p class="error-message"></p>' ).find( 'p.error-message' );

                    $errorMessage.text( error.message || __( 'An error occurred while processing your request. Please reload the page and try again.', 'woocommerce-product-options' ) );

                    event.target.disabled = false;
                    $buttons.attr( 'disabled', null );
                } );
        } );
    });
}) ( jQuery );