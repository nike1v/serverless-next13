"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExternalRewrite = exports.getRewritePath = void 0;
const locale_1 = require("./locale");
const match_1 = require("../match");
const page_1 = require("../route/page");
/**
 * Get the rewrite of the given path, if it exists.
 * @param uri
 * @param pageManifest
 * @param routesManifest
 */
function getRewritePath(req, uri, routesManifest, pageManifest) {
    const path = (0, locale_1.addDefaultLocaleToPath)(uri, routesManifest, (0, locale_1.findDomainLocale)(req, routesManifest));
    const rewrites = routesManifest.rewrites;
    for (const rewrite of rewrites) {
        const match = (0, match_1.matchPath)(path, rewrite.source);
        if (!match) {
            continue;
        }
        const params = match.params;
        const destination = (0, match_1.compileDestination)(rewrite.destination, params);
        if (!destination) {
            return;
        }
        // No-op rewrite support for pages: skip to next rewrite if path does not map to existing non-dynamic and dynamic routes
        if (pageManifest && path === destination) {
            const url = (0, page_1.handlePageReq)(req, destination, pageManifest, routesManifest, false, true);
            if (url.statusCode === 404) {
                continue;
            }
        }
        // Pass unused params to destination
        // except nextInternalLocale param since it's already in path prefix
        const querystring = Object.keys(params)
            .filter((key) => key !== "nextInternalLocale")
            .filter((key) => !rewrite.destination.endsWith(`:${key}`) &&
            !rewrite.destination.includes(`:${key}/`))
            .map((key) => {
            const param = params[key];
            if (typeof param === "string") {
                return `${key}=${param}`;
            }
            else {
                return param.map((val) => `${key}=${val}`).join("&");
            }
        })
            .filter((key) => key)
            .join("&");
        if (querystring) {
            const separator = destination.includes("?") ? "&" : "?";
            return `${destination}${separator}${querystring}`;
        }
        return destination;
    }
}
exports.getRewritePath = getRewritePath;
function isExternalRewrite(customRewrite) {
    return (customRewrite.startsWith("http://") || customRewrite.startsWith("https://"));
}
exports.isExternalRewrite = isExternalRewrite;
