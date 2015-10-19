'use strict';

var sprintf = require("sprintf-js").sprintf;

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
	
	this.registeredNames = function() {
		return Object.keys(store);
	};
	
	this.destroy = function() {
		for (var itemName in store) {
			if (store.hasOwnProperty(itemName)) {
				var item = store[itemName];
				if (typeof item.destroy !== "undefined") {
					if (item.destroy.length === 0) {
						try {
							item.destroy();
						} catch (e) {
							console.error( sprintf(Registry.LOG_MESSAGES.DISPOSE_ERROR, itemName, e) );
						}
					}
				}
			}
		}
	
		store = {};
	};
	
};

Registry.LOG_MESSAGES = {
	DISPOSE_ERROR: "The item registered as '%s' threw an error while being destroyed. The error was: %s"
};


module.exports = Registry;