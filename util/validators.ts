exports.validateState = (text) => {
	if (text.match(/^[a-z ]+$/i)) return true;
	return "Enter a valid state";
};

exports.validateDistrict = (text) => {
	if (text.match(/^[a-z ]+$/i)) return true;
	return "Enter a valid district";
};

exports.validateNumber = (number) => {
	if (number.match(/^\d+$/)) return true;
	return "Enter a valid age";
};