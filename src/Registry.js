'use strict';

var Registry = function() {
	var theId = require("./Utils").generateId(),
		store = {},
		that = this;
		
	this.id = function() {
		return theId;
	};
	
	this.register = function(logicalName, obj) {
		
	};
	
	this.resolve = function(logicalName) {
		
	};
	
	this.MESSAGES = {
		
	};
	
};

module.exports = Registry;