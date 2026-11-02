"use strict";

const {describe, it, before, after, beforeEach} = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const {MealieClient, versionAtLeast} = require("../lib/client");
const fixture = require("./fixtures/mealplan.json");

const quiet = () => undefined;
const silent = {debug: quiet, info: quiet, warn: quiet, error: quiet};
const make = (config, deps) => new MealieClient(config, {log: silent, ...deps});
const makeJwt = (expSeconds) => `h.${Buffer.from(JSON.stringify({exp: expSeconds})).toString("base64url")}.s`;
const inOneHour = () => Math.floor(Date.now() / 1000) + 3600;

describe("versionAtLeast", () => {
  it("compares versions numerically", () => {
    assert.equal(versionAtLeast("2.0.0", "2.0.0"), true);
    assert.equal(versionAtLeast("v2.3.1", "2.0.0"), true);
    assert.equal(versionAtLeast("1.12.0", "2.0.0"), false);
    assert.equal(versionAtLeast("2.10.0", "2.9.0"), true);
    assert.equal(versionAtLeast("2", "2.0.1"), false);
    assert.equal(versionAtLeast("v2.0.0-beta", "2.0.0"), true);
  });
});

describe("MealieClient", () => {
  let server;
  let host;
  let requests;
  let behavior;

  before(async () => {
    server = http.createServer((req, res) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        const url = new URL(req.url, "http://x");
        requests.push({method: req.method, path: url.pathname, query: url.searchParams, headers: req.headers, body: Buffer.concat(chunks).toString()});
        const reply = behavior[url.pathname];
        res.setHeader("content-type", "application/json");
        if (typeof reply === "function") {
          reply(req, res);
          return;
        }
        res.statusCode = reply?.status ?? 404;
        res.end(JSON.stringify(reply?.body ?? {}));
      });
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    host = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => server.close());

  beforeEach(() => {
    requests = [];
    behavior = {
      "/api/app/about": {status: 200, body: {version: "v2.3.0"}},
      "/api/auth/token": {status: 200, body: {access_token: makeJwt(inOneHour())}},
      "/api/households/mealplans": {status: 200, body: fixture},
      "/api/groups/mealplans": {status: 200, body: {items: ["legacy"]}}
    };
  });

  const logs = () => {
    const entries = [];
    const log = {};
    for (const level of ["debug", "info", "warn", "error"]) {
      log[level] = (message) => entries.push(`${level}: ${message}`);
    }
    return {log, entries};
  };

  describe("connect", () => {
    it("reads the version without authentication, then logs in", async () => {
      const client = make({host, username: "me", password: "pw"});
      await client.connect();

      assert.equal(client.apiVersion, "v2.3.0");
      assert.deepEqual(requests.map((req) => req.path), ["/api/app/about", "/api/auth/token"]);
      assert.equal(requests[0].headers.authorization, undefined);
      assert.equal(requests[1].method, "POST");
      assert.match(requests[1].headers["content-type"], /^application\/x-www-form-urlencoded/u);
      assert.equal(requests[1].body, "username=me&password=pw");
    });

    it("url-encodes credentials", async () => {
      await make({host, username: "a@b.c", password: "p&w=1 +"}).login();
      const form = new URLSearchParams(requests[0].body);
      assert.equal(form.get("username"), "a@b.c");
      assert.equal(form.get("password"), "p&w=1 +");
    });

    it("does not log in when using an API key", async () => {
      const client = make({host, apiKey: "key"});
      await client.connect();
      assert.deepEqual(requests.map((req) => req.path), ["/api/app/about"]);
      assert.equal(client.token, "key");
    });

    it("rejects with the HTTP status when login fails", async () => {
      behavior["/api/auth/token"] = {status: 401};
      await assert.rejects(make({host, username: "u", password: "bad"}).connect(), (error) => {
        assert.equal(error.status, 401);
        return true;
      });
    });

    it("rejects when the server is unreachable", async () => {
      await assert.rejects(make({host: "http://127.0.0.1:1", apiKey: "k"}).connect(), Error);
    });
  });

  describe("token handling", () => {
    it("does not log in again while the token is valid", async () => {
      const client = make({host, username: "u", password: "p"});
      await client.login();
      await client.ensureToken();
      assert.equal(requests.length, 1);
    });

    it("refreshes a token that is about to expire", async () => {
      behavior["/api/auth/token"] = {status: 200, body: {access_token: makeJwt(Math.floor(Date.now() / 1000) + 30)}};
      const client = make({host, username: "u", password: "p"});
      await client.login();
      await client.ensureToken();
      assert.equal(requests.length, 2);
    });

    it("refreshes an expired token and warns when the expiry is unreadable", async () => {
      behavior["/api/auth/token"] = {status: 200, body: {access_token: "not-a-jwt"}};
      const {log, entries} = logs();
      const client = make({host, username: "u", password: "p"}, {log});
      await client.login();
      await client.ensureToken();
      assert.equal(requests.length, 2);
      assert.ok(entries.some((entry) => entry.startsWith("warn:")));
    });

    it("never refreshes an API key", async () => {
      const client = make({host, apiKey: "key"});
      await client.ensureToken();
      assert.equal(requests.length, 0);
    });
  });

  describe("getMealPlan", () => {
    const range = {startDate: "2026-11-01", endDate: "2026-11-07"};

    it("returns the items using the households endpoint on Mealie 2.0 and later", async () => {
      const client = make({host, apiKey: "key"});
      await client.getVersion();
      const items = await client.getMealPlan(range);

      assert.equal(items.length, fixture.items.length);
      const request = requests.at(-1);
      assert.equal(request.path, "/api/households/mealplans");
      assert.equal(request.headers.authorization, "Bearer key");
      assert.equal(request.query.get("start_date"), "2026-11-01");
      assert.equal(request.query.get("end_date"), "2026-11-07");
      assert.equal(request.query.get("orderBy"), "date");
      assert.equal(request.query.get("orderDirection"), "asc");
      assert.equal(request.query.has("household_id"), false);
      assert.equal(request.query.has("queryFilter"), false);
    });

    it("uses the groups endpoint before Mealie 2.0", async () => {
      behavior["/api/app/about"] = {status: 200, body: {version: "v1.12.0"}};
      const client = make({host, apiKey: "key"});
      await client.getVersion();
      assert.deepEqual(await client.getMealPlan(range), ["legacy"]);
      assert.equal(requests.at(-1).path, "/api/groups/mealplans");
    });

    it("sends the household, group and meal type filter", async () => {
      const client = make({host, apiKey: "key"});
      await client.getVersion();
      await client.getMealPlan({...range, householdId: "h1", groupId: "g1", mealTypes: ["lunch", "dinner"]});
      const {query} = requests.at(-1);
      assert.equal(query.get("household_id"), "h1");
      assert.equal(query.get("group_id"), "g1");
      assert.equal(query.get("queryFilter"), "entryType in [\"lunch\", \"dinner\"]");
    });

    it("logs in first when the token is missing", async () => {
      const client = make({host, username: "u", password: "p"});
      await client.getMealPlan(range);
      assert.ok(requests.findIndex((req) => req.path === "/api/auth/token") < requests.findIndex((req) => req.path.endsWith("/mealplans")));
    });

    it("rejects with the status on server errors", async () => {
      behavior["/api/households/mealplans"] = {status: 500};
      const client = make({host, apiKey: "key"});
      await client.getVersion();
      await assert.rejects(client.getMealPlan(range), {status: 500});
    });
  });

  describe("getRecipeImage", () => {
    it("returns the bytes and content type using the token", async () => {
      behavior["/api/media/recipes/r1/images/min-original.webp"] = (req, res) => {
        res.setHeader("content-type", "image/webp");
        res.end(Buffer.from("RIFF"));
      };
      const image = await make({host, apiKey: "key"}).getRecipeImage("r1");
      assert.equal(image.body.toString(), "RIFF");
      assert.equal(image.contentType, "image/webp");
      assert.equal(requests.at(-1).headers.authorization, "Bearer key");
    });

    it("rejects with the status when missing", async () => {
      await assert.rejects(make({host, apiKey: "key"}).getRecipeImage("none"), {status: 404});
    });
  });

  describe("request", () => {
    it("times out slow servers", async (t) => {
      t.mock.method(AbortSignal, "timeout", () => AbortSignal.abort(new DOMException("slow", "TimeoutError")));
      const client = make({host, apiKey: "k"});
      await assert.rejects(client.request("/slow"), {message: "Request timed out"});
    });

    it("never logs secrets", async () => {
      const {log, entries} = logs();
      const client = make({host, username: "me", password: "hunter2"}, {log});
      await client.connect();
      await client.getMealPlan({startDate: "2026-11-01", endDate: "2026-11-02"});
      const text = entries.join("\n");
      assert.ok(!text.includes("hunter2"));
      assert.ok(!text.includes(client.token));
    });
  });
});
