"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFallback = void 0;
const error_1 = require("./error");
const default_1 = require("./default");
const headers_1 = require("./headers");
const notfound_1 = require("../route/notfound");
const renderUtils_1 = require("../utils/renderUtils");
const renderNotFound = async (event, manifest, routesManifest, getPage) => {
    var _a;
    const route = (0, notfound_1.notFoundPage)((_a = event.req.url) !== null && _a !== void 0 ? _a : "", manifest, routesManifest);
    if (route.isStatic) {
        return route;
    }
    return await (0, default_1.renderRoute)(event, route, manifest, routesManifest, getPage);
};
const renderFallback = async (event, route, manifest, routesManifest, getPage) => {
    const { req, res } = event;
    (0, headers_1.setCustomHeaders)(event, routesManifest);
    const page = getPage(route.page);
    try {
        const { html, renderOpts } = await (0, renderUtils_1.renderPageToHtml)(page, req, res, "passthrough");
        if (renderOpts.isNotFound) {
            if (route.isData) {
                res.setHeader("Content-Type", "application/json");
                res.statusCode = 404;
                res.end(JSON.stringify({ notFound: true }));
                return;
            }
            return renderNotFound(event, manifest, routesManifest, getPage);
        }
        return { isStatic: false, route, html, renderOpts };
    }
    catch (error) {
        return (0, error_1.renderErrorPage)(error, event, route, manifest, routesManifest, getPage);
    }
};
/*
 * Handles fallback routes
 *
 * If route is a blocking fallback or a fallback data route,
 * a Fallback object is returned. It contains the rendered page.
 *
 * Otherwise either a page is rendered (like handleDefault) or
 * returns as StaticRoute for the caller to handle.
 */
const handleFallback = async (event, route, manifest, routesManifest, getPage) => {
    // This should not be needed if all SSR routes are handled correctly
    if (route.isRender) {
        return (0, default_1.renderRoute)(event, route, manifest, routesManifest, getPage);
    }
    if (route.isStatic) {
        const staticRoute = route;
        const shouldRender = (staticRoute.fallback && staticRoute.isData) ||
            staticRoute.fallback === null;
        if (shouldRender && staticRoute.page) {
            const fallback = staticRoute;
            return renderFallback(event, fallback, manifest, routesManifest, getPage);
        }
        if (staticRoute.fallback) {
            return { ...staticRoute, file: `pages${staticRoute.fallback}` };
        }
    }
    return await renderNotFound(event, manifest, routesManifest, getPage);
};
exports.handleFallback = handleFallback;
