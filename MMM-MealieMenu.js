/* global Module, Log, moment */

Module.register("MMM-MealieMenu", {
  requiresVersion: "2.2.0",

  /**
   * These are module defaults and should not be edited here.
   * Set the configuration in config.js.
   */
  defaults: {
    // Mealie instance
    host: "",                          // The URL to your Mealie instance.
    apiKey: "",                        // An API key generated from a user profile in Mealie.
    username: "",                      // The username/email for your Mealie account.
    password: "",                      // The password for your for Mealie account.
    groupId: "",                       // Group ID of the meal plan.

    // Look and Feel
    weekStartsOnMonday: false,         // Show Monday as the first day of the week.
    priorDayLimit: 7,                  // How many previous days of the current week will be displayed.
    priorEntryLimit: 50,               // How many entries from previous days should be shown in total.
    fadePriorEntries: true,            // Fade previous days in the current week.
    showPictures: true,                // Show pictures corresponding to that days meal.
    roundPictureCorners: false,        // Round the meal picture corners.
    defaultPicture: "mealie.png",      // Default image to display for missing recipe images or meal notes.
    showDescription: false,            // Show the recipe/meal description.
    dateFormat: "dddd",                // Display format for the date; uses moment.js format string
    dateMealSeperator: " - ",          // Set the separator between the date and meal type.
    mealSortOrder: ["breakfast", "lunch", "dinner", "side"], // An array determining the order and visibility of the meal type headers.
    mealTypeName: {},                  // An object defining strings which will replacethe meal type header names.
    updateInterval: 60,                // How often should the data be updated in seconds.
    animationSpeed: 500,               // Speed of the update animation in milliseconds.

    // Display last update time
    displayLastUpdate: false,          // Add line after the tasks with the last server update time
    displayLastUpdateFormat: "MMM D - h:mm:ss a" // Format to display the last update; uses moment.js format string
  },

  /**
   * Core method, called when all modules are loaded and the system is ready to boot up.
   */
  start () {
    Log.info(`Starting module: ${this.name} with identifier: ${this.identifier}`);

    this.hidden = false; // Display the module by default
    this.updateInterval = 0; // To stop and start auto update for each module instance
    this.lastUpdate = 0; // Timestamp of the last module update. Set to 0 at start-up

    this.initialized = false;
    this.error = null;
    this.formattedMenuData = null;
    this.dataRefreshTimestamp = null;
    this.dataRefreshDisplayTime = null;

    // Validate host.
    if (!this.config.host || !this.isValidURL(this.config.host)) {
      Log.error(this.translate("ERROR_INVALID", {value: "host"}));
      this.error = this.translate("ERROR_NO_HOST");

      return;
    }

    // Validate API key or username/password.
    if (!this.config.apiKey) {
      Log.info(this.translate("ERROR_INVALID", {value: "apiKey"}));
      Log.info(this.translate("INFO_NO_APIKEY"));

      if (!this.config.username) {
        Log.error(this.translate("ERROR_INVALID", {value: "username"}));
        this.error = this.translate("ERROR_NO_USER");

        return;
      } else if (!this.config.password) {
        Log.error(this.translate("ERROR_INVALID", {value: "password"}));
        this.error = this.translate("ERROR_NO_PASS");

        return;
      }
    }

    // Validate mealSortOrder.
    if (!(
      Array.isArray(this.config.mealSortOrder) &&
      this.config.mealSortOrder.length > 0 &&
      this.config.mealSortOrder.every((value) => this.defaults.mealSortOrder.includes(value))
    )) {
      Log.error(this.translate("ERROR_INVALID", {value: "mealSortOrder"}));
      this.error = this.translate("ERROR_MEAL_SORT_ORDER");

      return;
    }

    this.sanitzeConfig();

    this.sendSocketNotification("MEALIE_INIT", {
      identifier: this.identifier,
      host: this.config.host,
      apiKey: this.config.apiKey,
      username: this.config.username,
      password: this.config.password
    });
  },

  /**
   * Core method, called to request any additional scripts that need to be loaded.
   */
  getScripts () {
    return ["moment.js"];
  },

  /**
   * Core method, called to request any additional stylesheets that need to be loaded.
   */
  getStyles () {
    return ["MMM-MealieMenu.css"];
  },

  /**
   * Core method, called to request translation files that need to be loaded.
   */
  getTranslations () {
    return {
      en: "translations/en.json"
    };
  },

  /**
   * Core method, called to request the template file.
   */
  getTemplate () {
    return "MMM-MealieMenu.njk";
  },

  /**
   * Core method, called when updateDom() is called to render the template.
   */
  getTemplateData () {
    return {
      phrases: {
        loading: this.translate("LOADING"),
        emptyMealPlan: this.translate("MEALIE_EMPTY_MEALPLAN")
      },
      hasError: Boolean(this.error),
      error: this.error,
      loading: this.formattedMenuData === null,
      config: this.config,
      menu: this.formattedMenuData,
      identifier: this.identifier,
      timestamp: this.dataRefreshTimestamp,
      lastUpdated: this.dataRefreshDisplayTime
    };
  },

  /**
   * Core method, called when node_helper sends notifications.
   */
  socketNotificationReceived (notification, payload) {
    if (payload.identifier === this.identifier) {
      const now = moment();

      switch (notification) {
        case "MEALIE_INITIALIZED":
          this.initialized = true;
          this.startFetchingLoop(this.config.updateInterval);

          break;

        case "MEALIE_MENU_DATA":
          this.dataRefreshTimestamp = now.format("x");
          this.dataRefreshDisplayTime = now.format(this.config.displayLastUpdateFormat);

          this.formattedMenuData = {meals: this.formatMeals(payload.meals)};

          // Log.info(this.formattedMenuData);
          this.error = null;
          this.updateDom(this.config.animationSpeed);

          break;

        case "MEALIE_ERROR":
          this.error = this.translate(payload.error);
          this.formattedMenuData = null;
          this.updateDom(this.config.animationSpeed);

          break;
      }
    }
  },

  /**
   * Core method, called when a module is hidden (using the module.hide() method).
   */
  suspend () {
    this.hidden = true;
    Log.info(this.translate("MEALIE_SUSPEND", {name: this.name, identifier: this.identifier}));
    this.gestionUpdateInterval(); // Call the function which manages all the cases
  },

  /**
   * Core method, called when a module is requested to be shown (using the module.show() method).
   */
  resume () {
    this.hidden = false;
    Log.info(this.translate("MEALIE_RESUME", {name: this.name, identifier: this.identifier}));
    this.gestionUpdateInterval();
  },

  /**
   * Disable updates when the module is hidden.
   */
  gestionUpdateInterval () {
    if (this.hidden === false) {
      // Update now and start again the update timer
      this.startFetchingLoop(this.config.updateInterval);
    } else {
      clearInterval(this.updateInterval); // Stop the current update interval
      this.updateInterval = 0; // Reset the variable
    }
  },

  /**
   * Function to fetch data on an interval.
   */
  startFetchingLoop (interval) {
    // Start immediately ...
    this.getData();

    // ... and then repeat in the given interval
    if (this.updateInterval === 0) {
      // If this instance as no auto update defined, then we create one. Otherwise : nothing.

      this.updateInterval = setInterval(() => {
        this.getData();
      }, interval * 1000);
    }
  },

  /**
   * Call the node_Helper to fetch meal plan data from the API.
   */
  getData () {
    this.sendSocketNotification("MEALIE_MENU_GET", {
      identifier: this.identifier,
      host: this.config.host,
      apiKey: this.config.apiKey,
      username: this.config.username,
      password: this.config.password,
      groupId: this.config.groupId,
      weekStartsOnMonday: this.config.weekStartsOnMonday
    });
  },

  /**
   * Sort and parse the API response.
   */
  formatMeals (meals) {
    const today = moment().startOf("day");
    const {mealSortOrder} = this.config;

    // Filter meal types not in mealSortOrder.
    meals.filter((meal) => mealSortOrder.includes(meal.entryType));

    // Sort by date ascending, then by meal type order (can be user defined).
    // eslint-disable-next-line id-length
    meals.sort((a, b) => {
      // Same date, sort by type.
      if (moment(a.date).isSame(b.date)) {
        return mealSortOrder.indexOf(a.entryType) - mealSortOrder.indexOf(b.entryType);
      }

      return moment(a.date).isBefore(b.date)
        ? -1
        : 1;
    });

    const formatted = [];
    for (const meal of meals) {
      formatted.push({
        name: meal.recipe?.name || meal.title,
        description: meal.recipe?.description || meal.text,
        rawDate: meal.date,
        date: moment(meal.date).format(this.config.dateFormat),
        meal: this.typeToMealDisplay(meal.entryType),
        photoUrl: meal.recipe?.id
          ? `${this.config.host}/api/media/recipes/${meal.recipe.id}/images/min-original.webp`
          : "",
        isToday: today.isSame(meal.date),
        shouldFade: this.config.fadePriorEntries && today.isAfter(meal.date)
      });
    }

    return this.filterDaysAndEntries(formatted);
  },

  /**
   * Trim menu based on configured limits.
   */
  filterDaysAndEntries (sortedMenu) {
    const today = moment().startOf("day");
    const reversed = sortedMenu.reverse();
    const filtered = [];
    let entriesBeforeTodayCount = 0;

    for (const meal of reversed) {
      const days = moment(meal.rawDate).diff(today, "days");

      // If days < 0, this is a previous entry. The config may limit how many of these we show.
      if (days < 0) {
        entriesBeforeTodayCount += 1;
      }

      // days is the number of days between today and this menu items date; a negative value for past items.
      // Add it to our result set if it is 0+ (today or in the future), and if this.config.priorDayLimit + days is 0+.
      // days >= 0 can just be rolled into the priorDayLimit check.
      // Example: priorDayLimit: 3, menu two days ago -> days: -2, 3 + -2 = 1, add it to the result.
      //
      // Additionally, only show max this.config.priorEntryLimit.
      if (this.config.priorDayLimit + days >= 0 && this.config.priorEntryLimit >= entriesBeforeTodayCount) {
        filtered.push(meal);
      }
    }

    return filtered.reverse();
  },

  /**
   * Convert meal type to display value. Can be overridden via config.
   */
  typeToMealDisplay (type) {
    const replacements = this.config.mealTypeName;
    const mealTypes = this.translate("MEAL_TYPES");
    let value;

    if (type === null || type === "") {
      return value;
    }

    if (Object.keys(replacements).includes(type)) {
      // Replace meal type with custom value.
      value = replacements[type];
    } else if (Object.keys(mealTypes).includes(type)) {
      // Replace meal type with localized value.
      value = mealTypes[type];
    } else {
      // Capitalize first letter.
      value = type.toString().replace(/\w\S*/gu, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

    return value;
  },

  /**
   * Assert values for configuration.
   */
  sanitzeConfig () {
    // Strip trailing slashes.
    this.config.host = this.config.host.replace(/\/$/u, "");

    // Check for an external default image.
    if (
      !this.config.defaultPicture.startsWith("http") &&
      !this.config.defaultPicture.includes("/")
    ) {
      this.config.defaultPicture = this.file(this.config.defaultPicture);
    }

    if (this.config.priorDayLimit < 0) {
      this.config.priorDayLimit = 0;
      Log.warn("priorDayLimit should be 0 or greater. Setting to 0.");
    }

    if (this.config.priorEntryLimit < 0) {
      this.config.priorEntryLimit = 0;
      Log.warn("priorEntryLimit should be 0 or greater. Setting to 0.");
    }

    if (this.config.updateInterval < 1) {
      this.config.updateInterval = 1;
      Log.warn("updateInterval should be 1 or greater. Setting to 1.");
    }
  },

  /**
   * Assert valid URL.
   */
  isValidURL (url) {
    try {
      // eslint-disable-next-line no-new
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  }
});
