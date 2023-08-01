"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getForwardedValues = void 0;
const forwardDefaults = {
    cookies: "none",
    queryString: false
};
function getForwardedValues(config = {}, defaults = {}) {
    const defaultValues = { ...forwardDefaults, ...defaults };
    const { cookies, queryString = defaultValues.queryString, headers, queryStringCacheKeys } = config;
    const forwardCookies = {
        Forward: defaultValues.cookies
    };
    if (typeof cookies === "string") {
        forwardCookies.Forward = cookies;
    }
    else if (Array.isArray(cookies)) {
        forwardCookies.Forward = "whitelist";
        forwardCookies.WhitelistedNames = {
            Quantity: cookies.length,
            Items: cookies
        };
    }
    const forwardHeaders = {
        Quantity: 0,
        Items: []
    };
    if (typeof headers === "string" && headers === "all") {
        forwardHeaders.Quantity = 1;
        forwardHeaders.Items = ["*"];
    }
    else if (Array.isArray(headers)) {
        forwardHeaders.Quantity = headers.length;
        forwardHeaders.Items = headers;
    }
    const forwardQueryKeys = {
        Quantity: 0,
        Items: []
    };
    if (Array.isArray(queryStringCacheKeys)) {
        forwardQueryKeys.Quantity = queryStringCacheKeys.length;
        forwardQueryKeys.Items = queryStringCacheKeys;
    }
    return {
        QueryString: queryString,
        Cookies: forwardCookies,
        Headers: forwardHeaders,
        QueryStringCacheKeys: forwardQueryKeys
    };
}
exports.getForwardedValues = getForwardedValues;
