const NodeHelper = require("node_helper");
const Log = require("logger");
const axios = require("axios").default;
const moment = require("moment");

// Example result from mealplans API see example_data.json.

module.exports = NodeHelper.create({
  start () {
    Log.log(`Starting node_helper for module [${this.name}]`);
    this.mealieApi = null;
    this.token = null;
    this.outstandingRequest = false;
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "MEALIE_CREATE_FETCHER":
        // Use API Key or fetch a token.
        if (payload.apiKey) {
          this.token = payload.apiKey;
          this.createFetcher(payload);
        } else {
          this.getToken(payload);
        }
        break;

      case "MEALIE_MENU_GET":
        this.getMeals(payload);
        break;
    }
  },

  getToken (config) {
    const params = new URLSearchParams();
    params.append("username", config.username);
    params.append("password", config.password);

    axios.post(`${config.host}/api/auth/token`, params, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })
      .then((response) => {
        this.token = response.data.access_token;
        this.createFetcher(config);
      })
      .catch((error) => {
        this.sendSocketNotification("MEALIE_ERROR", {
          error: "AUTH_ERROR",
          details: error,
          identifier: config.identifier
        });
      });
  },

  createFetcher (config) {
    // Create single API handler
    if (this.mealieApi === null) {
      this.mealieApi = axios.create({
        baseURL: config.host,
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${this.token}`
        }
      });
    }
    this.sendSocketNotification("MEALIE_INITIALIZED", {
      identifier: config.identifier
    });
  },

  getMeals (config) {
    if (this.outstandingRequest === true) {
      Log.info(`[${this.name}] Outstanding request, not trying again.`);
      return;
    }

    this.outstandingRequest = true;

    const startOfWeek = this.getFirstDayOfWeek(config.weekStartsOnMonday);
    const nextWeek = startOfWeek.clone().add(7, "days");
    const lastDayOfWeek = nextWeek.clone().subtract(1, "days");

    Log.info(`[${this.name}] Week starts: ${startOfWeek.format("YYYY-MM-DD")}, next week starts: ${nextWeek.format("YYYY-MM-DD")}`);

    // Get the full list of meals from Mealie.
    this.mealieApi.get("/api/groups/mealplans", {
      params: {
        start_date: startOfWeek.format("YYYY-MM-DD"), // eslint-disable-line camelcase
        end_date: lastDayOfWeek.format("YYYY-MM-DD"), // eslint-disable-line camelcase
        orderBy: "date",
        orderDirection: "asc"
      }
    })
      .then((response) => {
        const meals = response.data.items;

        this.sendSocketNotification("MEALIE_MENU_DATA", {
          identifier: config.identifier,
          meals
        });
      })
      .catch((error) => {
        this.sendSocketNotification("MEALIE_ERROR", {
          error: "FETCH_ERROR",
          details: error,
          identifier: config.identifier
        });
      })
      .then(() => {
        this.outstandingRequest = false;
      });
  },

  getFirstDayOfWeek (weekStartsOnMonday) {
    const today = moment();
    let firstDayOfWeek = moment();

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
