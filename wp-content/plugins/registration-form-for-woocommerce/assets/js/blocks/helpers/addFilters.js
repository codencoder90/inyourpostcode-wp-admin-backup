import { addFilter } from '@wordpress/hooks';

import {
	withFieldWidthClassName,
	withNoPlaceholderInspectorControl,
	withNumberAttributeInspectorControl,
	withProfilePictureInspectorControl,
	withRoleSelectInspectorControl,
	withShowInOrderEmailInspectorControl,
	withReadOnlyInspectorControl,
} from '../hoc';

export default () => {
	addFilter(
		'editor.BlockListBlock',
		'tgwcfb/add-field-width-classname',
		withFieldWidthClassName
	);
	addFilter(
		'tgwcfb.inspectorControls.placeholder',
		'tgwcfb/remove-placeholder-control',
		withNoPlaceholderInspectorControl
	);
	addFilter(
		'tgwcfb.inspectorControls.label',
		'tgwcfb/add-user-select-control',
		withRoleSelectInspectorControl
	);
	addFilter(
		'tgwcfb.inspectorControls.fieldWidth',
		'tgwcfb/add-number-attribute-control',
		withNumberAttributeInspectorControl
	);
	addFilter(
		'tgwcfb.inspectorControls.fieldWidth',
		'tgwcfb/add-show-in-order-control',
		withShowInOrderEmailInspectorControl
	);
	addFilter(
		'tgwcfb.inspectorControls.fieldWidth',
		'tgwcfb/add-profile-picture-inspector-controls',
		withProfilePictureInspectorControl
	);
	addFilter(
		'tgwcfb.inspectorControls.required',
		'tgwcfb/add-read-only-control',
		withReadOnlyInspectorControl
	);
};
