"use strict";

const {describe, it} = require("node:test");
const assert = require("node:assert/strict");
const {validate} = require("../lib/config");
const {loadModule} = require("./helpers/load");

const {defaults} = loadModule();
const valid = {host: "https://mealie.test", apiKey: "abc123"};
const check = (input) => validate({...defaults, ...valid, ...input}, defaults);

describe("config validation", () => {
  it("accepts the defaults with a host and API key", () => {
    const {config, warnings, errors} = check({});
    assert.deepEqual(errors, []);
    assert.deepEqual(warnings, []);
    assert.equal(config.dateFormat, "dddd");
    assert.deepEqual(config.mealSortOrder, ["breakfast", "lunch", "dinner", "side"]);
  });

  it("does not modify the input", () => {
    const input = {...defaults, ...valid, mealSortOrder: ["Lunch"]};
    const copy = structuredClone(input);
    validate(input, defaults);
    assert.deepEqual(input, copy);
  });

  it("tolerates a missing or non-object input", () => {
    for (const input of [undefined, null, "text", 5]) {
      const {errors} = validate(input, defaults);
      assert.equal(errors[0].code, "INVALID_HOST");
    }
  });

  it("passes through options that are not validated", () => {
    assert.equal(check({somethingElse: "kept"}).config.somethingElse, "kept");
  });

  describe("host", () => {
    it("removes the trailing slash, query, hash and credentials", () => {
      assert.equal(check({host: "https://user:pw@mealie.test:9000/sub/?a=1#x"}).config.host, "https://mealie.test:9000/sub");
    });

    it("keeps a path prefix", () => {
      assert.equal(check({host: "  http://nas.local/mealie/  "}).config.host, "http://nas.local/mealie");
    });

    for (const host of ["", "mealie.test", "ftp://mealie.test", "javascript:alert(1)", 5, null, `https://${"a".repeat(3000)}.test`]) {
      it(`rejects ${JSON.stringify(host).slice(0, 30)}`, () => {
        const {errors, config} = check({host});
        assert.equal(errors[0].code, "INVALID_HOST");
        assert.equal(config.host, "");
      });
    }
  });

  describe("credentials", () => {
    it("uses the API key and ignores username and password", () => {
      const {config, warnings, errors} = check({apiKey: "key", username: "u", password: "p"});
      assert.deepEqual(errors, []);
      assert.equal(config.apiKey, "key");
      assert.equal(config.username, "");
      assert.equal(config.password, "");
      assert.equal(warnings.length, 1);
    });

    it("rejects an API key with unsafe characters", () => {
      for (const apiKey of ["has space", "quo\"te", "back\\slash", "line\nbreak"]) {
        assert.equal(check({apiKey}).errors[0].code, "INVALID_APIKEY", apiKey);
      }
    });

    it("accepts a username and password", () => {
      const {config, errors} = check({apiKey: "", username: " me@example.com ", password: "Secret!"});
      assert.deepEqual(errors, []);
      assert.equal(config.username, "me@example.com");
      assert.equal(config.password, "Secret!");
      assert.equal(config.apiKey, "");
    });

    it("keeps spaces in a password", () => {
      assert.equal(check({apiKey: "", username: "u", password: " a b "}).config.password, " a b ");
    });

    it("requires a username without an API key", () => {
      assert.equal(check({apiKey: "", username: "", password: "p"}).errors[0].code, "NO_USERNAME");
    });

    it("requires a password with a username", () => {
      assert.equal(check({apiKey: "", username: "u", password: ""}).errors[0].code, "NO_PASSWORD");
    });
  });

  describe("booleans", () => {
    for (const key of ["currentWeek", "weekStartsOnMonday", "fadePriorEntries", "showPictures", "roundPictureCorners", "groupByDay", "showTodayLabel", "showDescription", "displayLastUpdate"]) {
      it(`${key} falls back to the default for non-booleans`, () => {
        const {config, warnings} = check({[key]: "yes"});
        assert.equal(config[key], defaults[key]);
        assert.match(warnings[0], new RegExp(key, "u"));
      });
    }

    it("keeps real booleans", () => {
      assert.equal(check({showPictures: false}).config.showPictures, false);
    });
  });

  describe("numbers", () => {
    it("clamps out-of-range values with a warning", () => {
      const {config, warnings} = check({dayLimit: -3, updateInterval: 999999});
      assert.equal(config.dayLimit, 0);
      assert.equal(config.updateInterval, 86400);
      assert.equal(warnings.length, 2);
    });

    it("rounds to a whole number", () => {
      assert.equal(check({entryLimit: 4.6}).config.entryLimit, 5);
    });

    it("uses the default for non-numbers and NaN", () => {
      for (const value of ["7", NaN, Infinity, null]) {
        assert.equal(check({dayLimit: value}).config.dayLimit, defaults.dayLimit);
      }
    });
  });

  describe("enums", () => {
    it("normalizes case and whitespace", () => {
      const {config, warnings} = check({fontSize: " LARGE ", template: "Mealie"});
      assert.equal(config.fontSize, "large");
      assert.equal(config.template, "mealie");
      assert.deepEqual(warnings, []);
    });

    it("falls back for unknown values", () => {
      const {config, warnings} = check({fontSize: "huge", template: "../../etc/passwd"});
      assert.equal(config.fontSize, defaults.fontSize);
      assert.equal(config.template, defaults.template);
      assert.equal(warnings.length, 2);
    });
  });

  describe("text options", () => {
    it("falls back for an empty date format", () => {
      assert.equal(check({dateFormat: "   "}).config.dateFormat, "dddd");
      assert.equal(check({displayLastUpdateFormat: 5}).config.displayLastUpdateFormat, defaults.displayLastUpdateFormat);
    });

    it("limits the length and removes control characters", () => {
      assert.equal(check({dateFormat: `dd\u0000d${"x".repeat(200)}`}).config.dateFormat.length, 64);
      assert.equal(check({dateMealSeperator: " |\n "}).config.dateMealSeperator, " | ");
    });

    it("allows an empty separator", () => {
      assert.equal(check({dateMealSeperator: ""}).config.dateMealSeperator, "");
    });

    it("trims the household and group ids", () => {
      assert.equal(check({householdId: " abc "}).config.householdId, "abc");
      assert.equal(check({groupId: 7}).config.groupId, defaults.groupId);
    });

    for (const picture of ["a\"b.png", "a'b.png", "a\\b.png", "<b>.png", ""]) {
      it(`rejects the default picture ${JSON.stringify(picture)}`, () => {
        assert.equal(check({defaultPicture: picture}).config.defaultPicture, defaults.defaultPicture);
      });
    }

    it("accepts a file name or URL for the default picture", () => {
      assert.equal(check({defaultPicture: "https://img.test/a.png"}).config.defaultPicture, "https://img.test/a.png");
      assert.equal(check({defaultPicture: "my.png"}).config.defaultPicture, "my.png");
    });
  });

  describe("mealSortOrder", () => {
    it("lowercases, deduplicates and drops unknown entries", () => {
      const {config, warnings} = check({mealSortOrder: ["Dinner", "lunch", "dinner", "brunch", 3]});
      assert.deepEqual(config.mealSortOrder, ["dinner", "lunch"]);
      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /brunch/u);
    });

    it("falls back when empty or not a list", () => {
      assert.deepEqual(check({mealSortOrder: []}).config.mealSortOrder, defaults.mealSortOrder);
      assert.deepEqual(check({mealSortOrder: "lunch"}).config.mealSortOrder, defaults.mealSortOrder);
    });
  });

  describe("mealTypeName", () => {
    it("keeps string pairs and removes unsafe ones", () => {
      const input = JSON.parse("{\"side\": \"Meal <b>Prep</b>\", \"__proto__\": \"x\", \"lunch\": 5, \" \": \"blank\"}");
      const {mealTypeName} = check({mealTypeName: input}).config;
      assert.deepEqual(Object.entries(mealTypeName), [["side", "Meal bPrep/b"]]);
      assert.equal(Object.getPrototypeOf(mealTypeName), Object.prototype);
    });

    it("falls back for arrays and non-objects", () => {
      assert.deepEqual(check({mealTypeName: ["a"]}).config.mealTypeName, {});
      assert.deepEqual(check({mealTypeName: "a"}).config.mealTypeName, {});
    });
  });
});
