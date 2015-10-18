/* global destroy */
/* jslint node: true */
/* jshint -W024 */ /* jshint expr:true */ // required to prevent jshint failing on expect(..).to.exist;
/* global describe, it, beforeEach, afterEach */
'use strict';

var chai = require("chai");
var jsmockito = require("jsmockito").JsMockito;

var mock = jsmockito.mock;
var when = jsmockito.when;
var verify = jsmockito.verify;
var expect = chai.expect;

var Registry = require("../src/Registry");
var NotRegisteredError = require("../src/errors/NotRegisteredError");
var AlreadyRegisteredError = require("../src/errors/AlreadyRegisteredError");

var MyObject = function(val) {
	this.val = val;
};

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
	describe("#isRegistered", function() {
		it("returns false if nothing is registered", function() {
			expect(
				registry.isRegistered('some.id')
			).to.be.false;
		});
		it("returns true if something has been registered", function() {
			registry.register('some.id', {});
			expect(
				registry.isRegistered('some.id')
			).to.be.true;
		});
	});
	describe("#deregister", function() {
		it("removes items", function() {
			registry.register('some.id', {});
			expect(
				registry.isRegistered('some.id')
			).to.be.true;
			registry.deregister('some.id');
			expect(
				registry.isRegistered('some.id')
			).to.be.false;
		});
		it("throws an error if nothing has been registered for the logical name", function() {
			expect(
				registry.deregister.bind(registry, 'some.id')
			).to.throw(
				NotRegisteredError
			);
		});
		it("a new item can be registered after being deregistered", function() {
			registry.register('some.id', new MyObject(1234));
			registry.deregister('some.id');
			registry.register('some.id', new MyObject("abc"));
			expect(
				registry.resolve('some.id').val
			).to.equal("abc");
		});
	});
	describe("#registeredNames", function() {
		it("returns an empty list if nothing is registered", function() {
			expect(
				registry.registeredNames()
			).to.be.eql( [] );
		});
		it("returns the list of registered names", function() {
			registry.register('obj1', {});
			registry.register('obj2', {});
			registry.register('obj3', {});
			expect(
				registry.registeredNames()
			).to.be.eql( ['obj1', 'obj2', 'obj3'] );
		});
	});
	describe("#destroy", function() {
		it("clears the registry", function() {
			registry.register('some.id', {});
			registry.register('another.id', {});
			registry.destroy();
			expect( registry.isRegistered('some.id') ).to.be.false;
			expect( registry.isRegistered('another.id') ).to.be.false;
		});
		it("calls destroy on registered services", function () {
			var myInterface = { destroy: function(){} };
			var mockObj1 = mock(myInterface);
			var mockObj2 = mock(myInterface);
			
			registry.register('obj1', mockObj1);
			registry.register('obj2', mockObj2);
			
			registry.destroy();
			
			verify(mockObj1).destroy();
			verify(mockObj2).destroy();
		});
		it("calls dispose on registered services even if first throws an error on dispose", function () {
			var myInterface = { destroy: function(){} };
			var mockObj1 = mock(myInterface);
			var mockObj2 = mock(myInterface);
			
			registry.register('obj1', mockObj1);
			registry.register('obj2', mockObj2);
			
			when(mockObj1).destroy().thenThrow( 'some error' );
			
			registry.destroy();
			
			verify(mockObj1).destroy();
			verify(mockObj2).destroy();
		});
		it("does not call dispose on servies if service doesnt implement dispose method", function() {
			var myInterface = { someMethod: function(){} };
			var mockObj1 = mock(myInterface);
			
			registry.register('obj1', mockObj1);
			
			registry.destroy();
			
			jsmockito.verifyZeroInteractions(mockObj1);
		});
		it("does not call dispose on services if service implements dispose method which accepts more than 0 args", function() {
			var destroyCalled = false; // this has to be done with a real object rather than mocks so item.destroy.length has the correct value
			var obj1 = {
				destroy: function(arg1) {
					destroyCalled = true;
				}
			}
			
			registry.register('obj1', obj1);
			
			registry.destroy();
			
			expect(destroyCalled).to.be.false;
		});
	});
});