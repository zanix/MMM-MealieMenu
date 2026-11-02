"use strict";

const {describe, it, beforeEach, afterEach, mock} = require("node:test");
const assert = require("node:assert/strict");
const {loadHelper, loadModule} = require("./helpers/load");
const fixture = require("./fixtures/mealplan.json");

const {defaults} = loadModule();
// Wednesday, 2026-11-04 at noon, local time.
const NOW = new Date(2026, 10, 4, 12).getTime();
const baseConfig = {...defaults, host: "http://mealie.test", apiKey: "key"};

describe("node_helper", () => {
  let helper;

  beforeEach(() => {
    mock.timers.enable({apis: ["Date"], now: NOW});
    helper = loadHelper();
    helper.expressApp = {get: () => undefined};
    helper.start();
  });

  afterEach(() => {
    mock.timers.reset();
    mock.restoreAll();
  });

  describe("getFirstDayOfWeek", () => {
    it("returns Sunday when weeks start on Sunday", () => {
      assert.equal(helper.getFirstDayOfWeek(false).format("YYYY-MM-DD HH:mm"), "2026-11-01 00:00");
    });

    it("returns Monday when weeks start on Monday", () => {
      assert.equal(helper.getFirstDayOfWeek(true).format("YYYY-MM-DD HH:mm"), "2026-11-02 00:00");
    });

    it("returns the same day when today is the first day", () => {
      mock.timers.setTime(new Date(2026, 10, 1, 9).getTime());
      assert.equal(helper.getFirstDayOfWeek(false).format("YYYY-MM-DD"), "2026-11-01");
      mock.timers.setTime(new Date(2026, 10, 2, 9).getTime());
      assert.equal(helper.getFirstDayOfWeek(true).format("YYYY-MM-DD"), "2026-11-02");
    });

    it("handles Sunday with Monday weeks", () => {
      mock.timers.setTime(new Date(2026, 10, 8, 9).getTime());
      assert.equal(helper.getFirstDayOfWeek(true).format("YYYY-MM-DD"), "2026-11-02");
    });
  });

  describe("getDateRange", () => {
    it("limits the current week by the day limits", () => {
      assert.deepEqual(helper.getDateRange({...baseConfig, currentWeek: true, priorDayLimit: 2, dayLimit: 7}), {startDate: "2026-11-02", endDate: "2026-11-07"});
    });

    it("never goes past the week's boundaries", () => {
      assert.deepEqual(helper.getDateRange({...baseConfig, currentWeek: true, priorDayLimit: 30, dayLimit: 30}), {startDate: "2026-11-01", endDate: "2026-11-07"});
    });

    it("shrinks the range with small limits", () => {
      assert.deepEqual(helper.getDateRange({...baseConfig, currentWeek: true, priorDayLimit: 0, dayLimit: 1}), {startDate: "2026-11-04", endDate: "2026-11-05"});
    });

    it("uses only the limits when not limited to the current week", () => {
      assert.deepEqual(helper.getDateRange({...baseConfig, currentWeek: false, priorDayLimit: 2, dayLimit: 7}), {startDate: "2026-11-02", endDate: "2026-11-11"});
    });

    it("rolls over month and year boundaries", () => {
      mock.timers.setTime(new Date(2026, 11, 31, 12).getTime());
      assert.deepEqual(helper.getDateRange({...baseConfig, currentWeek: false, priorDayLimit: 1, dayLimit: 1}), {startDate: "2026-12-30", endDate: "2027-01-01"});
    });
  });

  describe("initInstance", () => {
    const payload = (config) => ({identifier: "id1", config: {...baseConfig, ...config}, defaults});

    it("reports a config error without creating an instance", async () => {
      await helper.initInstance(payload({host: "nope"}));
      assert.deepEqual(helper.sent, [{notification: "MEALIE_ERROR", payload: {identifier: "id1", code: "INVALID_HOST"}}]);
      assert.equal(helper.instances.size, 0);
    });

    it("reports INIT when Mealie can not be reached", async (t) => {
      t.mock.method(globalThis, "fetch", async () => {
        throw new Error("boom");
      });
      await helper.initInstance(payload({}));
      assert.equal(helper.sent[0].notification, "MEALIE_ERROR");
      assert.equal(helper.sent[0].payload.code, "INIT");
      assert.equal(helper.sent[0].payload.details, "boom");
      assert.equal(helper.instances.size, 0);
    });

    it("stores the instance and confirms when connected", async (t) => {
      t.mock.method(globalThis, "fetch", async () => Response.json({version: "v2.3.0"}));
      await helper.initInstance(payload({}));
      assert.deepEqual(helper.sent, [{notification: "MEALIE_INITIALIZED", payload: {identifier: "id1"}}]);
      assert.equal(helper.instances.get("id1").config.host, "http://mealie.test");
    });

    it("sanitizes the config it receives", async (t) => {
      t.mock.method(globalThis, "fetch", async () => Response.json({version: "v2.3.0"}));
      await helper.initInstance(payload({host: "http://mealie.test/", dayLimit: 99999}));
      assert.equal(helper.instances.get("id1").config.host, "http://mealie.test");
      assert.equal(helper.instances.get("id1").config.dayLimit, 365);
    });
  });

  describe("getMeals", () => {
    const fakeClient = (overrides = {}) => ({
      ensureToken: mock.fn(async () => undefined),
      getMealPlan: mock.fn(async () => fixture.items),
      ...overrides
    });
    const register = (client) => helper.instances.set("id1", {client, config: {...baseConfig, householdId: "h", groupId: "g"}, outstandingRequest: false});

    it("ignores unknown instances", async () => {
      await helper.getMeals({identifier: "missing"});
      assert.deepEqual(helper.sent, []);
    });

    it("requests the date range and sends the meals", async () => {
      const client = fakeClient();
      register(client);
      await helper.getMeals({identifier: "id1"});

      assert.deepEqual(client.getMealPlan.mock.calls[0].arguments[0], {
        startDate: "2026-11-02",
        endDate: "2026-11-07",
        householdId: "h",
        groupId: "g",
        mealTypes: ["breakfast", "lunch", "dinner", "side"]
      });
      assert.deepEqual(helper.sent, [{notification: "MEALIE_MENU_DATA", payload: {identifier: "id1", meals: fixture.items}}]);
    });

    it("skips a request while another is outstanding", async () => {
      const client = fakeClient();
      register(client);
      helper.instances.get("id1").outstandingRequest = true;
      await helper.getMeals({identifier: "id1"});
      assert.equal(client.getMealPlan.mock.callCount(), 0);
    });

    it("reports AUTH errors", async () => {
      register(fakeClient({ensureToken: async () => {
        throw new Error("bad login");
      }}));
      await helper.getMeals({identifier: "id1"});
      assert.deepEqual(helper.sent, [{notification: "MEALIE_ERROR", payload: {code: "AUTH", details: "bad login", identifier: "id1"}}]);
      assert.equal(helper.instances.get("id1").outstandingRequest, false);
    });

    it("reports FETCH errors and allows a retry", async () => {
      register(fakeClient({getMealPlan: async () => {
        throw new Error("500");
      }}));
      await helper.getMeals({identifier: "id1"});
      assert.equal(helper.sent[0].payload.code, "FETCH");
      assert.equal(helper.instances.get("id1").outstandingRequest, false);
    });
  });

  describe("serveImage", () => {
    const makeRes = () => {
      const res = {headers: {}};
      res.sendStatus = (code) => {
        res.status = code;
      };
      res.set = (headers) => Object.assign(res.headers, headers);
      res.send = (body) => {
        res.status = 200;
        res.body = body;
      };
      return res;
    };
    const call = async (params, getRecipeImage) => {
      helper.instances.set("id1", {client: {getRecipeImage}, config: baseConfig});
      const res = makeRes();
      await helper.serveImage({params}, res);
      return res;
    };

    it("registers the route", () => {
      const routes = [];
      helper.expressApp = {get: (path) => routes.push(path)};
      helper.start();
      assert.deepEqual(routes, ["/MMM-MealieMenu/image/:identifier/:recipeId"]);
    });

    it("streams the image with its content type", async () => {
      const body = Buffer.from("img");
      const res = await call({identifier: "id1", recipeId: "abc-123"}, async () => ({body, contentType: "image/webp"}));
      assert.equal(res.status, 200);
      assert.equal(res.body, body);
      assert.equal(res.headers["Content-Type"], "image/webp");
    });

    it("rejects unknown instances and unsafe recipe ids", async () => {
      const fail = async () => assert.fail("should not fetch");
      assert.equal((await call({identifier: "nope", recipeId: "abc"}, fail)).status, 404);
      assert.equal((await call({identifier: "id1", recipeId: "../x"}, fail)).status, 404);
    });

    it("maps upstream errors", async () => {
      const missing = await call({identifier: "id1", recipeId: "abc"}, async () => {
        throw Object.assign(new Error("nf"), {status: 404});
      });
      const broken = await call({identifier: "id1", recipeId: "abc"}, async () => {
        throw new Error("down");
      });
      assert.equal(missing.status, 404);
      assert.equal(broken.status, 502);
    });
  });

  describe("socketNotificationReceived", () => {
    it("routes notifications and ignores unknown ones", () => {
      const init = mock.method(helper, "initInstance", async () => undefined);
      const get = mock.method(helper, "getMeals", async () => undefined);
      helper.socketNotificationReceived("MEALIE_INIT", {a: 1});
      helper.socketNotificationReceived("MEALIE_MENU_GET", {b: 2});
      helper.socketNotificationReceived("OTHER", {});
      assert.deepEqual(init.mock.calls[0].arguments, [{a: 1}]);
      assert.deepEqual(get.mock.calls[0].arguments, [{b: 2}]);
    });
  });
});
