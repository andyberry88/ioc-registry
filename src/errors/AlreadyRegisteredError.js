'use strict';

var topiarist = require('topiarist');
var sprintf = require("sprintf-js").sprintf;

function AlreadyRegisteredError(logicalName, id) {
	this.name = 'AlreadyRegisteredError';
	this.message = sprintf("The logical name '%s' has already been used to register an item with the registry with id '%s'.", logicalName, id);
	this.stack = (new Error()).stack;
}
topiarist.extend(AlreadyRegisteredError, Error);

module.exports = AlreadyRegisteredError;