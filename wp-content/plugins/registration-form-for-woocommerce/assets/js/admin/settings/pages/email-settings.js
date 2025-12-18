import { BaseControl, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Editor, Panel, InputControl } from '../components';

const EmailSettingsPanel = () => {
    // Select data from the store
    const {
        adminEmail,
        hasData,
    } = useSelect((select) => {
        const {
            getAdminEmail,
            hasData: hasDataSelector,
        } = select('tgwcfb/settings'); // Access the settings store

        return {
            adminEmail: getAdminEmail(),
            hasData: hasDataSelector(),
        };
    });

    // Dispatch functions to update the store
    const {
        setAdminEmail,
    } = useDispatch('tgwcfb/settings');

    // Show a spinner if data is not yet available
    if (!hasData) {
        return <Spinner />;
    }

    const EDITOR_DATA = [
        {
            value: adminEmail.default_content,
            label: __('Admin Email', 'registration-form-for-woocommerce'),
            help: __(
                'Email sent to the admin when a new user registers',
                'registration-form-for-woocommerce'
            ),
            to: adminEmail.to,
        },
    ];

	const editorHandler = (content) => {
		if (!adminEmail) return;

    	setAdminEmail({ ...adminEmail, default_content: content });
	}

	const ToEmailHandler = (e) => {
		setAdminEmail({ ...adminEmail, to: e.currentTarget.value })
	}

    return (
        <div className="components-base-control">
            {EDITOR_DATA.map(({ value, label, help, to }, idx) => (
                <Panel key={label} title={label} help={help}>
					<BaseControl
					className="tgwcfb-setting"
					label={__('Admin Email', 'registration-form-for-woocommerce')}
					id="tgwcfb-secret-admin-email-control"
				>
					<input
						className="components-text-control__input"
						id='tgwcfb-secret-admin-email'
                        label={__('To', 'registration-form-for-woocommerce')}
                        value={to}
                        type="email"
                        onChange={ToEmailHandler}
					/>
				</BaseControl>
				<BaseControl
					className="tgwcfb-setting"
					label={__('Email Content', 'registration-form-for-woocommerce')}
					id="tgwcfb-secret-admin-email-content-control"
				>
                    <Editor
					id={`tgwcfb-editor-${idx}`}
					value={value}
					onChange={(newContent) => {
						editorHandler(newContent);
					}}
				/>
				</BaseControl>

                </Panel>
            ))}
        </div>
    );
};

export default EmailSettingsPanel;
