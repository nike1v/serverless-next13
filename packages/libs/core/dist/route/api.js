"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleApiReq = void 0;
const basepath_1 = require("./basepath");
const locale_1 = require("./locale");
const match_1 = require("../match");
const rewrite_1 = require("./rewrite");
const handleApiReq = (req, uri, manifest, routesManifest, isRewrite) => {
    const { apis } = manifest;
    const { normalisedUri, missingExpectedBasePath } = (0, basepath_1.normalise)(uri, routesManifest);
    if (!missingExpectedBasePath) {
        const nonDynamic = apis.nonDynamic[normalisedUri];
        if (nonDynamic) {
            return {
                isApi: true,
                page: nonDynamic
            };
        }
    }
    const rewrite = !isRewrite && (0, rewrite_1.getRewritePath)(req, uri, routesManifest);
    if (rewrite) {
        // Rewrites include locales even for api routes
        const apiRewrite = (0, locale_1.dropLocaleFromPath)(rewrite, routesManifest);
        const [path, querystring] = apiRewrite.split("?");
        if ((0, rewrite_1.isExternalRewrite)(path)) {
            return {
                isExternal: true,
                path,
                querystring
            };
        }
        const route = (0, exports.handleApiReq)(req, path, manifest, routesManifest, true);
        if (route) {
            return {
                ...route,
                querystring
            };
        }
        return route;
    }
    if (!missingExpectedBasePath) {
        const dynamic = (0, match_1.matchDynamic)(normalisedUri, apis.dynamic);
        if (dynamic) {
            return {
                isApi: true,
                page: dynamic
            };
        }
    }
};
exports.handleApiReq = handleApiReq;
