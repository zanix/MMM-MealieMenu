"use strict";

const PKG = {name: "MMM-MealieMenu", version: "1.7.0"};

/**
 * Minimal Mealie API client. Node only (uses fetch and Buffer), meant for node_helper.
 * Expects a config already checked by lib/config.js.
 */

const REQUEST_TIMEOUT_MS = 30000;
const TOKEN_EXPIRY_MARGIN_MS = 60000;
const HOUSEHOLDS_MIN_VERSION = "2.0.0";

/**
 * Creates an error for a failed request.
 * @param {string} message The error message.
 * @param {number} [status] The HTTP status, if the server responded.
 * @returns {Error} The error, with a status property when known.
 */
function requestError (message, status) {
  return Object.assign(new Error(message), {status});
}

/**
 * Checks that a version is at least the required version.
 * @param {string} version The version to check, e.g. "v2.3.0".
 * @param {string} required The minimum version, e.g. "v2.0.0".
 * @returns {boolean} True when version >= required.
 */
function versionAtLeast (version, required) {
  const parse = (text) => String(text)
    .replace(/[^0-9.]/gu, "")
    .split(".")
    .map((part) => parseInt(part, 10) || 0);
  const have = parse(version);
  const need = parse(required);
  for (let part = 0; part < Math.max(have.length, need.length); part += 1) {
    const diff = (have[part] || 0) - (need[part] || 0);
    if (diff !== 0) {
      return diff > 0;
    }
  }
  return true;
}

/**
 * Gets the expiration of a JWT.
 * @param {string} token The JWT.
 * @returns {number} Expiration in milliseconds since the epoch, or 0 if it can not be read.
 */
function jwtExpiration (token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return Number(payload.exp) * 1000 || 0;
  } catch {
    return 0;
  }
}

class MealieClient {
  /**
   * @param {Object} config The sanitized module config.
   * @param {string} config.host The Mealie URL without trailing slash.
   * @param {string} [config.apiKey] An API key; used instead of username and password.
   * @param {string} [config.username] The username or email.
   * @param {string} [config.password] The password.
   * @param {Object} [deps] Optional dependencies.
   * @param {Object} [deps.log] Logger with debug, info, warn and error; defaults to a no-op.
   */
  constructor ({host, apiKey, username, password}, deps = {}) {
    this.host = host;
    this.apiKey = apiKey;
    this.username = username;
    this.password = password;
    this.token = apiKey || null;
    this.tokenExpiresAt = 0;
    this.apiVersion = "1.0.0";
    this.log = deps.log || console;
  }

  /**
   * Fetches the server version and authenticates.
   * @returns {Promise<void>} Resolves when ready, rejects with an Error.
   */
  async connect () {
    await this.getVersion();
    await this.ensureToken();
  }

  /**
   * Gets and stores the Mealie server version.
   * @returns {Promise<string>} The version.
   */
  async getVersion () {
    const data = await this.request("/api/app/about", {auth: false});
    this.apiVersion = data.version;
    this.log.info(`[${PKG.name}] Connected to Mealie ${this.apiVersion}`);
    return this.apiVersion;
  }

  /**
   * Logs in with username and password. Not used with an API key.
   * @returns {Promise<void>} Resolves when a token is stored.
   */
  async login () {
    this.log.debug(`[${PKG.name}] Logging in as ${this.username}`);
    const body = new URLSearchParams({username: this.username, password: this.password});
    const data = await this.request("/api/auth/token", {method: "POST", body, auth: false});
    this.token = data.access_token;
    this.tokenExpiresAt = jwtExpiration(this.token);
    if (this.tokenExpiresAt) {
      this.log.info(`[${PKG.name}] Token acquired, expires ${new Date(this.tokenExpiresAt).toISOString()}`);
    } else {
      this.log.warn(`[${PKG.name}] Token has no readable expiry; will log in again on every request`);
    }
  }

