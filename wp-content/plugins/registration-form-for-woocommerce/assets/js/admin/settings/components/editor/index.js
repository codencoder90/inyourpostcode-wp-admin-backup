import { useEffect } from '@wordpress/element';
import { debounce } from 'lodash';

export default ({ id, value, onChange }) => {
	useEffect(() => {
		const initialize = () => {
			wp.editor.initialize(id, {
				quicktags: true,
				tinymce: {
					wpautop: true,
					plugins:
						'charmap textcolor colorpicker compat3x directionality fullscreen hr image lists media paste tabfocus wordpress wpautoresize wpdialogs wpeditimage wpemoji wpgallery wplink wptextpattern wpview',
					toolbar1:
						'formatselect bold italic underline bullist numlist blockquote alignleft aligncenter alignright link wp_more media wp_add_media wp_adv',
					toolbar2:
						'forecolor strikethrough wp_code wp_page removeformat charmap outdent indent undo redo wp_help ',
					height: 150,
					setup: (editor) => {
						editor.on(
							'Paste Change input Undo Redo',
							debounce(() => {
								const content = editor.getContent();
								onChange(content);
							}, 250)
						);
					},
				},
			});
		};

		if (document.readyState === 'complete') {
			initialize();
		} else {
			document.addEventListener('DOMContentLoaded', initialize);
		}
		return () => {
			document.removeEventListener('DOMContentLoaded', initialize);
			wp.editor.remove(id);
		};
	}, []);

	return (
		<div className="tgwcfb-editor">
			<textarea
				className="tgwcfb-editor-body"
				key="editor"
				id={id}
				defaultValue={value}
			/>
		</div>
	);
};
