import { Button, ClipboardButton } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { subscribe, useDispatch, useSelect } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { render } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

const addShortcodeToolbar = () => {
	let timeout = null;

	const Shortcode = () => {
		const { formId } = useSelect((select) => ({
			formId: select('core/editor')?.getCurrentPostId(),
		}));
		const { createNotice } = useDispatch('core/notices');

		const CopyButton = ({ text, onCopy, children }) => {
			const ref = useCopyToClipboard(text, onCopy);
			return (
				<Button variant="primary" ref={ref}>
					{children}
				</Button>
			);
		};

		const onCopy = () => {
			createNotice(
				'success',
				sprintf(
					/* Translators: Form ID */
					__(
						'Copied "[tgwcfb_registration_form id="%d"]" to clipboard',
						'custom-registration-from-fields-builder-for-woocommerce'
					),
					formId || 0
				),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);
		};

		const CopyIcon = () => (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="14"
				height="16"
				viewBox="0 0 14 16"
			>
				<path
					fillRule="evenodd"
					d="M2 13h4v1H2v-1zm5-6H2v1h5V7zm2 3V8l-3 3 3 3v-2h5v-2H9zM4.5 9H2v1h2.5V9zM2 12h2.5v-1H2v1zm9 1h1v2c-.02.28-.11.52-.3.7-.19.18-.42.28-.7.3H1c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h3c0-1.11.89-2 2-2 1.11 0 2 .89 2 2h3c.55 0 1 .45 1 1v5h-1V6H1v9h10v-2zM2 5h8c0-.55-.45-1-1-1H8c-.55 0-1-.45-1-1s-.45-1-1-1-1 .45-1 1-.45 1-1 1H3c-.55 0-1 .45-1 1z"
				></path>
			</svg>
		);

		return (
			<>
				<input
					style={{ textAlign: 'center' }}
					size={35}
					type="text"
					readOnly
					onFocus={(e) => e.currentTarget.select()}
					value={`[tgwcfb_registration_form id="${formId || 0}"]`}
				/>
				{wp.compose?.useCopyToClipboard ? (
					<CopyButton
						text={`[tgwcfb_registration_form id="${formId || 0}"]`}
						onCopy={onCopy}
					>
						<CopyIcon />
					</CopyButton>
				) : (
					<ClipboardButton
						variant="primary"
						text={`[tgwcfb_registration_form id="${formId || 0}"]`}
						onCopy={onCopy}
						className="is-primary"
					>
						<CopyIcon />
					</ClipboardButton>
				)}
			</>
		);
	};

	const unsubscribe = subscribe(() => {
		const headerSettings = window.document.querySelector(
			'.edit-post-header__settings'
		);

		if (!headerSettings) {
			return;
		}

		const shortcodeWrapper = document.createElement('div');
		shortcodeWrapper.classList.add('tgwcfb-shortcode-wrapper');

		if (!headerSettings.querySelector('.tgwcfb-shortcode-wrapper')) {
			render(<Shortcode />, shortcodeWrapper);
			headerSettings.prepend(shortcodeWrapper);
		}

		if (timeout) {
			clearTimeout(timeout);
		}

		timeout = setTimeout(() => {
			if (window.document.querySelector('.tgwcfb-shortcode-wrapper')) {
				unsubscribe();
			}
		}, 0);
	});
};

export default () => {
	domReady(addShortcodeToolbar);
};
