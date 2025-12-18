import { Button, Icon } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { render, renderToString, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

const addPreviewButton = () => {
	const writeInterstitialMessage = (targetDocument) => {
		let markup = renderToString(
			<div className="editor-post-preview-button__interstitial-message">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
					<path
						className="outer"
						d="M48 12c19.9 0 36 16.1 36 36S67.9 84 48 84 12 67.9 12 48s16.1-36 36-36"
						fill="none"
					/>
					<path
						className="inner"
						d="M69.5 46.4c0-3.9-1.4-6.7-2.6-8.8-1.6-2.6-3.1-4.9-3.1-7.5 0-2.9 2.2-5.7 5.4-5.7h.4C63.9 19.2 56.4 16 48 16c-11.2 0-21 5.7-26.7 14.4h2.1c3.3 0 8.5-.4 8.5-.4 1.7-.1 1.9 2.4.2 2.6 0 0-1.7.2-3.7.3L40 67.5l7-20.9L42 33c-1.7-.1-3.3-.3-3.3-.3-1.7-.1-1.5-2.7.2-2.6 0 0 5.3.4 8.4.4 3.3 0 8.5-.4 8.5-.4 1.7-.1 1.9 2.4.2 2.6 0 0-1.7.2-3.7.3l11.5 34.3 3.3-10.4c1.6-4.5 2.4-7.8 2.4-10.5zM16.1 48c0 12.6 7.3 23.5 18 28.7L18.8 35c-1.7 4-2.7 8.4-2.7 13zm32.5 2.8L39 78.6c2.9.8 5.9 1.3 9 1.3 3.7 0 7.3-.6 10.6-1.8-.1-.1-.2-.3-.2-.4l-9.8-26.9zM76.2 36c0 3.2-.6 6.9-2.4 11.4L64 75.6c9.5-5.5 15.9-15.8 15.9-27.6 0-5.5-1.4-10.8-3.9-15.3.1 1 .2 2.1.2 3.3z"
						fill="none"
					/>
				</svg>
				<p>{__('Generating preview…', 'registration-form-for-woocommerce')}</p>
			</div>
		);

		markup += `
		<style>
			body {
				margin: 0;
			}
			.editor-post-preview-button__interstitial-message {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				height: 100vh;
				width: 100vw;
			}
			@-webkit-keyframes paint {
				0% {
					stroke-dashoffset: 0;
				}
			}
			@-moz-keyframes paint {
				0% {
					stroke-dashoffset: 0;
				}
			}
			@-o-keyframes paint {
				0% {
					stroke-dashoffset: 0;
				}
			}
			@keyframes paint {
				0% {
					stroke-dashoffset: 0;
				}
			}
			.editor-post-preview-button__interstitial-message svg {
				width: 192px;
				height: 192px;
				stroke: #555d66;
				stroke-width: 0.75;
			}
			.editor-post-preview-button__interstitial-message svg .outer,
			.editor-post-preview-button__interstitial-message svg .inner {
				stroke-dasharray: 280;
				stroke-dashoffset: 280;
				-webkit-animation: paint 1.5s ease infinite alternate;
				-moz-animation: paint 1.5s ease infinite alternate;
				-o-animation: paint 1.5s ease infinite alternate;
				animation: paint 1.5s ease infinite alternate;
			}
			p {
				text-align: center;
				font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
			}
		</style>
	`;

		targetDocument.write(markup);
		targetDocument.title = __('Generating preview…');
		targetDocument.close();
	};

	const PreviewButton = () => {
		const { formId, isDraft, isAutosaveable, isSavable } = useSelect(
			(select) => {
				const {
					getCurrentPostId,
					getEditedPostAttribute,
					isEditedPostSaveable,
					isEditedPostAutosaveable,
				} = select('core/editor');
				return {
					formId: getCurrentPostId(),
					isDraft:
						['draft', 'auto-draft'].indexOf(
							getEditedPostAttribute('status')
						) !== -1,
					isSavable: isEditedPostSaveable(),
					isAutosaveable: isEditedPostAutosaveable(),
				};
			}
		);
		const getWindowTarget = `wp-preview-${formId}`;
		const previewWindow = useRef(null);

		const { autosave, savePost } = useDispatch('core/editor');
		const previewLink = addQueryArgs(_TGWCFB_EDITOR_.homeURL, {
			form_id: formId,
			tgwcfb_preview: true,
		});

		const openPreviewWindow = (event) => {
			event.preventDefault();

			if (!previewWindow.current || previewWindow.current.closed) {
				previewWindow.current = window.open('', getWindowTarget);
			}

			previewWindow.current.focus();

			if (!isAutosaveable) {
				previewWindow.current.location = previewLink;
				return;
			}

			writeInterstitialMessage(previewWindow.current.document);

			const save = isDraft
				? savePost({ isPreview: true })
				: autosave({ isPreview: true });

			save.then(() => {
				previewWindow.current.location = previewLink;
			});
		};
		return (
			<Button
				onClick={openPreviewWindow}
				target={getWindowTarget}
				href={previewLink}
				className="edit-post-header-preview__button-external"
				disabled={!isSavable}
			>
				{__('Preview in new tab', 'registration-form-for-woocommerce')}
				<Icon
					size={24}
					icon={
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
							<path d="M18.2 17c0 .7-.6 1.2-1.2 1.2H7c-.7 0-1.2-.6-1.2-1.2V7c0-.7.6-1.2 1.2-1.2h3.2V4.2H7C5.5 4.2 4.2 5.5 4.2 7v10c0 1.5 1.2 2.8 2.8 2.8h10c1.5 0 2.8-1.2 2.8-2.8v-3.6h-1.5V17zM14.9 3v1.5h3.7l-6.4 6.4 1.1 1.1 6.4-6.4v3.7h1.5V3h-6.3z" />
						</svg>
					}
				/>
			</Button>
		);
	};

	const renderPreviewButton = () => {
		const mutationObserver = new MutationObserver((records) => {
			for (const record of records) {
				const nodes = Array.from(record.addedNodes);
				if (
					nodes.some((node) =>
						node?.classList?.contains('edit-post-post-preview-dropdown')
					)
				) {
					const dropdownIndex = nodes.findIndex((node) =>
						node?.classList?.contains('edit-post-post-preview-dropdown')
					);
					if (-1 !== dropdownIndex) {
						let wrap = nodes[dropdownIndex]?.querySelector(
							'.edit-post-header-preview__grouping-external'
						);

						if (!wrap) {
							const temp = document.implementation.createHTMLDocument();
							temp.body.innerHTML = `<div class="components-menu-group"><div role="group"><div class="edit-post-header-preview__grouping-external"></div></div></div>`;
							nodes[dropdownIndex]
								?.querySelector('.components-dropdown-menu__menu')
								?.appendChild(temp.body.firstChild);
							wrap = nodes[dropdownIndex]?.querySelector(
								'.edit-post-header-preview__grouping-external'
							);
						}

						if (
							wrap &&
							!wrap?.querySelector('.edit-post-header-preview__button-external')
						) {
							render(<PreviewButton />, wrap);
						}
					}
					break;
				}
			}
		});

		mutationObserver.observe(window.document?.body, {
			childList: true,
			subtree: true,
		});
	};

	renderPreviewButton();
};

export default () => {
	domReady(addPreviewButton);
};
