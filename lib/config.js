"use strict";

/**
 * Configuration validation and sanitizing. This is loaded in the main script
 * (getScripts, as window.MealieMenuConfig) and node_helper.
 * It MUST not depend on anything from Node or the DOM.
 */
/* eslint-disable max-lines-per-function, max-statements -- UMD wrapper: the whole module lives in the factory */
(function umd (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MealieMenuConfig = factory();
  }
}(typeof self === "undefined"
  ? globalThis
  : self, () => {
  const FONT_SIZES = ["xsmall", "small", "medium", "large", "xlarge"];
  const MEAL_TYPES = ["breakfast", "lunch", "dinner", "side"];

  const MAX_TEXT = 128;
  const MAX_LIST = 100;
  const MAX_FORMAT = 64;

  const BOOLEAN_KEYS = [
    "currentWeek",
    "weekStartsOnMonday",
    "fadePriorEntries",
    "showPictures",
    "roundPictureCorners",
    "groupByDay",
    "showDescription",
    "showTodayLabel",
    "displayLastUpdate"
  ];
  const ENUMS = {
    fontSize: FONT_SIZES,
    template: ["default", "mealie"]
  };
  const NUMBERS = {
    dayLimit: [0, 365],
    priorDayLimit: [0, 365],
    entryLimit: [0, 1000],
    priorEntryLimit: [0, 1000],
    updateInterval: [1, 86400],
    animationSpeed: [0, 5000]
  };
  const FORMAT_KEYS = ["dateFormat", "displayLastUpdateFormat"];
  const ID_KEYS = ["householdId", "groupId"];

  /* eslint-disable no-control-regex */
  const CONTROL_CHARS = /[\u0000-\u001f\u007f]/gu;
  const HTML_CHARS = /[<>]/gu;
  // defaultPicture is placed inside a quoted inline onerror attribute.
  const UNSAFE_PATH = /["'\\<>\u0000-\u001f\u007f]/u;
  const TOKEN = /^[^\s"\\\u0000-\u001f\u007f]{1,256}$/u;
  /* eslint-enable no-control-regex */

  /**
   * Cleans text: strips control characters and HTML characters if requested.
   * @param {string} text The text.
   * @param {number} max The maximum length.
   * @param {boolean} stripHtml Whether to remove < and >.
   * @returns {string} The cleaned text.
   */
  function cleanText (text, max, stripHtml) {
    let out = String(text).replace(CONTROL_CHARS, "");
    if (stripHtml) {
      out = out.replace(HTML_CHARS, "");
    }
    return out.slice(0, max);
  }

  /**
   * Validates and sanitizes the Mealie host URL.
   * @param {*} value The URL to check.
   * @returns {string|null} The URL without credentials, query, hash or trailing slash, or null if invalid.
   */
  function hostUrl (value) {
    if (typeof value !== "string" || value.length > 2048) {
      return null;
    }
    try {
      const url = new URL(value.trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return null;
      }
      return `${url.origin}${url.pathname}`.replace(/\/+$/u, "");
    } catch {
      return null;
    }
  }

  /**
   * Sanitizes and deduplicates a list of strings.
   * @param {*} value The value to check.
   * @param {Function} normalize Function that returns the cleaned item, or null to drop it.
   * @returns {Array|null} The cleaned list, or null if not an array.
   */
  function cleanList (value, normalize) {
    if (!Array.isArray(value)) {
      return null;
    }
    const out = [];
    for (const item of value) {
      const clean = typeof item === "string"
        ? normalize(item)
        : null;
      if (clean && !out.includes(clean) && out.length < MAX_LIST) {
        out.push(clean);
      }
    }
    return out;
  }

  /**
   * Sanitizes the userMapping object into string pairs.
   * @param {*} value The value to check.
   * @returns {Object|null} The cleaned mapping, or null if not a plain object.
   */
  function cleanMapping (value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    const out = {};
    for (const [key, name] of Object.entries(value).slice(0, MAX_LIST)) {
      const cleanKey = cleanText(key, MAX_TEXT, false).trim();
      const cleanName = typeof name === "string"
        ? cleanText(name, MAX_TEXT, true).trim()
        : "";
      if (cleanKey && cleanName && cleanKey !== "__proto__") {
        out[cleanKey] = cleanName;
      }
    }
    return out;
  }

  /**
   * Replaces an invalid value with its default and records a warning.
   * @param {Object} out The result being built ({config, warnings, errors}).
   * @param {string} key The option name.
   * @param {string} reason What is wrong with the value.
   * @returns {void}
   */
  function fallback (out, key, reason) {
    out.warnings.push(`"${key}" ${reason}; using ${JSON.stringify(out.defaults[key])}`);
    out.config[key] = out.defaults[key];
  }

  /**
   * Checks true/false options.
   * @param {Object} source The raw config.
   * @param {Object} out The result being built.
   * @returns {void}
   */
  function checkBooleans (source, out) {
    for (const key of BOOLEAN_KEYS) {
      if (typeof source[key] === "boolean") {
        out.config[key] = source[key];
      } else {
        fallback(out, key, "must be true or false");
      }
    }
  }

  /**
   * Checks numeric options, restricts out-of-range values.
   * @param {Object} source The raw config.
   * @param {Object} out The result being built.
   * @returns {void}
   */
  function checkNumbers (source, out) {
    for (const [key, [min, max]] of Object.entries(NUMBERS)) {
      const number = source[key];
      if (typeof number === "number" && Number.isFinite(number)) {
        const limit = Math.min(max, Math.max(min, Math.round(number)));
        out.config[key] = limit;
        if (limit !== number) {
          out.warnings.push(`"${key}" must be a whole number from ${min} to ${max}; using ${limit}`);
        }
      } else {
        fallback(out, key, `must be a number from ${min} to ${max}`);
      }
    }
  }

  /**
    * Checks the enum options, restricts to a set of values.
    * @param {Object} source The raw config.
    * @param {Object} out The result being built.
    * @returns {void}
    */
  function checkEnums (source, out) {
    for (const [key, allowed] of Object.entries(ENUMS)) {
      const value = typeof source[key] === "string"
        ? source[key].trim().toLowerCase()
        : "";
      if (allowed.includes(value)) {
        out.config[key] = value;
      } else {
        fallback(out, key, `must be one of ${allowed.join(", ")}`);
      }
    }
  }

  /**
   * Checks text options: display formats, separator, IDs and the default picture.
   * Output is escaped by the template, so only control characters are removed.
   * @param {Object} source The raw config.
   * @param {Object} out The result being built.
   * @returns {void}
   */
  function checkTexts (source, out) {
    for (const key of FORMAT_KEYS) {
      const value = typeof source[key] === "string"
        ? cleanText(source[key], MAX_FORMAT, false).trim()
        : "";
      if (value) {
        out.config[key] = value;
      } else {
        fallback(out, key, "must be a non-empty format string");
      }
    }

    if (typeof source.dateMealSeperator === "string") {
      out.config.dateMealSeperator = cleanText(source.dateMealSeperator, MAX_TEXT, false);
    } else {
      fallback(out, "dateMealSeperator", "must be text");
    }

    for (const key of ID_KEYS) {
      if (typeof source[key] === "string") {
        out.config[key] = cleanText(source[key], MAX_TEXT, false).trim();
      } else {
        fallback(out, key, "must be text");
      }
    }

    const picture = typeof source.defaultPicture === "string"
      ? source.defaultPicture.trim()
      : "";
    if (picture && picture.length <= 2048 && !UNSAFE_PATH.test(picture)) {
      out.config.defaultPicture = picture;
    } else {
      fallback(out, "defaultPicture", "must be a file name or URL without quotes, backslashes or angle brackets");
    }
  }

  /**
   * Checks the meal order list and meal type name replacements.
   * @param {Object} source The raw config.
   * @param {Object} out The result being built.
   * @returns {void}
   */
  function checkLists (source, out) {
    const order = cleanList(source.mealSortOrder, (item) => {
      const type = item.trim().toLowerCase();
      if (MEAL_TYPES.includes(type)) {
        return type;
      }
      out.warnings.push(`"mealSortOrder" entry "${cleanText(item, 30, true)}" is unknown and was ignored (use ${MEAL_TYPES.join(", ")})`);
      return null;
    });
    if (order && order.length > 0) {
      out.config.mealSortOrder = order;
    } else {
      fallback(out, "mealSortOrder", `must be a list containing ${MEAL_TYPES.join(", ")}`);
    }

    const mapping = cleanMapping(source.mealTypeName);
    if (mapping) {
      out.config.mealTypeName = mapping;
    } else {
      fallback(out, "mealTypeName", "must be an object of meal type: display name");
    }
  }

  /**
   * Checks the API key first, then username and password if there is no API key.
   * Whichever is not used is cleared from the sanitized config.
   * @param {Object} source The raw config.
   * @param {Object} out The result being built.
   * @returns {void}
   */
  function checkCredentials (source, out) {
    const apiKey = typeof source.apiKey === "string"
      ? source.apiKey.trim()
      : "";
    Object.assign(out.config, {apiKey: "", username: "", password: ""});

    if (apiKey) {
      if (TOKEN.test(apiKey)) {
        out.config.apiKey = apiKey;
        if (source.username || source.password) {
          out.warnings.push("\"apiKey\" is set, \"username\" and \"password\" are ignored");
        }
      } else {
        out.errors.push({code: "INVALID_APIKEY", message: "\"apiKey\" must not contain spaces, quotes, backslashes or control characters"});
      }
      return;
    }

    const username = typeof source.username === "string"
      ? cleanText(source.username, MAX_TEXT, false).trim()
      : "";
    const password = typeof source.password === "string"
      ? source.password.replace(CONTROL_CHARS, "").slice(0, 256)
      : "";
    Object.assign(out.config, {username, password});
    if (!username) {
      out.errors.push({code: "NO_USERNAME", message: "set \"apiKey\", or \"username\" and \"password\""});
    } else if (!password) {
      out.errors.push({code: "NO_PASSWORD", message: "\"password\" is required when using \"username\""});
    }
  }

  /**
   * Validates and sanitizes the module config.
   * Invalid values are replaced by their defaults and reported as warnings.
   * Problems that make the module unusable (host URL, credentials) are reported as errors.
   * @param {Object} input The config to check (not modified).
   * @param {Object} defaults The module defaults, used in place of invalid values.
   * @returns {{config: Object, warnings: string[], errors: {code: string, message: string}[]}} The sanitized config and any problems.
   */
  function validate (input, defaults) {
    const source = input && typeof input === "object"
      ? input
      : {};
    // Options that are not checked (e.g. styles) pass through unchanged.
    const out = {config: {...source}, defaults: defaults || {}, warnings: [], errors: []};

    checkBooleans(source, out);
    checkNumbers(source, out);
    checkEnums(source, out);
    checkTexts(source, out);
    checkLists(source, out);

    out.config.host = hostUrl(source.host) || "";
    if (!out.config.host) {
      out.errors.push({code: "INVALID_HOST", message: "\"host\" must be a valid http:// or https:// URL"});
    }
    checkCredentials(source, out);

    return out;
  }

  return {validate, MEAL_TYPES};
}));
