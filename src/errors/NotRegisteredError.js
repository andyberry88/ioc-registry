'use strict';

var topiarist = require('topiarist');
var sprintf = require("sprintf-js").sprintf;

function NotRegisteredError(logicalName, id) {
	this.name = 'NotRegisteredError';
	this.message = sprintf("Nothing with the logical name '%s' has been registered against the registry with id '%s'.", logicalName, id);
	this.stack = (new Error()).stack;
}
topiarist.extend(NotRegisteredError, Error);

module.exports = NotRegisteredError;