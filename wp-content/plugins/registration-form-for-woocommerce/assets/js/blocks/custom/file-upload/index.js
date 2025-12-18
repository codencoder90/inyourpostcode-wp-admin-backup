import { __ } from '@wordpress/i18n';
import { registerBlockType } from '@wordpress/blocks';
import attributes from './attributes';
import edit from './edit';
import save from './save';
import { Icon } from '@wordpress/components';

export default () => {
	registerBlockType( 'tgwcfb/file-upload', {
		title: __( 'File Upload', 'registration-form-for-woocommerce' ),
		description: __( 'File Upload field for WC registration form', 'registration-form-for-woocommerce' ),
		category: 'tgwcfb/custom',
		keywords: [ __( 'File Upload', 'registration-form-for-woocommerce' ) ],
		icon: <Icon size={ 24 } icon={ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<path d="m14.742 3.361 4.02 4.217h-4.02V3.36ZM10.735 14.02a.59.59 0 0 1-.894-.772l1.711-1.982a.593.593 0 0 1 .907.015l1.689 1.867a.59.59 0 0 1-.874.79l-.683-.754v2.807a.594.594 0 0 1-1.01.418.593.593 0 0 1-.174-.418v-2.75l-.672.779ZM7.4 16.517a.592.592 0 1 1 1.184 0v1.355h6.834v-1.355a.591.591 0 1 1 1.182 0v1.947a.592.592 0 0 1-.592.592H7.992a.592.592 0 0 1-.592-.592v-1.947Zm13.598-8.398c.027-.104-.214-.376-.487-.647L14.59 1.247A.66.66 0 0 0 14.081 1H4.203A1.203 1.203 0 0 0 3 2.203v19.916a1.202 1.202 0 0 0 1.203 1.202h15.592a1.201 1.201 0 0 0 1.203-1.202v-14Zm-1.344.803v13.055H4.344V2.339H13.4v5.909a.673.673 0 0 0 .682.674h5.573Z"/>
		  </svg>
		   } />,
		attributes,
		supports: {
			className: false,
			customClassName: false,
			multiple: false,
		},
		edit,
		save,
	} );
};
