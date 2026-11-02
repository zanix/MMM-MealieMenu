"use strict";

const {describe, it, beforeEach, afterEach, mock} = require("node:test");
const assert = require("node:assert/strict");
const {loadModule} = require("./helpers/load");
const fixture = require("./fixtures/mealplan.json");

// Wednesday, 2026-11-04 at noon, local time. The fixture covers 2026-11-01 to 2026-11-07.
const NOW = new Date(2026, 10, 4, 12).getTime();
const meals = () => structuredClone(fixture.items);

describe("MMM-MealieMenu front end", () => {
  let mod;

  beforeEach(() => {
    mock.timers.enable({apis: ["Date"], now: NOW});
    mod = loadModule();
  });

  afterEach(() => {
    mock.timers.reset();
  });

  describe("start", () => {
    it("validates the config and sends MEALIE_INIT", () => {
      mod.config.dayLimit = 9999;
      mod.start();
      assert.equal(mod.config.dayLimit, 365);
      assert.equal(mod.error, null);
      assert.equal(mod.sent.length, 1);
      assert.equal(mod.sent[0].notification, "MEALIE_INIT");
      assert.equal(mod.sent[0].payload.identifier, mod.identifier);
      assert.equal(mod.sent[0].payload.config.host, "http://mealie.test");
    });

    it("stops with an error code and does not contact the helper", () => {
      mod.config.host = "";
      mod.start();
      assert.equal(mod.error, "INVALID_HOST");
      assert.equal(mod.sent.length, 0);
    });

    it("resolves a default picture file name to the module folder", () => {
      mod.start();
      assert.equal(mod.config.defaultPicture, "/modules/MMM-MealieMenu/mealie.png");
    });

    it("keeps a default picture URL", () => {
      mod.config.defaultPicture = "https://img.test/a.png";
      mod.start();
      assert.equal(mod.config.defaultPicture, "https://img.test/a.png");
    });
  });

  describe("getTemplate", () => {
    it("follows the template option", () => {
      assert.equal(mod.getTemplate(), "templates/default.njk");
      mod.config.template = "mealie";
      assert.equal(mod.getTemplate(), "templates/mealie.njk");
    });
  });

  describe("getTemplateData", () => {
    it("translates the error code", () => {
      mod.start();
      mod.error = "INVALID_APIKEY";
      assert.equal(mod.getTemplateData().errorText, mod.translate("ERROR_INVALID_APIKEY"));
      mod.error = null;
      assert.equal(mod.getTemplateData().errorText, "");
    });
  });

  describe("typeToMealDisplay", () => {
    beforeEach(() => mod.start());

    it("uses the translation for known types", () => {
      assert.equal(mod.typeToMealDisplay("dinner"), "Dinner");
    });

    it("prefers a configured name", () => {
      mod.config.mealTypeName = {dinner: "Supper"};
      assert.equal(mod.typeToMealDisplay("dinner"), "Supper");
    });

    it("capitalizes unknown types", () => {
      assert.equal(mod.typeToMealDisplay("late NIGHT snack"), "Late Night Snack");
    });

    it("returns nothing for an empty type", () => {
      assert.equal(mod.typeToMealDisplay(""), undefined);
      assert.equal(mod.typeToMealDisplay(null), undefined);
    });
  });

  describe("formatMeals", () => {
    beforeEach(() => mod.start());

    it("sorts by date, then by the configured meal order", () => {
      const result = mod.formatMeals(meals());
      assert.deepEqual(result.slice(0, 4).map((meal) => meal.entryType), ["breakfast", "lunch", "dinner", "dinner"]);
      assert.deepEqual(result.map((meal) => meal.rawDate), [...result.map((meal) => meal.rawDate)].sort());
    });

    it("sorts by a custom meal order", () => {
      mod.config.mealSortOrder = ["dinner", "lunch", "breakfast"];
      assert.deepEqual(mod.formatMeals(meals()).slice(0, 4)
        .map((meal) => meal.entryType), ["dinner", "dinner", "lunch", "breakfast"]);
    });

    it("maps recipe fields", () => {
      const [first] = mod.formatMeals(meals());
      assert.equal(first.name, "Simple & Easy Freezer Breakfast Burritos");
      assert.equal(first.meal, "Breakfast");
      assert.equal(first.date, "Sunday");
      assert.equal(first.photoUrl, `/MMM-MealieMenu/image/${mod.identifier}/${fixture.items[1].recipeId}`);
    });

    it("uses the title and text for notes without a recipe", () => {
      const note = {...meals()[0], recipe: null, recipeId: null, title: "Leftovers", text: "Eat them"};
      const [result] = mod.formatMeals([note]);
      assert.equal(result.name, "Leftovers");
      assert.equal(result.description, "Eat them");
      assert.equal(result.photoUrl, "");
    });

    it("marks today and fades earlier days", () => {
      const result = mod.formatMeals(meals());
      const flags = (date) => result.filter((meal) => meal.rawDate === date).map((meal) => [meal.isToday, meal.shouldFade]);
      assert.deepEqual(flags("2026-11-04"), [[true, false]]);
      assert.deepEqual(flags("2026-11-03"), [[false, true]]);
      assert.deepEqual(flags("2026-11-05"), [[false, false]]);
    });

    it("does not fade when disabled", () => {
      mod.config.fadePriorEntries = false;
      assert.ok(mod.formatMeals(meals()).every((meal) => !meal.shouldFade));
    });

    it("uses the date format", () => {
      mod.config.dateFormat = "ddd D MMM";
      assert.equal(mod.formatMeals(meals())[0].date, "Sun 1 Nov");
    });
  });

  describe("filterDaysAndEntries", () => {
    beforeEach(() => mod.start());
    const dates = (items) => items.map((meal) => meal.rawDate);

    it("limits future entries, counting today as the future", () => {
      mod.config.entryLimit = 2;
      mod.config.priorEntryLimit = 0;
      const result = mod.filterDaysAndEntries(mod.formatMeals(meals()));
      assert.deepEqual(dates(result), ["2026-11-04", "2026-11-05"]);
    });

    it("limits prior entries to the closest ones", () => {
      mod.config.entryLimit = 0;
      mod.config.priorEntryLimit = 2;
      const result = mod.filterDaysAndEntries(mod.formatMeals(meals()));
      assert.deepEqual(dates(result), ["2026-11-02", "2026-11-03"]);
    });

    it("keeps everything with high limits, in date order", () => {
      const result = mod.filterDaysAndEntries(mod.formatMeals(meals()));
      assert.equal(result.length, fixture.items.length);
      assert.deepEqual(dates(result), [...dates(result)].sort());
    });

    it("returns nothing when both limits are 0", () => {
      mod.config.entryLimit = 0;
      mod.config.priorEntryLimit = 0;
      assert.deepEqual(mod.filterDaysAndEntries(mod.formatMeals(meals())), []);
    });
  });

  describe("buildMenu", () => {
    beforeEach(() => mod.start());

    it("groups meals by day and then by meal type", () => {
      const {meals: flat, days} = mod.buildMenu(mod.formatMeals(meals()));
      assert.equal(flat.length, 10);
      assert.equal(days.length, 7);
      assert.deepEqual(days[0].groups.map((group) => [group.entryType, group.name, group.meals.length]), [
        ["breakfast", "Breakfast", 1],
        ["lunch", "Lunch", 1],
        ["dinner", "Dinner", 2]
      ]);
      assert.equal(days[0].date, "Sunday");
      assert.equal(days[3].isToday, true);
      assert.equal(days[0].shouldFade, true);
    });

    it("handles an empty plan", () => {
      assert.deepEqual(mod.buildMenu([]), {meals: [], days: []});
    });
  });

  describe("socketNotificationReceived", () => {
    beforeEach(() => mod.start());

    it("ignores other instances", () => {
      mod.socketNotificationReceived("MEALIE_MENU_DATA", {identifier: "other", meals: meals()});
      assert.equal(mod.loaded, false);
      assert.equal(mod.renders, 0);
    });

    it("starts the fetching loop when initialized", (t) => {
      const interval = t.mock.method(globalThis, "setInterval", () => 42);
      mod.sent.length = 0;
      mod.socketNotificationReceived("MEALIE_INITIALIZED", {identifier: mod.identifier});
      assert.equal(mod.initialized, true);
      assert.deepEqual(mod.sent.map((item) => item.notification), ["MEALIE_MENU_GET"]);
      assert.equal(interval.mock.calls[0].arguments[1], mod.config.updateInterval * 1000);
      mod.updateInterval = 0;
    });

    it("builds the menu from data and renders", () => {
      mod.socketNotificationReceived("MEALIE_MENU_DATA", {identifier: mod.identifier, meals: meals()});
      assert.equal(mod.loaded, true);
      assert.equal(mod.error, null);
      assert.equal(mod.formattedMenuData.days.length, 7);
      assert.equal(mod.renders, 1);
      assert.equal(mod.dataRefreshTimestamp, String(NOW));
    });

    it("clears the menu and shows the error on MEALIE_ERROR", () => {
      mod.socketNotificationReceived("MEALIE_MENU_DATA", {identifier: mod.identifier, meals: meals()});
      mod.socketNotificationReceived("MEALIE_ERROR", {identifier: mod.identifier, code: "FETCH"});
      assert.equal(mod.error, "FETCH");
      assert.equal(mod.formattedMenuData, null);
      assert.equal(mod.renders, 2);
    });
  });

  describe("suspend and resume", () => {
    beforeEach(() => mod.start());

    it("stops the timer while hidden and restarts it on resume", (t) => {
      t.mock.method(globalThis, "setInterval", () => 7);
      const clear = t.mock.method(globalThis, "clearInterval", () => undefined);
      mod.sent.length = 0;
      mod.resume();
      assert.equal(mod.updateInterval, 7);
      assert.equal(mod.sent.length, 1);

      mod.suspend();
      assert.equal(mod.hidden, true);
      assert.equal(mod.updateInterval, 0);
      assert.equal(clear.mock.calls[0].arguments[0], 7);
    });
  });
});
