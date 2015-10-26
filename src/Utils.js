'use strict';

var utils = module.exports = {
	
	generateId: function() {
		return (utils.random(0, 9999999999)).toString(36);
	},
	
	random : function(low, high) {
		return Math.floor(Math.random() * (high - low + 1) + low);
	},
	
	assertIsType : function(arg, argName, theType) {
		if (typeof arg !== theType) {
			throw new Error("Expected the '"+argName+"' argument to be a String");
		}
	},
	
	shouldCallDestroyOnItem : function(item) {
		return typeof item === "object" && typeof item.destroy === "function" && item.destroy.length === 0;
	}
};
