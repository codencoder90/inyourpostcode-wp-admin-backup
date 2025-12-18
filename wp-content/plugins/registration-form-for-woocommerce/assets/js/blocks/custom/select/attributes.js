export default {
	clientId: {
		type: String,
	},
	label: {
		type: String,
		default: '',
	},
	fieldWidth: {
		type: Number,
		default: 100,
	},
	description: {
		type: String,
		default: '',
	},
	readOnly: {
		type: Boolean,
		default: false,
	},
	placeholder: {
		type: String,
		default: '',
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
		default: '',
	},
	showInOrder: {
		type: Boolean,
		default: false,
	},
	options: {
		type: Array,
		default: [],
	},
	edited: {
		type: Boolean,
		default: false,
	},
};