  /**
   * Logs in if there is no token or it is expired. API keys do not expire.
   * @returns {Promise<void>}
   */
  async ensureToken () {
    if (this.apiKey) {
      return;
    }
    if (!this.token || Date.now() >= this.tokenExpiresAt - TOKEN_EXPIRY_MARGIN_MS) {
      if (this.token) {
        this.log.info(`[${PKG.name}] Token expired or expiring, refreshing`);
      }
      await this.login();
    }
  }

  /**
   * Gets meal plan entries.
   * @param {Object} options The query.
   * @param {string} options.startDate First day, YYYY-MM-DD.
   * @param {string} options.endDate Last day, YYYY-MM-DD.
   * @param {string} [options.householdId] Household to read.
   * @param {string} [options.groupId] Group to read.
   * @param {string[]} [options.mealTypes] Only return these entry types.
   * @returns {Promise<Object[]>} The meal plan entries.
   */
  async getMealPlan ({startDate, endDate, householdId, groupId, mealTypes}) {
    await this.ensureToken();

    const params = new URLSearchParams({orderBy: "date", orderDirection: "asc"});
    params.append("start_date", startDate);
    params.append("end_date", endDate);
    if (householdId) {
      params.append("household_id", householdId);
    }
    if (groupId) {
      params.append("group_id", groupId);
    }
    if (mealTypes?.length) {
      params.append("queryFilter", `entryType in ["${mealTypes.join("\", \"")}"]`);
    }

    // Mealie 2.0 moved meal plans from groups to households.
    const path = versionAtLeast(this.apiVersion, HOUSEHOLDS_MIN_VERSION)
      ? "/api/households/mealplans"
      : "/api/groups/mealplans";
    this.log.debug(`[${PKG.name}] Meal plan query: ${path}?${params}`);
    const data = await this.request(path, {params});
    this.log.debug(`[${PKG.name}] Received ${data.items.length} meal plan entries`);
    return data.items;
  }

  /**
   * Gets a recipe image.
   * @param {string} recipeId The recipe id.
   * @returns {Promise<{body: Buffer, contentType: string}>} The image bytes and type.
   */
  async getRecipeImage (recipeId) {
    await this.ensureToken();
    const response = await this.request(`/api/media/recipes/${encodeURIComponent(recipeId)}/images/min-original.webp`, {raw: true});
    return {
      body: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") || "image/webp"
    };
  }

  /**
   * Sends a request and returns the successful response.
   * @param {string} path The API path.
   * @param {Object} [options] The request options.
   * @param {string} [options.method] The HTTP method (default GET).
   * @param {URLSearchParams} [options.params] Query string.
   * @param {URLSearchParams} [options.body] Form body.
   * @param {boolean} [options.auth] Send the token (default true).
   * @param {boolean} [options.raw] Return the raw Response instead of parsing JSON (default false).
   * @returns {Promise<Response>} The response; rejects with an Error on failure.
   */
  async request (path, {method = "GET", params, body, auth = true, raw = false} = {}) {
    const url = new URL(`${this.host}${path}`);
    if (params) {
      url.search = params.toString();
    }
    const headers = {Accept: "application/json"};
    if (auth && this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    this.log.debug(`[${PKG.name}] ${method} ${path}`);
    let response;
    try {
      response = await fetch(url, {method, headers, body, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)});
    } catch (error) {
      const message = error.name === "TimeoutError"
        ? "Request timed out"
        : error.message;
      this.log.warn(`${method} ${path} failed: ${message}`);
      throw requestError(message);
    }
    this.log.debug(`[${PKG.name}] ${method} ${path} -> ${response.status}`);
    if (!response.ok) {
      const message = response.statusText || `HTTP ${response.status}`;
      this.log.warn(`[${PKG.name}] ${method} ${path} failed: ${message}`);
      throw requestError(message, response.status);
    }

    return raw
      ? response
      : response.json();
  }
}

module.exports = {MealieClient, versionAtLeast};
