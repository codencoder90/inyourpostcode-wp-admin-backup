import { useEffect } from '@wordpress/element';

const WCTableTooltip = ( props ) => {
	const { tooltip } = props;

	useEffect( () => {
		jQuery( '.barn2-help-tip' ).tipTip( {
			attribute: 'data-tip',
			fadeIn: 50,
			fadeOut: 50,
			delay: 200,
			keepAlive: false,
			defaultPosition: 'bottom',
		} );
	} );

	return <span className="barn2-help-tip" data-tip={ tooltip }></span>;
};

export default WCTableTooltip;
