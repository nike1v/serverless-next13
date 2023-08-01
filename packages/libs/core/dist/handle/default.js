"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDefault = exports.renderRoute = void 0;
const error_1 = require("./error");
const headers_1 = require("./headers");
const redirect_1 = require("./redirect");
const request_1 = require("./request");
const route_1 = require("../route");
const locale_1 = require("../route/locale");
const unauthorized_1 = require("./unauthorized");
const renderRoute = async (event, route, manifest, routesManifest, getPage) => {
    const { req, res } = event;
    (0, headers_1.setCustomHeaders)(event, routesManifest);
    // For SSR rewrites to work the page needs to be passed a localized url
    if (req.url && routesManifest.i18n && !route.isData) {
        req.url = (0, locale_1.addDefaultLocaleToPath)(req.url, routesManifest, (0, locale_1.findDomainLocale)((0, request_1.toRequest)(event), routesManifest));
    }
    // Sets error page status code so _error renders the right page
    if (route.statusCode) {
        res.statusCode = route.statusCode;
    }
    const page = getPage(route.page);
    try {
        if (route.isData) {
            const { renderOpts } = await page.renderReqToHTML(req, res, "passthrough");
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(renderOpts.pageData));
        }
        else if (route.isApi) {
            // do nothing for API routes as they will be handled later
        }
        else {
            await Promise.race([page.render(req, res), event.responsePromise]);
        }
    }
    catch (error) {
        return (0, error_1.renderErrorPage)(error, event, route, manifest, routesManifest, getPage);
    }
};
exports.renderRoute = renderRoute;
/*
 * Handles page and data routes.
 *
 * Returns one of: ExternalRoute, PublicFileRoute, StaticRoute
 * for handling in the caller.
 *
 * If return is void, the response has already been generated in
 * event.res/event.responsePromise which the caller should wait on.
 */
const handleDefault = async (event, manifest, prerenderManifest, routesManifest, getPage) => {
    const request = (0, request_1.toRequest)(event);
    const route = await (0, route_1.routeDefault)(request, manifest, prerenderManifest, routesManifest);
    if (route.querystring) {
        event.req.url = `${event.req.url}${request.querystring ? "&" : "?"}${route.querystring}`;
    }
    if (route.isRedirect) {
        return (0, redirect_1.redirect)(event, route);
    }
    if (route.isRender) {
        return (0, exports.renderRoute)(event, route, manifest, routesManifest, getPage);
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
    if (route.isUnauthorized) {
        return (0, unauthorized_1.unauthorized)(event, route);
    }
    // Let typescript check this is correct type to be returned
    return route;
};
exports.handleDefault = handleDefault;
