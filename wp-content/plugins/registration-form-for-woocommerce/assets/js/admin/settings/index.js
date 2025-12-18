import apiFetch from '@wordpress/api-fetch';
import { Button, Icon } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { render, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { HashRouter, NavLink, Route, Switch } from 'react-router-dom';
import { Slide, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from './store';

import './index.scss';
import { GeneralSettings, SyncSettings, EmailSettings } from './pages';

const Settings = () => {
	const [savingChanges, setSavingChanges] = useState(false);
	const {
		setHasData,
		setForms,
		setSettings,
		setFormId,
		setCheckoutFormId,
		setCheckoutFields,
		setCaptchaType,
		setSiteKey,
		setSecretKey,
		setAdminEmail,
		setRecaptchaV3SiteKey,
		setRecaptchaV3SecreteKey,
		setHCaptchaSiteKey,
		setHCaptchaSecreteKey,
	} = useDispatch('tgwcfb/settings');

	const {
		formId,
		checkoutFormId,
		checkoutFields,
		hasData,
		captchaType,
		siteKey,
		secretKey,
		adminEmail,
		recaptchaV3SiteKey,
		recaptchaV3SecreteKey,
		hcaptchaSiteKey,
		hcaptchaSecreteKey
	} = useSelect((select) => {
		const {
			getFormId,
			getCheckoutFormId,
			getCheckoutFields,
			// eslint-disable-next-line no-shadow
			hasData,
			getCaptchaType,
			getSiteKey,
			getSecretKey,
			getAdminEmail,
			getRecaptchaV3SiteKey,
			getRecaptchaV3SecreteKey,
			getHCaptchaSiteKey,
			getHCaptchaSecreteKey,
		} = select('tgwcfb/settings');

		return {
			formId: getFormId(),
			checkoutFormId: getCheckoutFormId(),
			checkoutFields: getCheckoutFields(),
			hasData: hasData(),
			captchaType: getCaptchaType(),
			siteKey: getSiteKey(),
			secretKey: getSecretKey(),
			adminEmail:getAdminEmail(),
			recaptchaV3SiteKey:getRecaptchaV3SiteKey(),
			recaptchaV3SecreteKey:getRecaptchaV3SecreteKey(),
			hcaptchaSiteKey:getHCaptchaSiteKey(),
			hcaptchaSecreteKey:getHCaptchaSecreteKey()
		};
	});

	useEffect(() => {
		const getForms = new Promise((resolve, reject) => {
			apiFetch({
				path: 'tgwcfb/v1/forms',
				method: 'GET',
			})
				.then((res) => {
					if (res.success) {
						resolve(res.forms);
					}
				})
				.catch(reject);
		});

		const getSettings = new Promise((resolve, reject) => {
			apiFetch({
				path: 'wp/v2/settings',
				method: 'POST',
			})
				.then((res) => {
					resolve(res);
				})
				.catch(reject);
		});

		Promise.all([getForms, getSettings]).then((results) => {
			const [forms, settings] = results;
			setSettings(settings || {});
			setForms(forms || []);
			setHasData(true);
			setFormId(settings?._tgwcfb_form_id || 0);
			setCheckoutFormId(settings?._tgwcfb_checkout_form_id || 0);
			setCheckoutFields(settings?._tgwcfb_checkout_fields || []);
			setCaptchaType(settings?._tgwcfb_captcha_type || '');
			setSiteKey(settings?._tgwcfb_site_key || '');
			setSecretKey(settings?._tgwcfb_secret_key || '');
			setAdminEmail(JSON.parse(settings?._tgwcfb_admin_email_settings)||{});
			setRecaptchaV3SiteKey(settings?._tgwcfb_recaptcha_v3_site_key || '');
			setRecaptchaV3SecreteKey(settings?._tgwcfb_recaptcha_v3_secrete_key || '');
			setHCaptchaSiteKey(settings?._tgwcfb_hcaptcha_site_key || '');
			setHCaptchaSecreteKey(settings?._tgwcfb_hcaptcha_secrete_key || '');
		});
	}, []);

	const saveChanges = () => {
		setSavingChanges(true);
		const toastOptions = {
			position: toast.POSITION.BOTTOM_CENTER,
			pauseOnHover: false,
			hideProgressBar: true,
			autoClose: 3000,
			transition: Slide,
		};
		const data = {
			_tgwcfb_form_id: formId,
			_tgwcfb_checkout_form_id: checkoutFormId,
			_tgwcfb_checkout_fields: checkoutFields,
			_tgwcfb_captcha_type: captchaType,
			_tgwcfb_site_key: siteKey,
			_tgwcfb_secret_key: secretKey,
			_tgwcfb_admin_email_settings:JSON.stringify(adminEmail),
			_tgwcfb_recaptcha_v3_site_key:recaptchaV3SiteKey,
			_tgwcfb_recaptcha_v3_secrete_key:recaptchaV3SecreteKey,
			_tgwcfb_hcaptcha_site_key:hcaptchaSiteKey,
			_tgwcfb_hcaptcha_secrete_key:hcaptchaSecreteKey
		};

		apiFetch({
			path: 'wp/v2/settings',
			method: 'PUT',
			body: JSON.stringify({ ...data }),
		})
			.then(() => {
				toast.success(
					__(
						'Settings saved successfully!',
						'registration-form-for-woocommerce'
					),
					toastOptions
				);
			})
			.catch((e) => {
				toast.error(`${e.code}: ${e.message}`, toastOptions);
			})
			.finally(() => setSavingChanges(false));
	};

	useEffect(() => {
		const menuEl = window.document.querySelector(
			'a[href*="page=settings/#sync-settings"]'
		);
		if (!menuEl) return;
		menuEl?.parentElement?.classList?.add('current');
		return () => {
			menuEl?.parentElement?.classList?.remove('current');
		};
	}, []);

	return (
		<HashRouter>
			<div className="tgwcfb-settings-wrap">
				<div className="tgwcfb-header">
					<div className="tgwcfb-logo">
						<Icon
							size={50}
							icon={
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 239.1 263.9"
								>
									<path
										d="M172.1 81.8c-3.4 0-6.1-2.9-6.1-6.5V22.5H29c-3.9 0-7.1 3.5-7.1 7.8v202.5c0 4.3 3.2 7.8 7.1 7.8h184.1c3.9 0 7.1-3.5 7.1-7.8v-151h-48.1z"
										fill="#8d5af8"
									/>
									<path
										d="M171.2 22.6v50.3c0 1.8 1.3 3.3 2.9 3.3h45.4"
										fill="#baa1ff"
									/>
									<path
										d="M178.4 123.2H55.5c-1.2 0-2.1-.9-2.1-2.1v-17.8c0-1.2.9-2.1 2.1-2.1h122.8c1.2 0 2.1.9 2.1 2.1v17.8c.1 1.2-.9 2.1-2 2.1zm-.2 40.8H55.3c-1.2 0-2.1-.9-2.1-2.1v-17.8c0-1.2.9-2.1 2.1-2.1h122.8c1.2 0 2.1.9 2.1 2.1v17.8c.1 1.2-.9 2.1-2 2.1z"
										fill="#fff"
									/>
									<path
										d="M169 204.8h-51.5c-6.3 0-11.4-4.9-11.4-11s5.1-11 11.4-11H169c6.3 0 11.4 4.9 11.4 11 .1 6-5.1 11-11.4 11z"
										fill="#fec600"
									/>
								</svg>
							}
						/>
						<h3 style={{ margin: 0 }}>
							Registration Form Fields For WooCommerce
						</h3>
					</div>
					<nav>
						<NavLink to="/sync-settings">
							{__('Sync Settings', 'registration-form-for-woocommerce')}
						</NavLink>
						<NavLink to="/general-settings">
							{__('General Settings', 'registration-form-for-woocommerce')}
						</NavLink>
						<NavLink to="/email-settings">
							{__('Email', 'registration-form-for-woocommerce')}
						</NavLink>
					</nav>
				</div>
				<div className="tgwcfb-container">
					<div className="tgwcfb-settings">
						<Switch>
							<Route path="/sync-settings" component={SyncSettings} exact />
							<Route
								path="/general-settings"
								component={GeneralSettings}
								exact
							/>
							<Route path="/email-settings" component={EmailSettings} exact />
						</Switch>
						{hasData && (
							<Button
								onClick={saveChanges}
								className="is-primary"
								isBusy={!!savingChanges}
								disabled={!!savingChanges}
								variant="primary"
							>
								{__('Save changes', 'registration-form-for-woocommerce')}
							</Button>
						)}
						<ToastContainer />
					</div>
				</div>
			</div>
		</HashRouter>
	);
};

// Initialize store.
store();

const root = document.getElementById('tgwcfb-settings');

if (root) {
	render(<Settings />, root);
}
