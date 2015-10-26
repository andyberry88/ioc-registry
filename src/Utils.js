'use strict';

var utils = module.exports = {
	
	generateId: function() {
		return (utils.random(0, 9999999999)).toString(36);
	},
	
	random : function(low, high) {
		return Math.floor(Math.random() * (high - low + 1) + low);
	},
	
	shouldCallDestroyOnItem : function(item) {
		return typeof item === "object" && typeof item.destroy === "function" && item.destroy.length === 0;
	}
};
