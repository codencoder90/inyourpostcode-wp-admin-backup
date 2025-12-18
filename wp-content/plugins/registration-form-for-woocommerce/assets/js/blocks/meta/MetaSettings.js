import {
	ExternalLink,
	TextControl,
	ToggleControl,
	SelectControl,
	Popover,
	Button,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

export default compose([
	withSelect((select) => ({
		postMeta: select('core/editor').getEditedPostAttribute('meta'),
	})),
	withDispatch((dispatch) => ({
		setPostMeta: (newMeta) => {
			dispatch('core/editor').editPost({ meta: newMeta });
		},
	})),
])((props) => {
	const { setPostMeta, postMeta } = props;
	const userRoles = window?._TGWCFB_EDITOR_?.userRoles || {};
	const captchaType = window?._TGWCFB_EDITOR_?.captchaType || 'v2';
	const [isTooltipVisible, setIsTooltipVisible] = useState(false);

	const showTooltip = () => {
		setIsTooltipVisible(true);
	};

	const hideTooltip = () => {
		setIsTooltipVisible(false);
	};

	return (
		<PluginDocumentSettingPanel
			name="_tgwcfb_settings"
			title={__('Settings', 'registration-form-for-woocommerce')}
			initialOpen={true}
		>
			<TextControl
				type="url"
				label={__('Redirect URL', 'registration-form-for-woocommerce')}
				help={__(
					'Redirect to certain url after successful registration',
					'registration-form-for-woocommerce'
				)}
				value={postMeta._tgwcfb_redirect_url}
				onChange={(val) =>
					setPostMeta({ ...postMeta, _tgwcfb_redirect_url: val })
				}
			/>
			<TextControl
				type="url"
				label={__(
					'Form submit button text',
					'registration-form-for-woocommerce'
				)}
				value={postMeta._tgwcfb_submit_btn_text}
				onChange={(val) =>
					setPostMeta({ ...postMeta, _tgwcfb_submit_btn_text: val })
				}
			/>
			{captchaType === 'v2' && (<ToggleControl
				label={__('reCaptcha v2 support', 'registration-form-for-woocommerce')}
				help={
					<>
						{__(
							'Enable Captcha for strong security from spams and bots, setup ',
							'registration-form-for-woocommerce'
						)}
						<ExternalLink
							href={
								window._TGWCFB_EDITOR_.adminURL +
								'edit.php?post_type=tgwcfb_form&page=settings/#general-settings'
							}
						>
							{__(
								'Google reCaptcha Settings',
								'registration-form-for-woocommerce'
							)}
						</ExternalLink>
					</>
				}
				checked={postMeta._tgwcfb_recaptcha_v2}
				onChange={() =>
					setPostMeta({
						...postMeta,
						_tgwcfb_recaptcha_v2: !postMeta._tgwcfb_recaptcha_v2,
					})
				}
				/>)}

{captchaType === 'v3' && (<ToggleControl
				label={__('reCaptcha v3 support', 'registration-form-for-woocommerce')}
				help={
					<>
						{__(
							'Enable Captcha for strong security from spams and bots, setup ',
							'registration-form-for-woocommerce'
						)}
						<ExternalLink
							href={
								window._TGWCFB_EDITOR_.adminURL +
								'edit.php?post_type=tgwcfb_form&page=settings/#general-settings'
							}
						>
							{__(
								'Google reCaptcha Settings',
								'registration-form-for-woocommerce'
							)}
						</ExternalLink>
					</>
				}
				checked={postMeta._tgwcfb_recaptcha_v3}
				onChange={() =>
					setPostMeta({
						...postMeta,
						_tgwcfb_recaptcha_v3: !postMeta._tgwcfb_recaptcha_v3,
					})
				}
				/>)}
				{captchaType === "hcaptcha" && (
				<ToggleControl
					label={__(
						"hCaptcha support",
						"registration-form-for-woocommerce"
					)}
					help={
						<>
							{__(
								"Enable Captcha for strong security from spams and bots, setup ",
								"registration-form-for-woocommerce"
							)}
							<ExternalLink
								href={
									window._TGWCFB_EDITOR_.adminURL +
									"edit.php?post_type=tgwcfb_form&page=settings/#general-settings"
								}
							>
								{__(
									"hCaptcha Settings",
									"registration-form-for-woocommerce"
								)}
							</ExternalLink>
						</>
					}
					checked={postMeta._tgwcfb_hcaptcha}
					onChange={() =>
						setPostMeta({
							...postMeta,
							_tgwcfb_hcaptcha:
								!postMeta._tgwcfb_hcaptcha,
						})
					}
				/>
			)}
		<div
			style={{
				cursor: 'not-allowed',
				opacity: 0.5,
			}}
			onMouseOver={showTooltip}
			onMouseOut={hideTooltip}
		>
			<SelectControl
			label={ __( 'User approval option', 'registration-form-for-woocommerce' ) }
			options={ [
				{ label: 'Auto approval & auto login', value: '' },
			] }
			style={{
				cursor: 'not-allowed',
				opacity: 0.5,
			}}
			disabled
		/>
		<ToggleControl
		label={ __( 'Assign user role', 'registration-form-for-woocommerce' ) }
		help={ __( 'Auto assign role to registered users through this form, if enabled it will ignore the User Role field', 'registration-form-for-woocommerce' ) }
		disabled
	/>
	{ isTooltipVisible && (
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
		</PluginDocumentSettingPanel>
	);
});
