"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathToRegexStr = void 0;
const path_to_regexp_1 = require("path-to-regexp");
/**
 * Convert any dynamic route to express route of the dynamic part.
 * @param dynamicRoute
 */
const expressifyDynamicRoute = (dynamicRoute) => {
    return dynamicRoute
        .replace(/\[\[\.\.\.(.*)]]$/, ":$1*")
        .replace(/\[\.\.\.(.*)]$/, ":$1*")
        .replace(/\[(.*?)]/g, ":$1");
};
/*
 * Convert next.js path to regex
 * Does not handle optional parts!
 */
const pathToRegexStr = (path) => {
    try {
        return (0, path_to_regexp_1.pathToRegexp)(expressifyDynamicRoute(path))
            .toString()
            .replace(/\/(.*)\/\i/, "$1");
    }
    catch (exception) {
        console.error(`Unable to convert path to regex: ${path}. Please check for any special characters.`);
        throw exception;
    }
};
exports.pathToRegexStr = pathToRegexStr;
