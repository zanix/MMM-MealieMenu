"use strict";

const Module = require("node:module");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..");
const noop = () => undefined;
const logger = {log: noop, info: noop, warn: noop, error: noop, debug: noop};

/**
 * Loads node_helper.js with MagicMirror's `node_helper` and `logger` modules stubbed.
 * @returns {Object} A fresh helper object with `sendSocketNotification` recording to `sent`.
 */
function loadHelper () {
  const originalLoad = Module._load;
  Module._load = function load (request, ...args) {
    if (request === "node_helper") {
      return {create: (definition) => definition};
    }
    if (request === "logger") {
      return logger;
    }
    return Reflect.apply(originalLoad, this, [request, ...args]);
  };

  const file = path.join(ROOT, "node_helper.js");
  delete require.cache[file];
  try {
    const helper = require(file);
    helper.name = "MMM-MealieMenu";
    helper.sent = [];
    helper.sendSocketNotification = (notification, payload) => helper.sent.push({notification, payload});
    return helper;
  } finally {
    Module._load = originalLoad;
  }
}

/**
 * Creates the front end module definition from MMM-MealieMenu.js with MagicMirror globals stubbed.
 * @param {Object} [options] Overrides.
 * @param {Object} [options.config] Config values on top of the module defaults.
 * @returns {Object} The module instance.
 */
function loadModule ({config = {}} = {}) {
  let definition;
  globalThis.Module = {register: (name, def) => {
    definition = def;
  }};
  globalThis.Log = logger;
  globalThis.moment = require("moment");
  globalThis.window = {MealieMenuConfig: require("../../lib/config")};

  const file = path.join(ROOT, "MMM-MealieMenu.js");
  delete require.cache[file];
  require(file);

  const translations = require("../../translations/en.json");
  const instance = {
    ...definition,
    name: "MMM-MealieMenu",
    identifier: "module_1_MMM-MealieMenu",
    sent: [],
    renders: 0,
    file: (name) => `/modules/MMM-MealieMenu/${name}`,
    translate: (key) => translations[key] ?? key,
    sendSocketNotification (notification, payload) {
      this.sent.push({notification, payload});
    },
    updateDom () {
      this.renders += 1;
    }
  };
  instance.config = {...definition.defaults, host: "http://mealie.test", apiKey: "key", ...config};
  return instance;
}

module.exports = {loadHelper, loadModule, ROOT};
