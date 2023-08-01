"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setHeadersFromRoute = exports.setCustomHeaders = exports.getCustomHeaders = void 0;
const match_1 = require("../match");
const locale_1 = require("../route/locale");
const getCustomHeaders = (uri, routesManifest) => {
    const localized = (0, locale_1.addDefaultLocaleToPath)(uri, routesManifest);
    const headers = {};
    for (const headerData of routesManifest.headers) {
        if (!(0, match_1.matchPath)(localized, headerData.source)) {
            continue;
        }
        for (const { key, value } of headerData.headers) {
            if (key) {
                // Header overriding behavior as per:
                // https://nextjs.org/docs/api-reference/next.config.js/headers
                headers[key.toLowerCase()] = [{ key, value }];
            }
        }
    }
    return headers;
};
exports.getCustomHeaders = getCustomHeaders;
const setCustomHeaders = (event, routesManifest) => {
    var _a;
    const [uri] = ((_a = event.req.url) !== null && _a !== void 0 ? _a : "").split("?");
    const headers = (0, exports.getCustomHeaders)(uri, routesManifest);
    for (const [{ key, value }] of Object.values(headers)) {
        if (key) {
            event.res.setHeader(key, value);
        }
    }
};
exports.setCustomHeaders = setCustomHeaders;
const setHeadersFromRoute = (event, route) => {
    var _a;
    for (const [key, headers] of Object.entries(route.headers || [])) {
        const keys = headers.map(({ key }) => key);
        const values = headers.map(({ value }) => value).join(";");
        if (values) {
            event.res.setHeader((_a = keys[0]) !== null && _a !== void 0 ? _a : key, values);
        }
    }
};
exports.setHeadersFromRoute = setHeadersFromRoute;
