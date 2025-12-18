import { useMemo, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { MediaUpload } from '@wordpress/media-utils';

import { Button } from '@barn2plugins/components';
import { useQuill } from 'react-quilljs';
import { ImageActions } from '@xeger/quill-image-actions';
import { ImageFormats } from '@xeger/quill-image-formats';

const RichText = ( { value, onChange = () => {} } ) => {
	const modules = useMemo( () => {
		return {
			imageActions: {},
			imageFormats: {},
			toolbar: {
				container: '#toolbar',
			},
		};
	} );

	const formats = useMemo( () => [
		'header',
		'size',
		'color',
		'bold',
		'italic',
		'underline',
		'strike',
		'blockquote',
		'list',
		'bullet',
		'indent',
		'link',
		'image',
		'video',
		'align',
		'width',
		'height',
		'float',
	] );

	const { quill, quillRef, Quill } = useQuill( {
		modules,
		formats,
	} );

	if ( Quill && ! quill ) {
		Quill.register( 'modules/imageActions', ImageActions );
		Quill.register( 'modules/imageFormats', ImageFormats );
	}

	useEffect( () => {
		if ( quill ) {
			quill.on( 'text-change', ( delta, oldContents ) => {
				onChange( quill.root.innerHTML );
			} );
		}
	}, [ quill, Quill ] );

	useEffect( () => {
		if ( quill ) {
			quill.disable();
			quill.clipboard.dangerouslyPasteHTML( value );
			quill.enable();
		}
	}, [ quill ] );

	const handleSelectMedia = ( media ) => {
		const range = quill.getSelection( true );
		quill.insertEmbed( range?.index ?? 0, 'image', media.url );
	};

	return (
		<div style={ { height: 'fit-content' } }>
			<div id="toolbar">
				<span className="ql-formats">
					<select className="ql-header" defaultValue={ '' } onChange={ ( e ) => e.persist() }>
						<option value="1" />
						<option value="2" />
						<option value="3" />
						<option value="4" />
						<option value="5" />
						<option value="6" />
						<option value="" />
					</select>
				</span>
				<span className="ql-formats">
					<button className="ql-bold" />
					<button className="ql-italic" />
					<button className="ql-underline" />
					<button className="ql-strike" />
					<button className="ql-blockquote" />
				</span>
				<span className="ql-formats">
					<button className="ql-list" value="ordered" />
					<button className="ql-list" value="bullet" />
					<button className="ql-indent" value="-1" />
					<button className="ql-indent" value="+1" />
				</span>
				<span className="ql-formats">
					<button className="ql-align" />
					<button className="ql-align" value="center" />
					<button className="ql-align" value="right" />
					<button className="ql-align" value="justify" />
				</span>
				<span className="ql-formats">
					<select className="ql-color" />
				</span>
				<span className="ql-formats">
					<button className="ql-link" />
					<button className="ql-clean" />
				</span>

				<span className="ql-formats">
					<MediaUpload
						onSelect={ ( media ) => {
							handleSelectMedia( media );
						} }
						allowedTypes={ [ 'image' ] }
						render={ ( { open } ) => (
							<div className="editor-post-featured-image__container">
								<Button
									className={ 'wpo-rich-text-add-media' }
									onClick={ open }
									aria-label={ __( 'Add image', 'woocommerce-product-options' ) }
								>
									{ __( 'Add image', 'woocommerce-product-options' ) }
								</Button>
							</div>
						) }
					/>
				</span>
			</div>

			<div ref={ quillRef } />
		</div>
	);
};

export default RichText;
