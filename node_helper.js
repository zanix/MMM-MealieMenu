const NodeHelper = require("node_helper");
const Log = require("logger");
const moment = require("moment");

// Example result from mealplans API see example_data.json.

module.exports = NodeHelper.create({
  start () {
    Log.log(`Starting node_helper for module [${this.name}]`);
    this.token = null;
    this.outstandingRequest = false;
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "MEALIE_INIT":
        // Use API Key or fetch a token.
        if (payload.apiKey) {
          this.token = payload.apiKey;
          this.initComplete(payload);
        } else {
          this.getToken(payload);
        }
        break;

      case "MEALIE_MENU_GET":
        this.getMeals(payload);
        break;
    }
  },

  initComplete (config) {
    this.sendSocketNotification("MEALIE_INITIALIZED", {
      identifier: config.identifier
    });
  },

  getToken (config) {
    const params = new URLSearchParams();
    params.append("username", config.username);
    params.append("password", config.password);

    fetch(`${config.host}/api/auth/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    })
      .then((response) => {
        if (response.ok) {
          return response;
        }
        throw response.statusText;
      })
      .then((response) => response.json())
      .then((data) => {
        this.token = data.access_token;
        this.initComplete(config);
      })
      .catch((error) => {
        Log.error(`[${this.name}] Auth error:`, JSON.stringify(error));
        this.sendSocketNotification("MEALIE_ERROR", {
          error: "AUTH_ERROR",
          details: error,
          identifier: config.identifier
        });
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

    const url = new URL(`${config.host}/api/groups/mealplans`);

    const params = new URLSearchParams();
    params.append("start_date", startOfWeek.format("YYYY-MM-DD"));
    params.append("end_date", lastDayOfWeek.format("YYYY-MM-DD"));
    params.append("orderBy", "date");
    params.append("orderDirection", "asc");
    if (config.groupId) {
      params.append("group_id", config.groupId);
    }
    url.search = params.toString();

    // Get the full list of meals from Mealie.
    fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.token}`
      }
    })
      .then((response) => {
        if (response.ok) {
          return response;
        }
        throw response.statusText;
      })
      .then((response) => response.json())
      .then((data) => {
        const meals = data.items;
        Log.debug(`[${this.name}] Meals:`, JSON.stringify(meals));

        this.sendSocketNotification("MEALIE_MENU_DATA", {
          identifier: config.identifier,
          meals
        });
      })
      .catch((error) => {
        this.outstandingRequest = false;
        Log.error(`[${this.name}] Fetch error:`, JSON.stringify(error));

        this.sendSocketNotification("MEALIE_ERROR", {
          error: "FETCH_ERROR",
          details: error,
          identifier: config.identifier
        });
      })
      .finally(() => {
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
