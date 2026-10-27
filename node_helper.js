"use strict";

const NodeHelper = require("node_helper");
const Log = require("logger");
const moment = require("moment");
const {validate} = require("./lib/config");
const {MealieClient} = require("./lib/client");

// Example result from mealplans API see example_data.json.

module.exports = NodeHelper.create({
  start () {
    Log.log("node_helper started");
    // One client and config per module instance, keyed by identifier.
    this.instances = new Map();
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "MEALIE_INIT":
        this.initInstance(payload);
        break;

      case "MEALIE_MENU_GET":
        this.getMeals(payload);
        break;
    }
  },

  /**
   * Initializes the Mealie client for a module instance.
   * @param {Object} payload The notification payload.
   * @param {string} payload.identifier The identifier for this instance.
   * @param {Object} payload.config The configuration object for this instance.
   * @param {Object} payload.defaults The default configuration for this instance.
   * @returns {Promise<void>} Resolves when the instance is connected or the error was reported.
   */
  async initInstance ({identifier, config: rawConfig, defaults}) {
    // Do not trust the configuration: validate and sanitize it here too.
    const {config, warnings, errors} = validate(rawConfig, defaults);
    warnings.forEach((warning) => Log.warn(`Config: ${warning}`));
    if (errors.length) {
      errors.forEach((error) => Log.error(`Config: ${error.message}`));
      this.sendSocketNotification("MEALIE_ERROR", {identifier, code: errors[0].code});
      return;
    }
    Log.info(`Initializing instance ${identifier} for ${config.host} (auth: ${config.apiKey
      ? "apiKey"
      : "user/password"})`);

    try {
      const client = new MealieClient(config, {log: Log});
      await client.connect();
      this.instances.set(identifier, {client, config, outstandingRequest: false});

      this.sendSocketNotification("MEALIE_INITIALIZED", {identifier});
    } catch (error) {
      Log.error("Initialization error:", error.message);

      this.sendSocketNotification("MEALIE_ERROR", {code: "INIT", details: error.message, identifier});
    }
  },

  /**
   * Fetches the meal plan for a module instance and sends it to the front end.
   * @param {Object} payload The notification payload.
   * @param {string} payload.identifier The identifier for this instance.
   * @returns {Promise<void>} Resolves when the data or an error was sent.
   */
  async getMeals ({identifier}) {
    const instance = this.instances.get(identifier);
    if (!instance) {
      Log.warn(`Instance ${identifier} is not initialized.`);
      return;
    }
    if (instance.outstandingRequest) {
      Log.info("Outstanding request, not trying again.");
      return;
    }

    const {client, config} = instance;
    instance.outstandingRequest = true;

    try {
      try {
        await client.ensureToken();
      } catch (error) {
        Log.error("Auth error:", error.message);
        this.sendSocketNotification("MEALIE_ERROR", {code: "AUTH", details: error.message, identifier});
        return;
      }

      const {startDate, endDate} = this.getDateRange(config);
      Log.info(`Fetching meals: Start Date ${startDate} - End date ${endDate}`);

      const meals = await client.getMealPlan({
        startDate,
        endDate,
        householdId: config.householdId,
        groupId: config.groupId,
        mealTypes: config.mealSortOrder
      });
      Log.debug("Meals:", JSON.stringify(meals));

      this.sendSocketNotification("MEALIE_MENU_DATA", {identifier, meals});
    } catch (error) {
      Log.error("Fetch error:", error.message);
      this.sendSocketNotification("MEALIE_ERROR", {code: "FETCH", details: error.message, identifier});
    } finally {
      instance.outstandingRequest = false;
    }
  },

  /**
   * Works out the first and last day to request.
   * @param {Object} config The sanitized config.
   * @returns {{startDate: string, endDate: string}} Dates formatted as YYYY-MM-DD.
   */
  getDateRange (config) {
    let startDate = moment();
    let endDate = moment();

    if (config.currentWeek) {
      const startOfWeek = this.getFirstDayOfWeek(config.weekStartsOnMonday);
      const endOfWeek = startDate.clone().add(6, "days");

      // Find the latest start date.
      startDate = moment.max([
        startOfWeek,
        moment().subtract(config.priorDayLimit, "days")
      ]);

      // Find the earliest end date.
      endDate = moment.min([
        endOfWeek,
        moment().add(config.dayLimit, "days")
      ]);
    } else {
      startDate.subtract(config.priorDayLimit, "days");
      endDate.add(config.dayLimit, "days");
    }

    return {startDate: startDate.format("YYYY-MM-DD"), endDate: endDate.format("YYYY-MM-DD")};
  },

  getFirstDayOfWeek (weekStartsOnMonday) {
    const today = moment();
    let firstDayOfWeek;

    // moment.isoWeekday() returns 1 for Monday, 7 for Sunday.
    if (weekStartsOnMonday) {
      const weekStartedDaysAgo = today.isoWeekday() - 1;
      firstDayOfWeek = today.subtract(weekStartedDaysAgo, "days");
    } else {
      const weekday = today.isoWeekday();

      if (weekday === 7) {
        firstDayOfWeek = today;
      } else {
        firstDayOfWeek = today.subtract(weekday, "days");
      }
    }

    return firstDayOfWeek.startOf("day");
  }
});
