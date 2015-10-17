'use strict';

var Registry = function() {
	var theId = require("./Utils").generateId(),
		store = {},
		that = this;
		
	this.id = function() {
		return theId;
	};
	
	this.register = function(logicalName, obj) {
		if (that.isRegistered(logicalName)) {
			throw new (require("./errors/AlreadyRegisteredError"))(logicalName, that.id());
		}
		
		store[logicalName] = obj;
	};
	
	this.deregister = function(logicalName) {
		if (!that.isRegistered(logicalName)) {
			throw new (require("./errors/NotRegisteredError"))(logicalName, that.id());
		}
		
		delete store[logicalName];
	};
	
	this.resolve = function(logicalName) {
		if (!that.isRegistered(logicalName)) {
			throw new (require("./errors/NotRegisteredError"))(logicalName, that.id());
		}
		
		return store[logicalName];
	};
	
	this.isRegistered = function(logicalName) {
		return logicalName in store;
	};
	
};

module.exports = Registry;