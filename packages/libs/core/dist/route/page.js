"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePageReq = void 0;
const basepath_1 = require("./basepath");
const locale_1 = require("./locale");
const match_1 = require("../match");
const notfound_1 = require("./notfound");
const rewrite_1 = require("./rewrite");
const pageHtml = (localeUri) => {
    if (localeUri == "/") {
        return "pages/index.html";
    }
    return `pages${localeUri}.html`;
};
const handlePageReq = (req, uri, manifest, routesManifest, isPreview, isRewrite) => {
    var _a, _b, _c;
    const { pages } = manifest;
    const { normalisedUri: localeUri, missingExpectedBasePath } = (0, basepath_1.normalise)((0, locale_1.addDefaultLocaleToPath)(uri, routesManifest, (0, locale_1.findDomainLocale)(req, routesManifest)), routesManifest);
    // This allows matching against rewrites even without basepath
    if (!missingExpectedBasePath) {
        if (pages.html.nonDynamic[localeUri]) {
            const nonLocaleUri = (0, locale_1.dropLocaleFromPath)(localeUri, routesManifest);
            const statusCode = nonLocaleUri === "/404"
                ? 404
                : nonLocaleUri === "/500"
                    ? 500
                    : undefined;
            return {
                isData: false,
                isStatic: true,
                file: pages.html.nonDynamic[localeUri],
                statusCode
            };
        }
        if (pages.ssg.nonDynamic[localeUri] && !isPreview) {
            const ssg = pages.ssg.nonDynamic[localeUri];
            const route = (_a = ssg.srcRoute) !== null && _a !== void 0 ? _a : localeUri;
            const nonLocaleUri = (0, locale_1.dropLocaleFromPath)(localeUri, routesManifest);
            const statusCode = nonLocaleUri === "/404"
                ? 404
                : nonLocaleUri === "/500"
                    ? 500
                    : undefined;
            return {
                isData: false,
                isStatic: true,
                file: pageHtml(localeUri),
                // page JS path is from SSR entries in manifest
                page: pages.ssr.nonDynamic[route] || pages.ssr.dynamic[route],
                revalidate: ssg.initialRevalidateSeconds,
                statusCode
            };
        }
        // Handle ISR pages with encoded URL
        // This only applies to ISR, other pages should not be resolved if sent with encoded characters (same as local Next.js server behavior)
        const decodedLocaleUri = decodeURI(localeUri);
        if (pages.ssg.nonDynamic[decodedLocaleUri] && !isPreview) {
            const ssg = pages.ssg.nonDynamic[decodedLocaleUri];
            if (ssg.initialRevalidateSeconds) {
                const route = (_b = ssg.srcRoute) !== null && _b !== void 0 ? _b : decodedLocaleUri;
                const nonLocaleUri = (0, locale_1.dropLocaleFromPath)(decodedLocaleUri, routesManifest);
                const statusCode = nonLocaleUri === "/404"
                    ? 404
                    : nonLocaleUri === "/500"
                        ? 500
                        : undefined;
                return {
                    isData: false,
                    isStatic: true,
                    file: pageHtml(localeUri),
                    // page JS path is from SSR entries in manifest
                    page: pages.ssr.nonDynamic[route] || pages.ssr.dynamic[route],
                    revalidate: ssg.initialRevalidateSeconds,
                    statusCode
                };
            }
        }
        if (((_c = pages.ssg.notFound) !== null && _c !== void 0 ? _c : {})[localeUri] && !isPreview) {
            return (0, notfound_1.notFoundPage)(uri, manifest, routesManifest);
        }
        if (pages.ssr.nonDynamic[localeUri]) {
            if (localeUri.startsWith("/api/")) {
                return {
                    isApi: true,
                    page: pages.ssr.nonDynamic[localeUri]
                };
            }
            else {
                return {
                    isData: false,
                    isRender: true,
                    page: pages.ssr.nonDynamic[localeUri]
                };
            }
        }
    }
    const rewrite = !isRewrite && (0, rewrite_1.getRewritePath)(req, uri, routesManifest, manifest);
    if (rewrite) {
        const [path, querystring] = rewrite.split("?");
        if ((0, rewrite_1.isExternalRewrite)(path)) {
            return {
                isExternal: true,
                path,
                querystring
            };
        }
        const route = (0, exports.handlePageReq)(req, path, manifest, routesManifest, isPreview, true);
        return {
            ...route,
            querystring
        };
    }
    // We don't want to match URIs with missing basepath against dynamic routes if it wasn't already covered by rewrite.
    if (!missingExpectedBasePath) {
        const dynamic = (0, match_1.matchDynamicRoute)(localeUri, pages.dynamic);
        const dynamicSSG = dynamic && pages.ssg.dynamic[dynamic];
        if (dynamicSSG && !isPreview) {
            return {
                isData: false,
                isStatic: true,
                file: pageHtml(localeUri),
                page: dynamic ? pages.ssr.dynamic[dynamic] : undefined,
                fallback: dynamicSSG.fallback
            };
        }
        const dynamicSSR = dynamic && pages.ssr.dynamic[dynamic];
        if (dynamicSSR) {
            if (dynamic.startsWith("/api/")) {
                return {
                    isApi: true,
                    page: dynamicSSR
                };
            }
            else {
                return {
                    isData: false,
                    isRender: true,
                    page: dynamicSSR
                };
            }
        }
        const dynamicHTML = dynamic && pages.html.dynamic[dynamic];
        if (dynamicHTML) {
            return {
                isData: false,
                isStatic: true,
                file: dynamicHTML
            };
        }
    }
    return (0, notfound_1.notFoundPage)(uri, manifest, routesManifest);
};
exports.handlePageReq = handlePageReq;
