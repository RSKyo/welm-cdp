/**
 * Express router wrapper for JSON-style API routes.
 *
 * It merges query and body fields into normalized `data` and `options`, converts
 * simple string values to JavaScript values, and forwards handler errors to
 * Express error middleware.
 *
 * Route handlers normally return data directly; the router sends it as JSON.
 * When a handler needs full response control, it can use `context.req` and
 * `context.res` and return `undefined`.
 *
 * Version: 0.1.0
 * Created: 2026-08-05
 * Last modified: 2026-08-05
 */

import express from "express";

export class ApiRouter {
  #router = express.Router();
  #numberRe = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;

  /**
   * Return the underlying Express router.
   *
   * Pass this value to `app.use()` or another Express router's `use()` method.
   *
   * @returns {import("express").Router}
   */
  get handler() {
    return this.#router;
  }

  /**
   * Register a GET API route.
   *
   * @param {string} path
   * Route path relative to the place where this router is mounted.
   *
   * @param {ApiRequestHandler} handler
   * Request handler receiving `(data, options, { req, res })`.
   *
   * @returns {void}
   */
  get(path, handler) {
    this.#router.get(path, async (req, res, next) => {
      try {
        const { data, options } = this.#resolveData(req);
        const result = await handler(data, options, { req, res });

        if (res.headersSent) {
          return;
        }

        if (result === undefined) {
          res.status(204).end();
          return;
        }

        res.json(result);
      } catch (error) {
        next(this.#toError(error));
      }
    });
  }

  /**
   * Register a POST API route.
   *
   * @param {string} path
   * Route path relative to the place where this router is mounted.
   *
   * @param {ApiRequestHandler} handler
   * Request handler receiving `(data, options, { req, res })`.
   *
   * @returns {void}
   */
  post(path, handler) {
    this.#router.post(path, async (req, res, next) => {
      try {
        const { data, options } = this.#resolveData(req);
        const result = await handler(data, options, { req, res });

        if (res.headersSent) {
          return;
        }

        if (result === undefined) {
          res.status(204).end();
          return;
        }

        res.json(result);
      } catch (error) {
        next(this.#toError(error));
      }
    });
  }

  #resolveData(req) {
    const { data: queryData, options: queryOptions } = this.#pickData(
      req.query,
    );
    const { data: bodyData, options: bodyOptions } = this.#pickData(req.body);

    return {
      data: { ...queryData, ...bodyData },
      options: { ...queryOptions, ...bodyOptions },
    };
  }

  #pickData(input) {
    const data = {};
    const options = {};

    if (!input || !this.#isPlainObject(input)) {
      return { data, options };
    }

    for (const [key, value] of Object.entries(input)) {
      let isOption = false;
      let name = key;

      if (key.startsWith("__")) {
        isOption = true;
        name = key.slice(2);
      }

      if (!name) {
        continue;
      }

      const parsedValue = this.#parseValue(value);

      if (isOption) {
        options[name] = parsedValue;
      } else {
        data[name] = parsedValue;
      }
    }

    return { data, options };
  }

  #parseValue(value) {
    if (Array.isArray(value)) {
      return value.map((item) => this.#parseValue(item));
    }

    if (typeof value !== "string") {
      return value;
    }

    if (this.#numberRe.test(value)) {
      return Number(value);
    }

    if (value.toLowerCase() === "true") {
      return true;
    }

    if (value.toLowerCase() === "false") {
      return false;
    }

    return value;
  }

  #isPlainObject = (value) => {
    if (Object.prototype.toString.call(value) !== "[object Object]") {
      return false;
    }

    const proto = Object.getPrototypeOf(value);

    return proto === Object.prototype || proto === null;
  };

  #toError(error) {
    if (error instanceof Error) {
      return error;
    }

    if (error == null) {
      return new Error("unknown error");
    }

    if (
      typeof error === "object" &&
      typeof error.message === "string" &&
      error.message
    ) {
      return new Error(error.message);
    }

    try {
      return new Error(String(error) || "unknown error");
    } catch {
      return new Error("unknown error");
    }
  }
}
