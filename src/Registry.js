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
	
	this.registeredNames = function() {
		return Object.keys(store);
	}
	
	this.destroy = function() {
		for (var serviceName in store) {
			if (store.hasOwnProperty(serviceName)) {
				var item = store[serviceName];
				if (typeof item.destroy !== "undefined") {
					if (item.destroy.length == 0) {
						try {
							item.destroy();
						} catch (e) {
							// log.error(ServiceRegistryClass.LOG_MESSAGES.DISPOSE_ERROR, serviceName, e);
						}
					}
				}
			}
		}
	
		store = {};
	}
	
};

module.exports = Registry;