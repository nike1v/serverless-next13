"use strict";
/**
 Provides matching capabilities to support custom redirects, rewrites, and headers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchDynamicRoute = exports.matchDynamic = exports.compileDestination = exports.matchPath = void 0;
const path_to_regexp_1 = require("path-to-regexp");
/**
 * Match the given path against a source path.
 * @param path
 * @param source
 */
function matchPath(path, source) {
    const matcher = (0, path_to_regexp_1.match)(source, { decode: decodeURIComponent });
    return matcher(path);
}
exports.matchPath = matchPath;
/**
 * Compile a destination for redirects or rewrites.
 * @param destination
 * @param params
 */
function compileDestination(destination, params) {
    try {
        const destinationLowerCase = destination.toLowerCase();
        if (destinationLowerCase.startsWith("https://") ||
            destinationLowerCase.startsWith("http://")) {
            // Handle external URL redirects
            const { origin, pathname, search } = new URL(destination);
            const toPath = (0, path_to_regexp_1.compile)(pathname, { encode: encodeURIComponent });
            const compiledDestination = `${origin}${toPath(params)}${search}`;
            // Remove trailing slash if original destination didn't have it
            if (!destination.endsWith("/") && compiledDestination.endsWith("/")) {
                return compiledDestination.slice(0, -1);
            }
            else {
                return compiledDestination;
            }
        }
        else {
            // Handle all other paths. Escape all ? in case of query parameters
            const escapedDestination = destination.replace(/\?/g, "\\?");
            const toPath = (0, path_to_regexp_1.compile)(escapedDestination, {
                encode: encodeURIComponent
            });
            return toPath(params);
        }
    }
    catch (error) {
        console.error(`Could not compile destination ${destination}, returning null instead. Error: ${error}`);
        return null;
    }
}
exports.compileDestination = compileDestination;
const matchDynamic = (uri, routes) => {
    for (const { file, regex } of routes) {
        const re = new RegExp(regex, "i");
        if (re.test(uri)) {
            return file;
        }
    }
};
exports.matchDynamic = matchDynamic;
const matchDynamicRoute = (uri, routes) => {
    for (const { route, regex } of routes) {
        const re = new RegExp(regex, "i");
        if (re.test(uri)) {
            return route;
        }
    }
};
exports.matchDynamicRoute = matchDynamicRoute;
