import { parse } from '@wordpress/block-serialization-default-parser';
import {
	BaseControl,
	Button,
	ExternalLink,
	Popover,
	SelectControl,
	Spinner,
	Tooltip as WPTooltip,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import _ from 'lodash';

import { Tooltip } from '../components';

const CHECKOUT_BLOCKS = [
	'tgwcfb/user-roles',
	'tgwcfb/input',
	'tgwcfb/textarea',
	'tgwcfb/date-picker',
	'tgwcfb/time-picker',
	'tgwcfb/number',
	'tgwcfb/checkbox',
	'tgwcfb/radio',
	'tgwcfb/select',
	'tgwcfb/multi-select',
	'tgwcfb/range',
	'tgwcfb/profile-picture',
	'tgwcfb/first-name',
	'tgwcfb/last-name',
	'tgwcfb/display-name',
	'tgwcfb/nickname',
	'tgwcfb/url',
	'tgwcfb/description',
	'tgwcfb/phone',
	'tgwcfb/secondary-email',
];

const WC_ACCOUNT_SETTINGS_URL =
	window._TGWCFB_SETTINGS_.adminURL + 'admin.php?page=wc-settings&tab=account';

export default () => {
	const [isTooltipVisible, setIsTooltipVisible] = useState(false);

	const showTooltip = () => {
		setIsTooltipVisible(true);
	};

	const hideTooltip = () => {
		setIsTooltipVisible(false);
	};

	const { forms, hasData, checkoutFields, checkoutFormId, formId } = useSelect(
		(select) => {
			// eslint-disable-next-line no-shadow
			const {
				getForms,
				getSettings,
				hasData,
				getCheckoutFormId,
				getCheckoutFields,
				getFormId,
			} = select('tgwcfb/settings');
			return {
				forms: getForms(),
				settings: getSettings(),
				hasData: hasData(),
				checkoutFields: getCheckoutFields(),
				checkoutFormId: getCheckoutFormId(),
				formId: getFormId(),
			};
		}
	);

	const { setFormId, setCheckoutFields, setCheckoutFormId } =
		useDispatch('tgwcfb/settings');

	const fields = useCallback(() => {
		if (0 === checkoutFormId) {
			return [[], []];
		}
		const content =
			(forms || []).filter((f) => f.ID === checkoutFormId)?.[0]?.post_content ||
			'';
		const blocks = parse(content).filter(
			(b) => b.blockName && CHECKOUT_BLOCKS.includes(b.blockName)
		);

		return [[...blocks], blocks.filter((b) => !!b.attrs?.required)];
	}, [checkoutFormId, hasData]);

	const [allFields, requiredFields] = fields();

	useEffect(() => {
		const currRequiredFields = checkoutFields.filter(
			(f) => !!f.attrs?.required
		);
		const currRequiredFieldsWithClientId = currRequiredFields.filter(
			(c) => !!c.attrs?.clientId
		);
		const currRequiredFieldsWithoutClientId = currRequiredFields.filter(
			(c) => !c.attrs?.clientId
		);
		const requiredFieldsWithClientId = requiredFields.filter(
			(r) => !!r.attrs?.clientId
		);
		const requiredFieldsWithoutClientId = requiredFields.filter(
			(r) => !r.attrs?.clientId
		);

		const fieldDiffWithClientId = requiredFieldsWithClientId.filter(
			(r) =>
				!currRequiredFieldsWithClientId.some(
					(c) => c.attrs.clientId === r.attrs.clientId
				)
		);
		const fieldDiffWithoutClientId = requiredFieldsWithoutClientId.filter(
			(r) =>
				!currRequiredFieldsWithoutClientId.some(
					(c) => c.blockName === r.blockName
				)
		);
		if (
			!_.isEmpty(fieldDiffWithClientId) ||
			!_.isEmpty(fieldDiffWithoutClientId)
		) {
			let temp = [
				...checkoutFields,
				...fieldDiffWithClientId,
				...fieldDiffWithoutClientId,
			];
			temp = _.sortBy(temp, (t) => {
				if (t.attrs?.clientId) {
					return allFields.findIndex(
						(f) => t.attrs.clientId === f.attrs?.clientId
					);
				}
				return allFields.findIndex((f) => t.blockName === f.blockName);
			});
			setCheckoutFields(temp);
		}
	}, [checkoutFields]);

	if (!hasData) {
		return <Spinner />;
	}

	return (
		<>
			<BaseControl className="tgwcfb-setting">
				<BaseControl.VisualLabel className="no-margin">
					{__(
						'Replace WooCommerce registration form',
						'registration-form-for-woocommerce'
					)}
					<WPTooltip
						text={
							<>
								{__(
									'Replace default WooCommerce registration form in My Account page. Allow registration in My Account page via ',
									'registration-form-for-woocommerce'
								)}
								<ExternalLink href={WC_ACCOUNT_SETTINGS_URL}>
									{__('WooCommerce > Settings > Accounts & Privacy')}
								</ExternalLink>
							</>
						}
						style={{
							background: 'white',
							maxWidth: '325px',
							color: 'black',
							border: '1px solid #ccc',
							padding: '16px',
							whiteSpace: 'normal',
							fontWeight: 'normal',
							fontSize: '14px',
							textAlign: 'left',
						}}
						delay="0"
					>
						<Button icon={'info-outline'} />
					</WPTooltip>
				</BaseControl.VisualLabel>
				<SelectControl
					value={formId}
					onChange={(v) => setFormId(parseInt(v))}
					options={[
						{ label: 'None', value: 0 },
						...(forms || []).map((form) => ({
							label:
								form?.post_title ||
								`(${__('no title', 'registration-form-for-woocommerce')})`,
							value: form?.ID,
						})),
					]}
					className="tgwcfb-setting"
				/>
			</BaseControl>
			<div
				style={{
					cursor: 'not-allowed',
					opacity: '0.5',
				}}
				onMouseEnter={showTooltip}
				onMouseLeave={hideTooltip}
			>
				<BaseControl className="tgwcfb-setting">
					<BaseControl.VisualLabel className="no-margin">
						{__('Checkout form', 'registration-form-for-woocommerce')}
						<Tooltip width={325} disabled>
							<Button icon={'info-outline'} />
						</Tooltip>
					</BaseControl.VisualLabel>
					<SelectControl
						options={[{ label: 'None', value: 0 }]}
						className="tgwcfb-setting"
						disabled
						style={{
							cursor: 'not-allowed',
							opacity: '0.5',
						}}
					/>
				</BaseControl>
				{isTooltipVisible && (
					<Popover position="top right top">
						<div
							style={{
								width: '200px',
								padding: '10px',
								backgroundColor: '#2d2e2d',
								color: 'white',
							}}
						>
							<span>
								{__(
									'You are currently using the free version of our plugin. Please upgrade to premium version to use this feature.',
									'registration-form-for-woocommerce'
								)}
							</span>
							<div
								style={{
									display: 'flex',
									justifyContent: 'end',
								}}
							>
								<Button
									style={{
										backgroundColor: 'white',
										color: 'blue',
										margin: '5px',
										border: 'none',
										outline: 'none',
										boxShadow: 'none',
									}}
								>
									<a
										style={{
											textDecoration: 'none',
											fontWeight: 'bold',
										}}
										href="https://woocommerce.com/products/registration-form-fields/"
										rel="noreferrer"
										target="_blank"
									>
										{__('Upgrade To Pro', 'registration-form-for-woocommerce')}
									</a>
								</Button>
							</div>
						</div>
					</Popover>
				)}
			</div>
		</>
	);
};
