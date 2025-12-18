import $ from 'jquery';

(() => {
	const dataURIToBlob = (dataURI) => {
		let byteString;

		if (dataURI.split(',')[0].indexOf('base64') >= 0) {
			byteString = atob(dataURI.split(',')[1]);
		} else {
			byteString = decodeURI(dataURI.split(',')[1]);
		}

		// separate out the mime component
		const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

		// write the bytes of the string to a typed array
		const ia = new Uint8Array(byteString.length);

		for (let i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}

		return new Blob([ia], { type: mimeString });
	};

	const cropImage = (fileInstance) => {
		let size;

		const cropContainer = $('#crop_container');

		cropContainer.Jcrop({
			aspectRatio: 1,
			onSelect: (c) => {
				size = { x: c.x, y: c.y, w: c.w, h: c.h };
			},
			setSelect: [100, 100, 50, 50],
		});

		$('.swal2-confirm').on('click', function () {
			const croppedImageSize = {
				x: size.x,
				y: size.y,
				w: size.w,
				h: size.h,
				holder_width: cropContainer.css('width'),
				holder_height: cropContainer.css('height'),
			};
			$('.cropped_image_size').val(JSON.stringify(croppedImageSize));
			sendFile(fileInstance);
		});
	};

	const sendFile = (node) => {
		const { ajaxURL, nonce } = window._TGWCFB_FRONTEND_;
		const url = `${ajaxURL}?action=upload_profile_picture&security=${nonce}`;
		const formData = new FormData();
		const image = $('#crop_container').attr('src');
		const input = $('input[name="profile_picture"]');

		if (node?.[0]?.files?.[0]) {
			formData.append('file', node[0].files[0]);
		} else {
			const blob = dataURIToBlob(image);
			const fileOfBlob = new File([blob], 'snapshot.jpg');
			formData.append('file', fileOfBlob);
		}

		formData.append('cropped_image', $('.cropped_image_size').val());

		formData.append('valid_extension', input.attr('accept'));

		if (input.attr('size')) {
			formData.append('max_uploaded_size', input.attr('size'));
		}

		const uploadNode = node
			.closest('.tgwcfb-profile-picture-upload-field')
			.find('.tgwcfb-upload-profile-picture');
		const uploadNodeValue = uploadNode.text();

		$.ajax({
			url,
			data: formData,
			type: 'POST',
			processData: false,
			contentType: false,
			beforeSend: () => {
				uploadNode.text(_TGWCFB_FRONTEND_.uploading);
			},
			complete: (res) => {
				const { success, data } = JSON.parse(res.responseText);
				const closest = node.closest('.tgwcfb-profile-picture-upload-field');

				if (success) {
					const attachmentID = data?.attachmentId || 0;
					const profilePictureURL = data?.profilePictureURL || '';
					closest
						.find('.profile-picture-preview')
						.attr('src', profilePictureURL);

					if (attachmentID > 0) {
						closest
							.find('.tgwcfb-profile-picture-input')
							.val(profilePictureURL);
					}

					closest.find('.tgwcfb-remove-profile-picture').show();

					closest.find('.tgwcfb-upload-profile-picture').hide();

					closest.find('.tgwcfb-profile-picture-upload-error').remove();
				} else {
					closest.append(
						`<span style="display: block" class="tgwcfb-profile-picture-upload-error">${
							data?.message || ''
						}</span>`
					);
				}

				uploadNode.text(uploadNodeValue);
			},
		});
	};

	$('body').on(
		'change',
		'.tgwcfb-profile-picture-upload-node input[type="file"]',
		function () {
			if (this?.files?.[0]) {
				const reader = new FileReader();
				reader.onload = (e) => {
					$('.img').attr('src', e.target.result);
				};

				reader.readAsDataURL(this.files[0]);

				// eslint-disable-next-line no-undef
				Swal.fire({
					title: _TGWCFB_FRONTEND_.cropTitle,
					html: `<img id="crop_container" src="#" alt="your image" class="img"/><input type="hidden" name="cropped_image" class="cropped_image_size"/>`,
					confirmButtonText: _TGWCFB_FRONTEND_.cropBtn,
					allowOutsideClick: false,
					showCancelButton: true,
					cancelButtonText: _TGWCFB_FRONTEND_.cancelBtn,
					customClass: {
						container: 'tgwcfb-swal2-container',
					},
				});

				$('.swal2-cancel').on('click', () => {
					$('.tgwcfb-profile-picture-upload-field')
						.find('input[type="file"]')
						.val('');
				});
				cropImage($(this));
			}
		}
	);

	$(document).on('click', '.tgwcfb-upload-profile-picture', (e) => {
		e.preventDefault();
		$(e.currentTarget)
			.closest('.tgwcfb-profile-picture-upload-field')
			.find('input[type="file"]')
			.trigger('click');
	});

	$(document).ready(function () {
		const body = $('body');
		if (
			body.hasClass('logged-in') &&
			body.hasClass('woocommerce-edit-account')
		) {
			const profilePicField = $('.tgwcfb-profile-picture-upload-field ');
			if (!profilePicField?.length) return;
			profilePicField
				.find('[name="profile_picture_url"]')
				.val(profilePicField.find('.profile-picture-preview').attr('src'));
			profilePicField
				.find('.tgwcfb-remove-profile-picture')
				.show()
				.siblings('.tgwcfb-upload-profile-picture')
				.css('margin-right', '20px');
		}
	});

	$(document).on('click', '.tgwcfb-remove-profile-picture', (e) => {
		e.preventDefault();
		const self = $(e.currentTarget);
		const parent = self.closest('.tgwcfb-profile-picture-upload-field');

		parent.find('.tgwcfb-profile-picture-input').val('');
		parent
			.find('input[type="file"][name="profile_picture"]')
			.val('')
			.off('click');
		parent.find('.tgwcfb-profile-picture-upload-error').remove();
		parent
			.find('.profile-picture-preview')
			.attr('src', 'https://secure.gravatar.com/avatar/?s=96&d=mm&r=g');
		self.hide();
		parent.find('.tgwcfb-upload-profile-picture').show();
	});
})();
