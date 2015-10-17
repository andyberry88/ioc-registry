/*jslint node: true */
/* global describe, it, xit, beforeEach */
'use strict';

var expect = require('chai').expect;
var Registry = require("../src/Registry");
var NotRegisteredError = require("../src/errors/NotRegisteredError");
var AlreadyRegisteredError = require("../src/errors/AlreadyRegisteredError");

var MyObject = function(val) {
	this.val = val;
}

var registry;

describe("registry", function() {
	beforeEach(function() {
		registry = new Registry();
	});
	describe("#id", function() {
		it("returns the registry id", function() {
			expect(
				registry.id()
			).to.exist;
		});
		it("returns an id which is different for each registry", function() {
			var registry1 = new Registry(),
				registry2 = new Registry(),
				registry3 = new Registry();
			
			expect(
				registry1.id()
			).to.not.equal(registry2.id());
			expect(
				registry1.id()
			).to.not.equal(registry3.id());
			
			expect(
				registry2.id()
			).to.not.equal(registry1.id());
			expect(
				registry2.id()
			).to.not.equal(registry3.id());
			
			expect(
				registry3.id()
			).to.not.equal(registry1.id());
			expect(
				registry3.id()
			).to.not.equal(registry2.id());
		});
	});
	describe("#register", function() {
		it("throws an error if something has already been registered for the logical name", function() {
			registry.register('some.id', {});
			expect(
				registry.register.bind(registry, 'some.id')
			).to.throw(
				AlreadyRegisteredError
			);
		});
	});
	describe("#resolve", function() {
		it("throws an error if nothing is registered for a logical name", function() {
			expect(
				registry.resolve.bind(registry, 'some.id')
			).to.throw(
				NotRegisteredError
			);
		});
		it("returns the item that has been registered for a logical name", function() {
			registry.register('some.id', new MyObject(1234));
			expect(
				registry.resolve('some.id').val
			).to.equal(1234);
		});
		it("returns same item that has been registered for a logical name", function() {
			var object = new MyObject(1234);
			registry.register('some.id', object);
			object.val = "abc";
			expect(
				registry.resolve('some.id').val
			).to.equal("abc");
		});
	});
	describe("#resolve", function() {
		
	});
});