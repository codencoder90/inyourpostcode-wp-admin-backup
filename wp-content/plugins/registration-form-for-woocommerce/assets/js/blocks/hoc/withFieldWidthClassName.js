import { createHigherOrderComponent } from '@wordpress/compose';

export default createHigherOrderComponent((BlockListBlock) => {
	return (props) => {
		return (
			<BlockListBlock
				{...props}
				className={'field-width-' + (props.attributes?.fieldWidth || 100)}
			/>
		);
	};
}, 'withFieldWidthClassName');
