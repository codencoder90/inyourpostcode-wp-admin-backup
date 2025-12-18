import { select, dispatch, subscribe } from '@wordpress/data';

const disabledBlocks = [
    'tgwcfb/phone',
    'tgwcfb/multi-select',
    'tgwcfb/date-picker',
    'tgwcfb/profile-picture',
    'tgwcfb/range',
    'tgwcfb/time-picker',
    'tgwcfb/user-roles',
	'tgwcfb/file-upload'
];

const isBlocksLoaded = () => {
    const { getBlocks } = select('core/block-editor');
    return getBlocks().length > 0;
};

const removeDisabledBlocks = () => {
    const { getBlocks } = select('core/block-editor');
    const blocks = getBlocks();

    blocks.forEach(block => {
        if (block && block.name && disabledBlocks.includes(block.name)) {

            if (block.clientId) {
                dispatch('core/block-editor').removeBlock(block.clientId);
            }

            if (Array.isArray(block.innerBlocks)) {
                block.innerBlocks.forEach(innerBlock => {
                    if (innerBlock && innerBlock.clientId && disabledBlocks.includes(innerBlock.name)) {
                        dispatch('core/block-editor').removeBlock(innerBlock.clientId);
                    }
                });
            }
        }
    });
};

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

const run = () => {
    return new Promise((resolve) => {
        subscribeOnceWhen(isBlocksLoaded, () => {
            removeDisabledBlocks();
            setTimeout(() => resolve(), 200);
        });
    });
};

// Run the script
export default () => {
    run().then(() => {
    });
};
