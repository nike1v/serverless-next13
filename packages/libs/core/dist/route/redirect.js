"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrailingSlashPath = exports.getRedirectPath = exports.getLanguageRedirectPath = exports.getDomainRedirectPath = exports.createRedirectResponse = void 0;
const http_1 = require("http");
const locale_1 = require("./locale");
const match_1 = require("../match");
const cookie_1 = require("cookie");
/**
 * Create a redirect response with the given status code
 * @param uri
 * @param querystring
 * @param statusCode
 */
function createRedirectResponse(uri, querystring, statusCode) {
    let location;
    // Properly join query strings
    if (querystring) {
        const [uriPath, uriQuery] = uri.split("?");
        location = `${uriPath}?${querystring}${uriQuery ? `&${uriQuery}` : ""}`;
    }
    else {
        location = uri;
    }
    const status = statusCode;
    const statusDescription = http_1.STATUS_CODES[status];
    const refresh = statusCode === 308
        ? [
            // Required for IE11 compatibility
            {
                key: "Refresh",
                value: `0;url=${location}`
            }
        ]
        : [];
    const cacheControl = [
        {
            key: "Cache-Control",
            value: "s-maxage=0"
        }
    ];
    return {
        isRedirect: true,
        status: status,
        statusDescription: statusDescription || "",
        headers: {
            location: [
                {
                    key: "Location",
                    value: location
                }
            ],
            refresh: refresh,
            "cache-control": cacheControl
        }
    };
}
exports.createRedirectResponse = createRedirectResponse;
/**
 * Get a domain redirect such as redirecting www to non-www domain.
 * @param request
 * @param manifest
 */
function getDomainRedirectPath(request, manifest) {
    const hostHeaders = request.headers["host"];
    if (hostHeaders && hostHeaders.length > 0) {
        const host = hostHeaders[0].value;
        const domainRedirects = manifest.domainRedirects;
        if (domainRedirects && domainRedirects[host]) {
            return `${domainRedirects[host]}${request.uri}`;
        }
    }
}
exports.getDomainRedirectPath = getDomainRedirectPath;
/**
 * Redirect from root to locale.
 * @param req
 * @param routesManifest
 * @param manifest
 */
async function getLanguageRedirectPath(req, manifest, routesManifest) {
    var _a, _b, _c;
    // Check for disabled locale detection: https://nextjs.org/docs/advanced-features/i18n-routing#disabling-automatic-locale-detection
    if (((_a = routesManifest.i18n) === null || _a === void 0 ? void 0 : _a.localeDetection) === false) {
        return undefined;
    }
    // Try to get locale domain redirect
    const localeDomainRedirect = await (0, locale_1.getLocaleDomainRedirect)(req, routesManifest);
    if (localeDomainRedirect) {
        return localeDomainRedirect;
    }
    const basePath = routesManifest.basePath;
    const trailingSlash = manifest.trailingSlash;
    const rootUri = basePath ? `${basePath}${trailingSlash ? "/" : ""}` : "/";
    // NEXT_LOCALE in cookie will override any accept-language header
    // per: https://nextjs.org/docs/advanced-features/i18n-routing#leveraging-the-next_locale-cookie
    const headerCookies = req.headers.cookie
        ? (_b = req.headers.cookie[0]) === null || _b === void 0 ? void 0 : _b.value
        : undefined;
    if (req.uri === rootUri && headerCookies) {
        const cookies = (0, cookie_1.parse)(headerCookies);
        const nextLocale = cookies["NEXT_LOCALE"];
        if (nextLocale) {
            return await (0, locale_1.getAcceptLanguageLocale)(nextLocale, manifest, routesManifest);
        }
    }
    const languageHeader = req.headers["accept-language"];
    const acceptLanguage = languageHeader && ((_c = languageHeader[0]) === null || _c === void 0 ? void 0 : _c.value);
    if (req.uri === rootUri && acceptLanguage) {
        return await (0, locale_1.getAcceptLanguageLocale)(acceptLanguage, manifest, routesManifest);
    }
}
exports.getLanguageRedirectPath = getLanguageRedirectPath;
/**
 * Get the redirect of the given path, if it exists.
 * @param request
 * @param routesManifest
 */
function getRedirectPath(request, routesManifest) {
    var _a;
    const path = (0, locale_1.addDefaultLocaleToPath)(request.uri, routesManifest);
    const redirects = (_a = routesManifest.redirects) !== null && _a !== void 0 ? _a : [];
    for (const redirect of redirects) {
        const match = (0, match_1.matchPath)(path, redirect.source);
        if (match) {
            const compiledDestination = (0, match_1.compileDestination)(redirect.destination, match.params);
            if (!compiledDestination) {
                return null;
            }
            return {
                path: compiledDestination,
                statusCode: redirect.statusCode
            };
        }
    }
    return null;
}
exports.getRedirectPath = getRedirectPath;
/**
 * Get a domain redirect such as redirecting www to non-www domain.
 * @param request
 * @param manifest
 */
function getTrailingSlashPath(request, manifest, isFile) {
    const { uri } = request;
    if (isFile) {
        // Data requests and public files with trailing slash URL always get
        // redirected to non-trailing slash URL
        if (uri.endsWith("/")) {
            return uri.slice(0, -1);
        }
    }
    else if (/^\/[^/]/.test(request.uri)) {
        // HTML/SSR pages get redirected based on trailingSlash in next.config.js
        // We do not redirect:
        // Unnormalised URI is "/" or "" as this could cause a redirect loop
        const trailingSlash = manifest.trailingSlash;
        if (!trailingSlash && uri.endsWith("/")) {
            return uri.slice(0, -1);
        }
        if (trailingSlash && !uri.endsWith("/")) {
            return uri + "/";
        }
    }
}
exports.getTrailingSlashPath = getTrailingSlashPath;
