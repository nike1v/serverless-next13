"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleApi = void 0;
const headers_1 = require("./headers");
const notfound_1 = require("./notfound");
const redirect_1 = require("./redirect");
const request_1 = require("./request");
const route_1 = require("../route");
const unauthorized_1 = require("./unauthorized");
/*
 * Handles api routes.
 *
 * Returns ExternalRoute for handling in the caller.
 *
 * If return is void, the response has already been generated in
 * event.res/event.responsePromise which the caller should wait on.
 */
const handleApi = async (event, manifest, routesManifest, getPage) => {
    const request = (0, request_1.toRequest)(event);
    const route = (0, route_1.routeApi)(request, manifest, routesManifest);
    if (!route) {
        return (0, notfound_1.notFound)(event);
    }
    if (route.querystring) {
        event.req.url = `${event.req.url}${request.querystring ? "&" : "?"}${route.querystring}`;
    }
    if (route.isApi) {
        const { page } = route;
        (0, headers_1.setCustomHeaders)(event, routesManifest);
        if (!event.req.hasOwnProperty("originalRequest")) {
            Object.defineProperty(event.req, "originalRequest", {
                get: () => event.req
            });
        }
        if (!event.res.hasOwnProperty("originalResponse")) {
            Object.defineProperty(event.res, "originalResponse", {
                get: () => event.res
            });
        }
        getPage(page).default(event.req, event.res);
        return;
    }
    if (route.isRedirect) {
        return (0, redirect_1.redirect)(event, route);
    }
    if (route.isUnauthorized) {
        return (0, unauthorized_1.unauthorized)(event, route);
    }
    // No if lets typescript check this is ExternalRoute
    return route;
};
exports.handleApi = handleApi;
