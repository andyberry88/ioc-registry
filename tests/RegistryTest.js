/* global describe, it, xit */
'use strict';

var expect = require('chai').expect;

var Registry = require("../src/Registry");
var registry = new Registry();

describe("registry", function() {
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
});