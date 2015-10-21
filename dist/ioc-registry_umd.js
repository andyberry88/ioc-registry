(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ioc_registry = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Registry = require("./src/Registry");

module.exports = new Registry();
},{"./src/Registry":6}],2:[function(require,module,exports){
(function(window) {
    var re = {
        not_string: /[^s]/,
        number: /[diefg]/,
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijosuxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[\+\-]/
    }

    function sprintf() {
        var key = arguments[0], cache = sprintf.cache
        if (!(cache[key] && cache.hasOwnProperty(key))) {
            cache[key] = sprintf.parse(key)
        }
        return sprintf.format.call(null, cache[key], arguments)
    }

    sprintf.format = function(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, node_type = "", arg, output = [], i, k, match, pad, pad_character, pad_length, is_positive = true, sign = ""
        for (i = 0; i < tree_length; i++) {
            node_type = get_type(parse_tree[i])
            if (node_type === "string") {
                output[output.length] = parse_tree[i]
            }
            else if (node_type === "array") {
                match = parse_tree[i] // convenience purposes only
                if (match[2]) { // keyword argument
                    arg = argv[cursor]
                    for (k = 0; k < match[2].length; k++) {
                        if (!arg.hasOwnProperty(match[2][k])) {
                            throw new Error(sprintf("[sprintf] property '%s' does not exist", match[2][k]))
                        }
                        arg = arg[match[2][k]]
                    }
                }
                else if (match[1]) { // positional argument (explicit)
                    arg = argv[match[1]]
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++]
                }

                if (get_type(arg) == "function") {
                    arg = arg()
                }

                if (re.not_string.test(match[8]) && re.not_json.test(match[8]) && (get_type(arg) != "number" && isNaN(arg))) {
                    throw new TypeError(sprintf("[sprintf] expecting number but found %s", get_type(arg)))
                }

                if (re.number.test(match[8])) {
                    is_positive = arg >= 0
                }

                switch (match[8]) {
                    case "b":
                        arg = arg.toString(2)
                    break
                    case "c":
                        arg = String.fromCharCode(arg)
                    break
                    case "d":
                    case "i":
                        arg = parseInt(arg, 10)
                    break
                    case "j":
                        arg = JSON.stringify(arg, null, match[6] ? parseInt(match[6]) : 0)
                    break
                    case "e":
                        arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential()
                    break
                    case "f":
                        arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg)
                    break
                    case "g":
                        arg = match[7] ? parseFloat(arg).toPrecision(match[7]) : parseFloat(arg)
                    break
                    case "o":
                        arg = arg.toString(8)
                    break
                    case "s":
                        arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg)
                    break
                    case "u":
                        arg = arg >>> 0
                    break
                    case "x":
                        arg = arg.toString(16)
                    break
                    case "X":
                        arg = arg.toString(16).toUpperCase()
                    break
                }
                if (re.json.test(match[8])) {
                    output[output.length] = arg
                }
                else {
                    if (re.number.test(match[8]) && (!is_positive || match[3])) {
                        sign = is_positive ? "+" : "-"
                        arg = arg.toString().replace(re.sign, "")
                    }
                    else {
                        sign = ""
                    }
                    pad_character = match[4] ? match[4] === "0" ? "0" : match[4].charAt(1) : " "
                    pad_length = match[6] - (sign + arg).length
                    pad = match[6] ? (pad_length > 0 ? str_repeat(pad_character, pad_length) : "") : ""
                    output[output.length] = match[5] ? sign + arg + pad : (pad_character === "0" ? sign + pad + arg : pad + sign + arg)
                }
            }
        }
        return output.join("")
    }

    sprintf.cache = {}

    sprintf.parse = function(fmt) {
        var _fmt = fmt, match = [], parse_tree = [], arg_names = 0
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = match[0]
            }
            else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = "%"
            }
            else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1
                    var field_list = [], replacement_field = match[2], field_match = []
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list[field_list.length] = field_match[1]
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== "") {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1]
                            }
                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1]
                            }
                            else {
                                throw new SyntaxError("[sprintf] failed to parse named argument key")
                            }
                        }
                    }
                    else {
                        throw new SyntaxError("[sprintf] failed to parse named argument key")
                    }
                    match[2] = field_list
                }
                else {
                    arg_names |= 2
                }
                if (arg_names === 3) {
                    throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported")
                }
                parse_tree[parse_tree.length] = match
            }
            else {
                throw new SyntaxError("[sprintf] unexpected placeholder")
            }
            _fmt = _fmt.substring(match[0].length)
        }
        return parse_tree
    }

    var vsprintf = function(fmt, argv, _argv) {
        _argv = (argv || []).slice(0)
        _argv.splice(0, 0, fmt)
        return sprintf.apply(null, _argv)
    }

    /**
     * helpers
     */
    function get_type(variable) {
        return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase()
    }

    function str_repeat(input, multiplier) {
        return Array(multiplier + 1).join(input)
    }

    /**
     * export to either browser or node.js
     */
    if (typeof exports !== "undefined") {
        exports.sprintf = sprintf
        exports.vsprintf = vsprintf
    }
    else {
        window.sprintf = sprintf
        window.vsprintf = vsprintf

        if (typeof define === "function" && define.amd) {
            define(function() {
                return {
                    sprintf: sprintf,
                    vsprintf: vsprintf
                }
            })
        }
    }
})(typeof window === "undefined" ? this : window);

},{}],3:[function(require,module,exports){
'use strict';

module.exports = {
	SUBCLASS_NOT_CONSTRUCTOR: 'Subclass was not a constructor.',
	SUPERCLASS_NOT_CONSTRUCTOR: 'Superclass was not a constructor when extending {0}.',
	PROTOTYPE_NOT_CLEAN: 'Prototype must be clean to extend another class. {1} has already been defined on the ' +
		'prototype of {0}.',
	NOT_CONSTRUCTOR: '{0} definition for {1} must be a constructor, was {2}.',
	DOES_NOT_IMPLEMENT: 'Class {0} does not implement the attributes \'{1}\' from protocol {2}.',
	PROPERTY_ALREADY_PRESENT: 'Could not copy {0} from {1} to {2} as it was already present.',
	NULL: '{0} for {1} must not be null or undefined.',
	ALREADY_PRESENT: 'Could not copy {0} from {1} to {2} as it was already present.',
	WRONG_TYPE: '{0} for {1} should have been of type {2}, was {3}.',
	TWO_CONSTRUCTORS: 'Two different constructors provided for {0}, use only one of the classDefinition argument ' +
		'and extraProperties.constructor.',
	BAD_INSTALL: 'Can only install to the global environment or a constructor, can\'t install to a {0}.'
};

},{}],4:[function(require,module,exports){
'use strict';

/**
* Interpolates a string with the arguments, used for error messages.
* @private
*/
function msg(str) {
	if (str == null) {
		return null;
	}

	for (var i = 1, len = arguments.length; i < len; ++i) {
		str = str.replace('{' + (i - 1) + '}', String(arguments[i]));
	}

	return str;
}

module.exports = msg;

},{}],5:[function(require,module,exports){
(function (global){
/*eslint no-proto:0, dot-notation:0*/
'use strict';

var ERROR_MESSAGES = require('./messages');
var msg = require('./msg');

// Main API ////////////////////////////////////////////////////////////////////////////////////

// only used for compatibility with shimmed, non es5 browsers.
var internalUseNames = ['__multiparents__', '__interfaces__', '__assignable_from_cache__', '__id__'];

/**
* Sets up the prototype chain for inheritance.
*
* <p>As well as setting up the prototype chain, this also copies so called 'class' definitions from the superclass
*  to the subclass and makes sure that constructor will return the correct thing.</p>
*
* @throws Error if the prototype has been modified before extend is called.
*
* @memberOf topiarist
* @param {?function} classDefinition The constructor of the subclass.
* @param {!function} superclass The constructor of the superclass.
* @param {?object} [extraProperties] An object of extra properties to add to the subclasses prototype.
*/
function extend(classDefinition, superclass, extraProperties) {
	var subclassName = className(classDefinition, 'Subclass');

	// Find the right classDefinition - either the one provided, a new one or the one from extraProperties.
	var extraPropertiesHasConstructor = typeof extraProperties !== 'undefined' &&
		extraProperties.hasOwnProperty('constructor') &&
		typeof extraProperties.constructor === 'function';

	if (classDefinition != null) {
		if (extraPropertiesHasConstructor && classDefinition !== extraProperties.constructor) {
			throw new Error(msg(ERROR_MESSAGES.TWO_CONSTRUCTORS, subclassName));
		}
	} else if (extraPropertiesHasConstructor) {
		classDefinition = extraProperties.constructor;
	} else {
		classDefinition = function() {
			superclass.apply(this, arguments);
		};
	}

	// check arguments
	assertArgumentOfType('function', classDefinition, ERROR_MESSAGES.SUBCLASS_NOT_CONSTRUCTOR);
	assertArgumentOfType('function', superclass, ERROR_MESSAGES.SUPERCLASS_NOT_CONSTRUCTOR, subclassName);
	assertNothingInObject(classDefinition.prototype, ERROR_MESSAGES.PROTOTYPE_NOT_CLEAN, subclassName);

	// copy class properties
	for (var staticPropertyName in superclass) {
		if (superclass.hasOwnProperty(staticPropertyName)) {
			// this is because we shouldn't copy nonenumerables, but removing enumerability isn't shimmable in ie8.
			// We need to make sure we don't inadvertently copy across any of the 'internal' fields we are using to
			//  keep track of things.
			if (internalUseNames.indexOf(staticPropertyName) >= 0) {
				continue;
			}

			classDefinition[staticPropertyName] = superclass[staticPropertyName];
		}
	}

	// create the superclass property on the subclass constructor
	Object.defineProperty(classDefinition, 'superclass', { enumerable: false, value: superclass });

	// create the prototype with a constructor function.
	classDefinition.prototype = Object.create(superclass.prototype, {
		'constructor': { enumerable: false,	value: classDefinition }
	});

	// copy everything from extra properties.
	if (extraProperties != null) {
		for (var property in extraProperties) {
			if (extraProperties.hasOwnProperty(property) && property !== 'constructor') {
				classDefinition.prototype[property] = extraProperties[property];
			}
		}
	}

	// this is purely to work around a bad ie8 shim, when ie8 is no longer needed it can be deleted.
	if (classDefinition.prototype.hasOwnProperty('__proto__')) {
		delete classDefinition.prototype['__proto__'];
	}

	clearAssignableCache(classDefinition, superclass);

	return classDefinition;
}

/**
* Mixes functionality in to a class.
*
* <p>Only functions are mixed in.</p>
*
* <p>Code in the mixin is sandboxed and only has access to a 'mixin instance' rather than the real instance.</p>
*
* @memberOf topiarist
* @param {function} target
* @param {function|Object} Mix
*/
function mixin(target, Mix) {
	assertArgumentOfType('function', target, ERROR_MESSAGES.NOT_CONSTRUCTOR, 'Target', 'mixin');

	Mix = toFunction(
		Mix,
		new TypeError(
			msg(
				ERROR_MESSAGES.WRONG_TYPE,
				'Mix',
				'mixin',
				'non-null object or function',
				Mix === null ? 'null' : typeof Mix
			)
		)
	);

	var targetPrototype = target.prototype, mixinProperties = Mix.prototype, resultingProperties = {};
	var mixins = nonenum(target, '__multiparents__', []);
	var myMixId = mixins.length;

	for (var property in mixinProperties) {
		// property might spuriously be 'constructor' if you are in ie8 and using a shim.
		if (typeof mixinProperties[property] === 'function' && property !== 'constructor') {
			if (property in targetPrototype === false) {
				resultingProperties[property] = getSandboxedFunction(myMixId, Mix, mixinProperties[property]);
			} else if (targetPrototype[property]['__original__'] !== mixinProperties[property]) {
				throw new Error(
					msg(
						ERROR_MESSAGES.PROPERTY_ALREADY_PRESENT,
						property,
						className(Mix, 'mixin'),
						className(target, 'target')
					)
				);
			}
		} // we only mixin functions
	}

	copy(resultingProperties, targetPrototype);
	mixins.push(Mix);

	clearAssignableCache(target, Mix);

	return target;
}

/**
* Provides multiple inheritance through copying.
*
* <p>This is discouraged; you should prefer to use aggregation first, single inheritance (extends) second, mixins
*  third and this as a last resort.</p>
*
* @memberOf topiarist
* @param {function} target the class that should receive the functionality.
* @param {function|Object} parent the parent that provides the functionality.
*/
function inherit(target, parent) {
	assertArgumentOfType('function', target, ERROR_MESSAGES.NOT_CONSTRUCTOR, 'Target', 'inherit');
	parent = toFunction(
		parent,
		new TypeError(
			msg(
				ERROR_MESSAGES.WRONG_TYPE,
				'Parent',
				'inherit',
				'non-null object or function',
				parent === null ? 'null' : typeof parent
			)
		)
	);

	if (classIsA(target, parent)) {
		return target;
	}

	var resultingProperties = {};
	var targetPrototype = target.prototype;
	for (var propertyName in parent.prototype) {
		// These properties should be nonenumerable in modern browsers, but shims might create them in ie8.
		if (propertyName === 'constructor' || propertyName === '__proto__' || propertyName === 'toString' || propertyName.match(/^Symbol\(__proto__\)/)) {
			continue;
		}

		var notInTarget = targetPrototype[propertyName] === undefined;
		var parentHasNewerImplementation = notInTarget || isOverriderOf(propertyName, parent, target);
		if (parentHasNewerImplementation) {
			resultingProperties[propertyName] = parent.prototype[propertyName];
		} else {
			var areTheSame = targetPrototype[propertyName] === parent.prototype[propertyName];
			var targetIsUpToDate = areTheSame || isOverriderOf(propertyName, target, parent);
			if (targetIsUpToDate === false) {
				// target is not up to date, but we can't bring it up to date.
				throw new Error(
					msg(
						ERROR_MESSAGES.ALREADY_PRESENT,
						propertyName,
						className(parent, 'parent'),
						className(target, 'target')
					)
				);
			}
			// otherwise we don't need to do anything.
		}
	}

	copy(resultingProperties, targetPrototype);
	var multiparents = nonenum(target, '__multiparents__', []);
	multiparents.push(parent);

	clearAssignableCache(target, parent);

	return target;
}

/**
* Declares that the provided class will implement the provided protocol.
*
* <p>This involves immediately updating an internal list of interfaces attached to the class definition,
* and after a <code>setTimeout(0)</code> verifying that it does in fact implement the protocol.</p>
*
* <p>It can be called before the implementations are provided, i.e. immediately after the constructor.</p>
*
* @throws Error if there are any attributes on the protocol that are not matched on the class definition.
*
* @memberOf topiarist
* @param {function} classDefinition A constructor that should create objects matching the protocol.
* @param {function} protocol A constructor representing an interface that the class should implement.
*/
function implement(classDefinition, protocol) {
	doImplement(classDefinition, protocol);

	setTimeout(function() {
		assertHasImplemented(classDefinition, protocol);
	}, 0);

	return classDefinition;
}

/**
* Declares that the provided class implements the provided protocol.
*
* <p>This involves checking that it does in fact implement the protocol and updating an internal list of
*  interfaces attached to the class definition.</p>
*
* <p>It should be called after implementations are provided, i.e. at the end of the class definition.</p>
*
* @throws Error if there are any attributes on the protocol that are not matched on the class definition.
*
* @memberOf topiarist
* @param {function} classDefinition A constructor that should create objects matching the protocol.
* @param {function} protocol A constructor representing an interface that the class should implement.
*/
function hasImplemented(classDefinition, protocol) {
	doImplement(classDefinition, protocol);
	assertHasImplemented(classDefinition, protocol);

	return classDefinition;
}

/** @private */
function doImplement(classDefinition, protocol) {
	assertArgumentOfType('function', classDefinition, ERROR_MESSAGES.NOT_CONSTRUCTOR, 'Class', 'hasImplemented');
	assertArgumentOfType('function', protocol, ERROR_MESSAGES.NOT_CONSTRUCTOR, 'Protocol', 'hasImplemented');

	var interfaces = nonenum(classDefinition, '__interfaces__', []);
	interfaces.push(protocol);

	clearAssignableCache(classDefinition, protocol);

	return classDefinition;
}

function assertHasImplemented(classDefinition, protocol) {
	var missing = missingAttributes(classDefinition, protocol);
	if (missing.length > 0) {
		throw new Error(
			msg(
				ERROR_MESSAGES.DOES_NOT_IMPLEMENT,
				className(classDefinition, 'provided'),
				missing.join('\', \''),
				className(protocol, 'provided')
			)
		);
	}
}

function fallbackIsAssignableFrom(classDefinition, parent) {
	if (classDefinition === parent || classDefinition.prototype instanceof parent) {
		return true;
	}
	var i, mixins = classDefinition['__multiparents__'] || [], interfaces = classDefinition['__interfaces__'] || [];

	// parent
	var superPrototype = (classDefinition.superclass && classDefinition.superclass.prototype) ||
		getPrototypeOf(classDefinition.prototype);

	if (
		superPrototype != null &&
		superPrototype !== classDefinition.prototype &&
		classIsA(superPrototype.constructor, parent)
	) {
		return true;
	}

	// mixin chain
	for (i = 0; i < mixins.length; ++i) {
		if (classIsA(mixins[i], parent)) {
			return true;
		}
	}

	// interfaces chain
	for (i = 0; i < interfaces.length; ++i) {
		if (classIsA(interfaces[i], parent)) {
			return true;
		}
	}

	return false;
}

/**
* Checks to see if a class is a descendant of another class / interface / mixin.
*
* <ul><li>A class is a descendant of another class if the other class is in its prototype chain.
* </li><li>A class is a descendant of an interface if it has called implement that class or
* any class that this class is a descendant of has called implement for that class.
* </li><li>A class is a descendant of a mixin if it has called mixin for that mixin or
* any class that this class is a descendant of has called mixin for that mixin.
* </li></ul>
*
* @memberOf topiarist
* @param {function} classDefinition the child class.
* @param {function} constructor the class to check if this class is a descendant of.
* @returns {boolean} true if the class is a descendant, false otherwise.
*/
function classIsA(classDefinition, constructor) {
	// sneaky edge case where we're checking against an object literal we've mixed in or against a prototype of
	//  something.
	if (typeof constructor === 'object' && constructor.hasOwnProperty('constructor')) {
		constructor = constructor.constructor;
	}

	assertArgumentOfType('function', classDefinition, ERROR_MESSAGES.NOT_CONSTRUCTOR, 'Class', 'classIsA');
	assertArgumentOfType('function', constructor, ERROR_MESSAGES.NOT_CONSTRUCTOR, 'Parent', 'classIsA');

	// This is just a caching wrapper around fallbackIsAssignableFrom.
	var cache = nonenum(classDefinition, '__assignable_from_cache__', {});
	var parentId = classId(constructor);
	if (cache[parentId] == null) {
		cache[parentId] = fallbackIsAssignableFrom(classDefinition, constructor);
	}

	return cache[parentId];
}

/**
* Checks to see if an instance is defined to be a child of a parent.
*
* @memberOf topiarist
* @param {Object} instance An instance object to check.
* @param {function} parent A potential parent (see classIsA).
* @returns {boolean} true if this instance has been constructed from something that is assignable from the parent
*  or is null, false otherwise.
*/
function isA(instance, parent) {
	if(instance == null) {
		assertArgumentNotNullOrUndefined(instance, ERROR_MESSAGES.NULL, 'Object', 'isA');
	}

	// sneaky edge case where we're checking against an object literal we've mixed in or against a prototype of
	//  something.
	if (typeof parent === 'object' && parent.hasOwnProperty('constructor')) {
		parent = parent.constructor;
	}

	if((instance.constructor === parent) || (instance instanceof parent)) {
		return true;
	}

	return classIsA(instance.constructor, parent);
}

/**
* Does duck typing to determine if an instance object implements a protocol.
* <p>The protocol may be either an adhoc protocol, in which case it is an object or it can be a formal protocol in
*  which case it's a function.</p>
*
* <p>In an adhoc protocol, you can use Number, Object, String and Boolean to indicate the type required on the
*  instance.</p>
*
* @memberOf topiarist
* @param {Object} instance the object to check.
* @param {function|Object} protocol the description of the properties that the object should have.
* @returns {boolean} true if all the properties on the protocol were on the instance and of the right type.
*/
function fulfills(instance, protocol) {
	assertArgumentNotNullOrUndefined(instance, ERROR_MESSAGES.NULL, 'Object', 'fulfills');
	assertArgumentNotNullOrUndefined(protocol, ERROR_MESSAGES.NULL, 'Protocol', 'fulfills');

	var protocolIsConstructor = typeof protocol === 'function';
	if (protocolIsConstructor && isA(instance, protocol)) {
		return true;
	}

	var requirement = protocolIsConstructor ? protocol.prototype : protocol;
	for (var item in requirement) {
		var type = typeof instance[item];
		var required = requirement[item];

		if (required === Number) {
			if (type !== 'number') {
				return false;
			}
		} else if (required === Object) {
			if (type !== 'object') {
				return false;
			}
		} else if (required === String) {
			if (type !== 'string') {
				return false;
			}
		} else if (required === Boolean) {
			if (type !== 'boolean') {
				return false;
			}
		} else {
			if (type !== typeof required) {
				return false;
			}
		}
	}

	return true;
}

/**
* Checks that a class provides a prototype that will fulfil a protocol.
*
* @memberOf topiarist
* @param {function} classDefinition
* @param {function|Object} protocol
* @returns {boolean}
*/
function classFulfills(classDefinition, protocol) {
	assertArgumentNotNullOrUndefined(classDefinition, ERROR_MESSAGES.NULL, 'Class', 'classFulfills');
	assertArgumentNotNullOrUndefined(protocol, ERROR_MESSAGES.NULL, 'Protocol', 'classFulfills');

	return fulfills(classDefinition.prototype, protocol);
}

// Auxillaries /////////////////////////////////////////////////////////////////////////////////

var slice = Array.prototype.slice;

function assertArgumentOfType(type, argument) {
	var actualType = typeof argument;
	if (actualType !== type) {
		var args = slice.call(arguments, 2);
		args.push(actualType);
		throw new TypeError(msg.apply(null, args));
	}
}

function assertNothingInObject(object) {
	for (var propertyName in object) {
		var args = slice.call(arguments, 1);
		args.push(propertyName);
		throw new Error(msg.apply(null, args));
	}
}

function assertArgumentNotNullOrUndefined(item) {
	if (item == null) {
		var args = slice.call(arguments, 1);
		throw new TypeError(msg.apply(null, args));
	}
}

function isOverriderOf(propertyName, sub, ancestor) {
	if (sub.prototype[propertyName] === ancestor.prototype[propertyName]) {
		return false;
	}

	var parents = getImmediateParents(sub);
	for (var i = 0; i < parents.length; ++i) {
		var parent = parents[i];
		if (parent.prototype[propertyName] === ancestor.prototype[propertyName]) {
			return true;
		}
		if (isOverriderOf(propertyName, parent, ancestor)) {
			return true;
		}
	}

	return false;
}

function getImmediateParents(sub) {
	var parents = (sub['__multiparents__'] || []).slice();
	var parentPrototype = (sub.superclass && sub.superclass.prototype) || getPrototypeOf(sub.prototype);
	if (parentPrototype !== null && parentPrototype.constructor !== null && parentPrototype.constructor !== sub) {
		parents.push(parentPrototype.constructor);
	}
	return parents;
}

/**
* Returns a nonenumerable property if it exists, or creates one and returns that if it does not.
* @private
*/
function nonenum(object, propertyName, defaultValue) {
	var value = object[propertyName];

	if (typeof value === 'undefined') {
		value = defaultValue;
		Object.defineProperty(object, propertyName, {
			enumerable: false,
			value: value
		});
	}

	return value;
}

/**
* Easier for us if we treat everything as functions with prototypes. This function makes plain objects behave that
*  way.
* @private
*/
function toFunction(obj, couldNotCastError) {
	if (obj == null) {
		throw couldNotCastError;
	}

	var result;
	if (typeof obj === 'object') {
		if (obj.hasOwnProperty('constructor')) {
			if (obj.constructor.prototype !== obj) {
				throw couldNotCastError;
			}
			result = obj.constructor;
		} else {
			var EmptyInitialiser = function() {};
			EmptyInitialiser.prototype = obj;
			Object.defineProperty(obj, 'constructor', {
				enumerable: false, value: EmptyInitialiser
			});
			result = EmptyInitialiser;
		}
	} else if (typeof obj === 'function') {
		result = obj;
	} else {
		throw couldNotCastError;
	}
	return result;
}

/** @private */
var currentId = 0;

/**
* Returns the nonenumerable property __id__ of an object if it exists, otherwise adds one and returns that.
* @private
*/
function classId(func) {
	var result = func['__id__'];
	if (result == null) {
		result = nonenum(func, '__id__', currentId++);
	}
	return result;
}

var nameFromToStringRegex = /^function\s?([^\s(]*)/;

/**
* Gets the classname of an object or function if it can.  Otherwise returns the provided default. Getting the name
*  of a function is not a standard feature, so while this will work in many cases, it should not be relied upon
*  except for informational messages (e.g. logging and Error messages).
* @private
*/
function className(object, defaultName) {
	if (object == null) {
		return defaultName;
	}

	var result = '';
	if (typeof object === 'function') {
		if (object.name) {
			result = object.name;
		} else {
			var match = object.toString().match(nameFromToStringRegex);
			if (match !== null) {
				result = match[1];
			}
		}
	} else if (typeof object.constructor === 'function') {
		result = className(object.constructor, defaultName);
	}

	return result || defaultName;
}

/**
* Returns an array of all of the properties on a protocol that are not on classdef or are of a different type on
*  classdef.
* @private
*/
function missingAttributes(classdef, protocol) {
	var result = [], obj = classdef.prototype, requirement = protocol.prototype;
	var item;
	for (item in requirement) {
		if (typeof obj[item] !== typeof requirement[item]) {
			result.push(item);
		}
	}

	for (item in protocol) {
		var protocolItemType = typeof protocol[item];
		if (protocol.hasOwnProperty(item) && protocolItemType === 'function' && typeof classdef[item] !== protocolItemType) {
			// If we're in ie8, our internal variables won't be nonenumerable, so we include a check for that here.
			if (internalUseNames.indexOf(item) < 0) {
				result.push(item + ' (class method)');
			}
		}
	}

	return result;
}

/**
* Copies all properties from the source to the target (including inherited properties) and optionally makes them
*  not enumerable.
* @private
*/
function copy(source, target, hidden) {
	for (var key in source) {
		Object.defineProperty(target, key, {
			enumerable: hidden !== true,
			configurable: true, writable: true,
			value: source[key]
		});
	}

	return target;
}

/**
* Turns a function into a method by using 'this' as the first argument.
* @private
*/
function makeMethod(func) {
	return function() {
		var args = [this].concat(slice.call(arguments));
		return func.apply(null, args);
	};
}

/**
* Mixin functions are sandboxed into their own instance.
* @private
*/
function getSandboxedFunction(myMixId, Mix, func) {
	var result = function() {
		var mixInstances = nonenum(this, '__multiparentInstances__', []);
		var mixInstance = mixInstances[myMixId];
		if (mixInstance == null) {
			if (typeof Mix === 'function') {
				mixInstance = new Mix();
			} else {
				mixInstance = Object.create(Mix);
			}
			// could add a nonenum pointer to __this__ or something if we wanted to allow escape from the sandbox.
			mixInstances[myMixId] = mixInstance;
		}
		return func.apply(mixInstance, arguments);
	};

	nonenum(result, '__original__', func);
	nonenum(result, '__source__', Mix);

	return result;
}

/**
* Clears the `__assignable_from_cache__` cache for target and parent.
* @private
*/
function clearAssignableCache(target, parent) {
	if ('__assignable_from_cache__' in target) {
		delete target['__assignable_from_cache__'][classId(parent)];
	}
}


function getPrototypeOf(obj) {
	if (Object.getPrototypeOf) {
		var proto = Object.getPrototypeOf(obj);

		// to avoid bad shams...
		if (proto !== obj) {
			return proto;
		}
	}

	// this is what most shams do, but sometimes it's wrong.
	if (obj.constructor && obj.constructor.prototype && obj.constructor.prototype !== obj) {
		return obj.constructor.prototype;
	}

	// this works only if we've been kind enough to supply a superclass property (which we do when we extend classes)
	if (obj.constructor && obj.constructor.superclass) {
		return obj.constructor.superclass.prototype;
	}

	// can't find a good prototype.
	return null;
}


// Exporting ///////////////////////////////////////////////////////////////////////////////////

var methods = {
	'extend': extend, 'inherit': inherit, 'mixin': mixin, 'implement': implement,
	'hasImplemented': hasImplemented, 'classIsA': classIsA, 'isAssignableFrom': classIsA,
	'isA': isA, 'fulfills': fulfills, 'classFulfills': classFulfills
};

var exporting = {
	'exportTo': function(to) {
		copy(methods, to || global, true);
	},
	'install': function(target) {
		if (arguments.length > 0 && typeof target !== 'function') {
			throw new Error(msg(ERROR_MESSAGES.BAD_INSTALL, typeof target));
		}
		var isGlobalInstall = arguments.length < 1;

		copy({
			isA: makeMethod(methods.isA),
			fulfills: makeMethod(methods.fulfills)
		}, isGlobalInstall ? Object.prototype : target.prototype, true);

		var itemsToInstallToFunction = {
			'classIsA': makeMethod(methods.classIsA),
			'implements': makeMethod(methods.implement),
			'hasImplemented': makeMethod(methods.hasImplemented),
			'fulfills': makeMethod(methods.classFulfills),
			// we can 'extend' a superclass to make a subclass.
			'extend': function(properties) {
				if (typeof properties === 'function') {
					return extend(properties, this);
				}
				return extend(null, this, properties);
			},
			'mixin': makeMethod(methods.mixin),
			'inherits': makeMethod(methods.inherit)
		};
		if (isGlobalInstall) {
			// no point in having subclass.extends unless it's global.
			itemsToInstallToFunction['extends'] = makeMethod(methods.extend);
		}

		copy(itemsToInstallToFunction, isGlobalInstall ? Function.prototype : target, isGlobalInstall);

		return target;
	}
};
exporting['export'] = exporting.exportTo; // for backwards compatibility

methods.Base = exporting.install(function BaseClass() {});

copy(methods, exporting);

module.exports = exporting;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./messages":3,"./msg":4}],6:[function(require,module,exports){
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
},{"./Utils":7,"./errors/AlreadyRegisteredError":8,"./errors/NotRegisteredError":9,"sprintf-js":2}],7:[function(require,module,exports){
'use strict';

var utils = module.exports = {
	
	generateId: function() {
		return (utils.random(0, 9999999999)).toString(36);
	},
	
	random : function(low, high) {
		return Math.floor(Math.random() * (high - low + 1) + low);
	}
	
};
},{}],8:[function(require,module,exports){
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
},{"sprintf-js":2,"topiarist":5}],9:[function(require,module,exports){
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
},{"sprintf-js":2,"topiarist":5}]},{},[1])(1)
});