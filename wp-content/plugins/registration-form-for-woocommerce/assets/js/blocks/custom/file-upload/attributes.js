export default {
	clientId: {
		type: String,
	},
	label: {
		type: String,
		default: "",
	},
	fieldWidth: {
		type: Number,
		default: 100,
	},
	description: {
		type: String,
		default: "",
	},
	placeholder: {
		type: String,
		default: "",
	},
	required: {
		type: Boolean,
		default: false,
	},
	hideLabel: {
		type: Boolean,
		default: false,
	},
	hasDescription: {
		type: Boolean,
		default: false,
	},
	className: {
		type: String,
		default: "",
	},
	showInOrder: {
		type: Boolean,
		default: false,
	},
	fileTypes: {
		type: Array,
		default: ["application/pdf", "image/jpeg", "image/gif", "image/png"],
	},
	maxFileSize: {
		type: Number,
		default: 1024,
	},
	uploadLimit: {
		type: Number,
		default: 1,
	},
	readOnly: {
		type: Boolean,
		default: false,
	},
};
