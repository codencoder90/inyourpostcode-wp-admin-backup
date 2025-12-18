import {
	BaseControl,
	Button,
	ExternalLink,
	RadioControl,
	Spinner,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { Tooltip } from '../components';

export default () => {
	const { secretKey, siteKey, recaptchaV3SiteKey, recaptchaV3SecreteKey, hcaptchaSiteKey, hcaptchaSecreteKey, captchaType, hasData } = useSelect((select) => {
		// eslint-disable-next-line no-shadow
		const { getSecretKey, getSiteKey, getRecaptchaV3SiteKey, getRecaptchaV3SecreteKey, getHCaptchaSiteKey, getHCaptchaSecreteKey, getCaptchaType, hasData } = select('tgwcfb/settings');
		return {
			secretKey: getSecretKey(),
			siteKey: getSiteKey(),
			recaptchaV3SiteKey:getRecaptchaV3SiteKey(),
			recaptchaV3SecreteKey:getRecaptchaV3SecreteKey(),
			hcaptchaSiteKey: getHCaptchaSiteKey(),
			hcaptchaSecreteKey: getHCaptchaSecreteKey(),
			captchaType: getCaptchaType(),
			hasData: hasData(),
		};
	});
	const { setSecretKey, setSiteKey, setRecaptchaV3SiteKey, setRecaptchaV3SecreteKey, setHCaptchaSiteKey, setHCaptchaSecreteKey, setCaptchaType } = useDispatch('tgwcfb/settings');

	if (!hasData) {
		return <Spinner />;
	}

	return (
		<>
			<BaseControl className="tgwcfb-setting">
				<BaseControl.VisualLabel>
					{__('Captcha Type', 'registration-form-for-woocommerce')}
					<Tooltip
						content={
							<>
								{__('Select the captcha type which apply to the form', 'registration-form-for-woocommerce')}
							</>
						}
						width={215}
					>
						<Button icon="info-outline" />
					</Tooltip>
				</BaseControl.VisualLabel>

				<RadioControl
					selected={captchaType}
					options={[
						{ label: 'reCAPTCHA V2', value: 'v2' },
						{ label: 'reCAPTCHA V3', value: 'v3' },
						{ label: 'hCAPTCHA', value: 'hcaptcha' },
					]}
					id="tgwcfb-captcha-type"
					className="tgwcfb-setting"
					onChange={(value) =>setCaptchaType(value)}
				/>
			</BaseControl>

			{captchaType === 'v2' && (
				<BaseControl className="tgwcfb-setting">
					<BaseControl.VisualLabel>
						{__('Google reCaptcha v2 settings', 'registration-form-for-woocommerce')}
						<Tooltip
							content={
								<>
									{__('Get site key and secret key from ', 'registration-form-for-woocommerce')}
									<ExternalLink href="https://google.com/recaptcha ">
										{__('Google reCaptcha')}
									</ExternalLink>
								</>
							}
							width={215}
						>
							<Button icon="info-outline" />
						</Tooltip>
					</BaseControl.VisualLabel>
					<BaseControl
						className="tgwcfb-setting"
						label={__('Site key', 'registration-form-for-woocommerce')}
						id="tgwcfb-site-key"
					>
						<input
							className="components-text-control__input"
							type="text"
							id="tgwcfb-site-key"
							defaultValue={siteKey}
							onChange={(e) => setSiteKey(e.currentTarget.value)}
						/>
					</BaseControl>
					<BaseControl
						className="tgwcfb-setting"
						label={__('Secret key', 'registration-form-for-woocommerce')}
						id="tgwcfb-secret-key"
					>
						<input
							className="components-text-control__input"
							type="text"
							id="tgwcfb-secret-key"
							defaultValue={secretKey}
							onChange={(e) => setSecretKey(e.currentTarget.value)}
						/>
					</BaseControl>
				</BaseControl>
			)}

			{captchaType === 'v3' && (
				<BaseControl className="tgwcfb-setting">
					<BaseControl.VisualLabel>
						{__('Google reCaptcha v3 settings', 'registration-form-for-woocommerce')}
						<Tooltip
							content={
								<>
									{__('Get site key and secret key from ', 'registration-form-for-woocommerce')}
									<ExternalLink href="https://google.com/recaptcha ">
										{__('Google reCaptcha')}
									</ExternalLink>
								</>
							}
							width={215}
						>
							<Button icon="info-outline" />
						</Tooltip>
					</BaseControl.VisualLabel>
					<BaseControl
						className="tgwcfb-setting"
						label={__('Site key', 'registration-form-for-woocommerce')}
						id="tgwcfb-recaptcha-v3-site-key"
					>
						<input
							className="components-text-control__input"
							type="text"
							id="tgwcfb-recaptcha-v3-site-key"
							defaultValue={recaptchaV3SiteKey}
							onChange={(e) => setRecaptchaV3SiteKey(e.currentTarget.value)}
						/>
					</BaseControl>
					<BaseControl
						className="tgwcfb-setting"
						label={__('Secret key', 'registration-form-for-woocommerce')}
						id="tgwcfb-recaptcha-v3-secret-key"
					>
						<input
							className="components-text-control__input"
							type="text"
							id="tgwcfb-recaptcha-v3-secret-key"
							defaultValue={recaptchaV3SecreteKey}
							onChange={(e) => setRecaptchaV3SecreteKey(e.currentTarget.value)}
						/>
					</BaseControl>
				</BaseControl>
			)}

{captchaType === 'hcaptcha' && (
							<BaseControl className="tgwcfb-setting">
								<BaseControl.VisualLabel>
									{__('hCaptcha settings', 'registration-form-for-woocommerce')}
									<Tooltip
										content={
											<>
												{__('Get site key and secret key from ', 'registration-form-for-woocommerce')}
												<ExternalLink href="https://www.hcaptcha.com/">
													{__('hCaptcha')}
												</ExternalLink>
											</>
										}
										width={215}
									>
										<Button icon="info-outline" />
									</Tooltip>
								</BaseControl.VisualLabel>
								<BaseControl
									className="tgwcfb-setting"
									label={__('Site key', 'registration-form-for-woocommerce')}
									id="tgwcfb-hcaptcha-site-key"
								>
									<input
										className="components-text-control__input"
										type="text"
										id="tgwcfb-hcaptcha-site-key"
										defaultValue={hcaptchaSiteKey}
										onChange={(e) => setHCaptchaSiteKey(e.currentTarget.value)}
									/>
								</BaseControl>
								<BaseControl
									className="tgwcfb-setting"
									label={__('Secret key', 'registration-form-for-woocommerce')}
									id="tgwcfb-hcaptcha-secret-key"
								>
									<input
										className="components-text-control__input"
										type="text"
										id="tgwcfb-hcaptcha-secret-key"
										defaultValue={hcaptchaSecreteKey}
										onChange={(e) => setHCaptchaSecreteKey(e.currentTarget.value)}
									/>
								</BaseControl>
							</BaseControl>
						)}
		</>
	);

};
