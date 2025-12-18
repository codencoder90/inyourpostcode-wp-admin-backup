import { useContext } from '@wordpress/element';
import { CurrencyContext } from '@woocommerce/currency';
import { __experimentalInputControl as InputControl } from '@wordpress/components';
import { useCurrencyInputProps } from '@barn2plugins/react-helpers';
import { PrefixedControl } from '@barn2plugins/components';

const WCPriceInput = ( { required = false, storeCurrency, value, onChange = () => {} } ) => {
	const currencyContext = useContext( CurrencyContext );
	const currencyConfig = storeCurrency.getCurrencyConfig();

	const currencyInputProps = useCurrencyInputProps( {
		value,
		onChange,
		currencyContext,
		currencyConfig,
	} );

	return (
		<PrefixedControl>
			<InputControl { ...currencyInputProps } required={ required } />
		</PrefixedControl>
	);
};

export default WCPriceInput;
