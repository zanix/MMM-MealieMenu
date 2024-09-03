const NodeHelper = require("node_helper");
const Log = require("logger");
const moment = require("moment");

// Example result from mealplans API see example_data.json.

module.exports = NodeHelper.create({
  start () {
    Log.log(`Starting node_helper for module [${this.name}]`);
    this.token = null;
    this.tokenExpiration = null;
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
          this.getToken(payload)
            .then(() => {
              this.initComplete(payload);
            })
            .catch((error) => {
              Log.error(`[${this.name}] Auth error:`, JSON.stringify(error));

              this.sendSocketNotification("MEALIE_ERROR", {
                error: "AUTH_ERROR",
                details: error,
                identifier: payload.identifier
              });
            });
        }
        break;

      case "MEALIE_MENU_GET":
        this.getMeals(payload);
        break;
    }
  },

  initComplete (payload) {
    this.sendSocketNotification("MEALIE_INITIALIZED", {
      identifier: payload.identifier
    });
  },

  getToken (payload) {
    const url = new URL(`${payload.host}/api/auth/token`);
    const params = new URLSearchParams();
    params.append("username", payload.username);
    params.append("password", payload.password);

    return fetch(url, {
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
        // Decode the JWT to update expiration time.
        const decodedToken = this.parseJwt(data.access_token);
        this.tokenExpiration = moment.unix(decodedToken.exp);
      })
      .catch((error) => {
        throw error;
      });
  },

  getMeals (payload) {
    if (this.outstandingRequest === true) {
      Log.info(`[${this.name}] Outstanding request, not trying again.`);
      return;
    }

    // Check for expired token and renew if needed.
    const now = moment();
    if (this.token && now.isAfter(this.tokenExpiration)) {
      Log.info(`[${this.name}] Token expired, refreshing...`);
      this.getToken(payload)
        .then(() => {
          // Call getMeals again after successful refresh.
          this.getMeals(payload);
        })
        .catch((error) => {
          Log.error(`[${this.name}] Auth error:`, JSON.stringify(error));

          this.sendSocketNotification("MEALIE_ERROR", {
            error: "AUTH_ERROR",
            details: error,
            identifier: payload.identifier
          });
        });
      return;
    }

    this.outstandingRequest = true;

    let startDate = moment();
    let endDate = moment();

    if (payload.currentWeek) {
      const startOfWeek = this.getFirstDayOfWeek(payload.weekStartsOnMonday);
      const endOfWeek = startDate.clone().add(6, "days");

      // Find the latest start date.
      startDate = moment.max([
        startOfWeek,
        moment().subtract(payload.priorDayLimit, "days")
      ]);

      // Find the earliest end date.
      endDate = moment.min([
        endOfWeek,
        moment().add(payload.dayLimit, "days")
      ]);
    } else {
      startDate.subtract(payload.priorDayLimit, "days");
      endDate.add(payload.dayLimit, "days");
    }

    Log.info(`[${this.name}] Fetching meals: Start Date ${startDate.format("YYYY-MM-DD")} - End date ${endDate.format("YYYY-MM-DD")}`);

    const url = new URL(`${payload.host}/api/groups/mealplans`);

    const params = new URLSearchParams();
    params.append("start_date", startDate.format("YYYY-MM-DD"));
    params.append("end_date", endDate.format("YYYY-MM-DD"));
    params.append("orderBy", "date");
    params.append("orderDirection", "asc");
    if (payload.groupId) {
      params.append("group_id", payload.groupId);
    }
    if (payload.mealSortOrder && payload.mealSortOrder.length > 0) {
      const mealSortOrder = payload.mealSortOrder.join("\", \"");
      const entryType = `entryType in ["${mealSortOrder}"]`;
      params.append("queryFilter", entryType);
    }

    url.search = params.toString();

    Log.debug(`[${this.name}] API Mealplan query: ${url.search}`);

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
          identifier: payload.identifier,
          meals
        });
      })
      .catch((error) => {
        this.outstandingRequest = false;
        Log.error(`[${this.name}] Fetch error:`, JSON.stringify(error));

        this.sendSocketNotification("MEALIE_ERROR", {
          error: "FETCH_ERROR",
          details: error,
          identifier: payload.identifier
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
  },

  parseJwt (token) {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  }
});
