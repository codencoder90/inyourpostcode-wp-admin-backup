import { ToggleControl, Popover, Button } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

export default createHigherOrderComponent((Component) => {
	return (props) => {
		if (
			!props.name.includes('shipping') &&
			!props.name.includes('billing') &&
			!['tgwcfb/username', 'tgwcfb/password', 'tgwcfb/email'].includes(
				props.name
			)
		) {
			const [isTooltipVisible, setIsTooltipVisible] = useState(false);

			const showTooltip = () => {
				setIsTooltipVisible(true);
			};

			const hideTooltip = () => {
				setIsTooltipVisible(false);
			};
			return (
				<>
				<div
					style={{
						cursor:'not-allowed',
						opacity: '0.5',
					}}
					onMouseOver={showTooltip}
					onMouseOut={hideTooltip}
				>
					<ToggleControl
					label={__('Show in order', 'registration-form-for-woocommerce')}
					disabled
					/>
					{isTooltipVisible && (
						<Popover
							placement='left-top'
						>
						<div
						style={{
							width:'200px' ,
							padding:'10px',
							backgroundColor:'#2d2e2d',
							color:'white'
						}}
						>
						<span>{ __( 'You are currently using the free version of our plugin. Please upgrade to premium version to use this feature.','registration-form-for-woocommerce') }</span>
						<div
							style={{
								display:'flex',
								justifyContent:'end',
							}}
						>
							<Button
								style={{
									backgroundColor:'white',
									color: 'blue',
									margin: '5px',
									border: 'none',
									outline: 'none',
									boxShadow: 'none'
								}}
								>
								<a
								style={{
									textDecoration:'none',
									fontWeight: 'bold',
								}}
								href='https://woocommerce.com/products/registration-form-fields/'
								rel="noreferrer"
								target='_blank'
								>Upgrade To Pro</a>
							</Button>
						</div>

						</div>
						</Popover>
					)}
				</div>
					<Component {...props} />
				</>
			);
		}
		return <Component {...props} />;
	};
}, 'withShowInOrderEmailInspectorControl');
