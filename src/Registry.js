
var Registry = function() {
	var theId = require("./Utils").generateId(),
		store = {},
		that = this;
		
	this.id = function() {
		return theId;
	}	
		
};

module.exports = Registry;