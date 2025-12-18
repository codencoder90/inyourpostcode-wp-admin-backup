import { dispatch, select, subscribe } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';

export default () => {
	const unsubscribe = subscribe(() => {
		const isReady = select('core/editor').__unstableIsEditorReady();

		if (!isReady) {
			return;
		}

		if (
			parseInt(_TGWCFB_EDITOR_.defaultFormID) ===
			select('core/editor')?.getCurrentPostId()
		) {
			dispatch('core/edit-post').removeEditorPanel('post-status');
		}

		unsubscribe();
	});

	domReady(() => {
		const style = document.createElement('style');
		style.innerHTML = `
		.tgwcfb_form_${_TGWCFB_EDITOR_.defaultFormID} .edit-post-visual-editor__post-title-wrapper,
		.tgwcfb_form_${_TGWCFB_EDITOR_.defaultFormID} .editor-post-switch-to-draft {
			display: none;
		}
		`;

		document.head?.appendChild(style);
	});
};
