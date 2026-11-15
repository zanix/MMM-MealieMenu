"use strict";

const {describe, it} = require("node:test");
const assert = require("node:assert/strict");
const {loadModule} = require("./helpers/load");
const schema = require("../config.schema.json");

const {defaults} = loadModule();
const {properties} = schema;

describe("config.schema.json", () => {
  it("has exactly the same options as the module defaults", () => {
    assert.deepEqual(Object.keys(properties).sort(), Object.keys(defaults).sort());
  });

  it("describes every option with a type and description", () => {
    for (const [key, property] of Object.entries(properties)) {
      assert.ok(property.type, `${key} has no type`);
      assert.ok(property.description, `${key} has no description`);
    }
  });

  it("uses the module defaults as schema defaults", () => {
    for (const [key, value] of Object.entries(defaults)) {
      // Options without a default (host, credentials, ids) must be empty strings in the module.
      if ("default" in properties[key]) {
        assert.deepEqual(properties[key].default, value, `default of ${key}`);
      } else {
        assert.equal(value, "", `${key} has a default but the schema does not`);
      }
    }
  });

  it("matches the enums and limits of the validator", () => {
    assert.deepEqual(properties.template.enum, ["default", "mealie"]);
    assert.deepEqual(properties.fontSize.enum, ["xsmall", "small", "medium", "large", "xlarge"]);
    assert.deepEqual(properties.mealSortOrder.items.enum, require("../lib/config").MEAL_TYPES);
    for (const key of ["dayLimit", "priorDayLimit", "entryLimit", "priorEntryLimit", "updateInterval", "animationSpeed"]) {
      assert.equal(properties[key].type, "integer", key);
      assert.equal(typeof properties[key].minimum, "number", key);
      assert.equal(typeof properties[key].maximum, "number", key);
    }
  });

  it("only sets defaults that the validator accepts", () => {
    const {validate} = require("../lib/config");
    const values = Object.fromEntries(Object.entries(properties).map(([key, property]) => [key, property.default ?? defaults[key]]));
    const {warnings} = validate({...values, host: "http://mealie.test", apiKey: "key"}, defaults);
    assert.deepEqual(warnings, []);
  });
});
