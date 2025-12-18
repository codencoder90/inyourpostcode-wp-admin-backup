import { ToggleControl, Popover, Button } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

export default createHigherOrderComponent((Component) => {
	return (props) => {
		if (
			[
				'tgwcfb/checkbox',
				'tgwcfb/input',
				'tgwcfb/number',
				'tgwcfb/multi-select',
				'tgwcfb/radio',
				'tgwcfb/range',
				'tgwcfb/select',
				'tgwcfb/textarea',
				'tgwcfb/time-picker',
				'tgwcfb/profile-picture',
				'tgwcfb/date-picker',
				'tgwcfb/secondary-email',
				'tgwcfb/email',
				'tgwcfb/phone',
				'tgwcfb/display-name',
				'tgwcfb/first-name',
				'tgwcfb/last-name',
				'tgwcfb/nickname',
				'tgwcfb/description',
				'tgwcfb/url',
			].includes(props.name)
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
					<Component {...props} />
					<div
						style={{
							cursor: 'not-allowed',
							opacity: '0.5',
							marginBottom: '20px',
						}}
						onMouseOver={showTooltip}
						onMouseOut={hideTooltip}
					>
						<ToggleControl
							label={__('Read only', 'registration-form-for-woocommerce')}
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
				</>
			);
		}
		return <Component {...props} />;
	};
}, 'withReadOnlyInspectorControl');
