import { BaseControl, CheckboxControl } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

export default createHigherOrderComponent((Component) => {
	const userRoles = window?._TGWCFB_EDITOR_?.userRoles || {};
	return (props) => {
		if ('tgwcfb/user-roles' === props.name) {
			return (
				<>
					<BaseControl className="tgwcfb-control">
						<BaseControl.VisualLabel>
							{__('Select roles', 'registration-form-for-woocommerce')}
						</BaseControl.VisualLabel>
						<>
							<CheckboxControl
								label={__('Select all', 'registration-form-for-woocommerce')}
								checked={Object.keys(userRoles).every((k) =>
									Object.keys(props.attributes.roles).includes(k)
								)}
								onChange={(checked) => {
									if (checked) {
										props.setAttributes({ roles: { ...userRoles } });
									} else if (!checked) {
										props.setAttributes({ roles: {} });
									}
								}}
							/>
							{Object.entries(userRoles).map(([slug, name], idx) => (
								<CheckboxControl
									label={name}
									checked={!!props.attributes.roles?.[slug]}
									key={idx}
									onChange={(checked) => {
										let tempRoles = { ...props.attributes.roles };
										if (checked) {
											tempRoles = { ...tempRoles, [slug]: name };
										} else if (!checked) {
											delete tempRoles[slug];
										}
										props.setAttributes({ roles: { ...tempRoles } });
									}}
								/>
							))}
						</>
					</BaseControl>
					<Component {...props} />
				</>
			);
		}

		return <Component {...props} />;
	};
}, 'withRoleSelectInspectorControl');
