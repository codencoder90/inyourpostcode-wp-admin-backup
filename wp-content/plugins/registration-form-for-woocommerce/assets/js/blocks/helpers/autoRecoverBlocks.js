import { createBlock } from '@wordpress/blocks';
import { dispatch, select, subscribe } from '@wordpress/data';

const subscribeOnceWhen = (predicate, callback) => {
	const unsubscribe = subscribe(() => {
		if (predicate()) {
			setTimeout(() => {
				callback();
			}, 500);
			unsubscribe();
		}
	});

	return unsubscribe;
};

const isBlocksLoaded = () => {
	const { getBlocks } = select('core/block-editor');
	return getBlocks().length > 0;
};

const recoverBlock = ({ name, attributes, innerBlocks }) =>
	createBlock(name, attributes, innerBlocks);

const getInvalidBlocks = (blocks) => {
	return blocks.reduce((invalidBlocks, block) => {
		if (!block.isValid && block.name.includes('tgwcfb')) {
			invalidBlocks.push(block);
		}
		if (block.innerBlocks.length > 0) {
			const invalidInnerBlocks = getInvalidBlocks(block.innerBlocks);
			if (invalidInnerBlocks.length > 0) {
				invalidBlocks = invalidBlocks.concat(invalidInnerBlocks);
			}
		}
		return invalidBlocks;
	}, []);
};

const recoverBlocks = () => {
	const { replaceBlock } = dispatch('core/block-editor');
	const blocks = select('core/block-editor').getBlocks();

	if (blocks?.length) {
		const invalidBlocks = getInvalidBlocks(blocks);

		if (invalidBlocks?.length) {
			invalidBlocks.forEach((oldBlock) => {
				const newBlock = recoverBlock(oldBlock);

				if (newBlock.isValid) {
					replaceBlock(oldBlock.clientId, newBlock);
				}
			});
		}
	}
};

const run = () => {
	return new Promise((resolve) => {
		subscribeOnceWhen(isBlocksLoaded, () => {
			recoverBlocks();
			setTimeout(() => resolve(), 200);
		});
	});
};

export default () => {
	run().then(() => {});
};
