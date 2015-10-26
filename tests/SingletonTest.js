/* global destroy */
/* jslint node: true */
/* jshint -W024 */ /* jshint expr:true */ // required to prevent jshint failing on expect(..).to.exist;
/* global describe, it, beforeEach, afterEach */
'use strict';

var registry = require("../");
var chai = require("chai");
var expect = chai.expect;

var MyObject = function(val) {
	this.val = val;
};


describe("registry singleton", function() {
	
	registry.register("my-object", MyObject);
	
	it("can be used to register a service", function() {
		registry.register("some-thing", {});
		expect(registry.isRegistered("some-thing")).to.be.true;
	});
	it("can be used to get an object", function() {
		expect(registry.resolve("my-object")).to.equal(MyObject);
	});
	it("requiring registry twice gives the same ID", function() {
		var registry1 = require("../");
		var registry2 = require("../");
		expect(registry1.id()).to.equal(registry2.id());
	})
});