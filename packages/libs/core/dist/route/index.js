"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeDefault = exports.routeApi = exports.handlePublicFiles = exports.handleNextStaticFiles = exports.handleDomainRedirects = exports.handleAuth = void 0;
const api_1 = require("./api");
const auth_1 = require("./auth");
const basepath_1 = require("./basepath");
const data_1 = require("./data");
const page_1 = require("./page");
const preview_1 = require("./preview");
const redirect_1 = require("./redirect");
const handleAuth = (req, manifest) => {
    const { headers } = req;
    return (0, auth_1.getUnauthenticatedResponse)(headers.authorization, manifest.authentication);
};
exports.handleAuth = handleAuth;
const handleCustomRedirects = (req, routesManifest) => {
    const redirect = (0, redirect_1.getRedirectPath)(req, routesManifest);
    if (redirect) {
        const { path, statusCode } = redirect;
        return (0, redirect_1.createRedirectResponse)(path, req.querystring, statusCode);
    }
};
const handleDomainRedirects = (req, manifest) => {
    const path = (0, redirect_1.getDomainRedirectPath)(req, manifest);
    if (path) {
        return (0, redirect_1.createRedirectResponse)(path, req.querystring, 308);
    }
};
exports.handleDomainRedirects = handleDomainRedirects;
const handleLanguageRedirect = async (req, manifest, routesManifest) => {
    const languageRedirectUri = await (0, redirect_1.getLanguageRedirectPath)(req, manifest, routesManifest);
    if (languageRedirectUri) {
        return (0, redirect_1.createRedirectResponse)(languageRedirectUri, req.querystring, 307);
    }
};
const handleNextStaticFiles = (uri) => {
    if (uri.startsWith("/_next/static")) {
        return {
            isNextStaticFile: true,
            file: uri
        };
    }
};
exports.handleNextStaticFiles = handleNextStaticFiles;
const handlePublicFiles = (uri, manifest) => {
    const decodedUri = decodeURI(uri);
    const isPublicFile = manifest.publicFiles && manifest.publicFiles[decodedUri];
    if (isPublicFile) {
        return {
            isPublicFile: true,
            file: uri
        };
    }
};
exports.handlePublicFiles = handlePublicFiles;
const handleTrailingSlash = (req, manifest, isFile) => {
    const path = (0, redirect_1.getTrailingSlashPath)(req, manifest, isFile);
    if (path) {
        return (0, redirect_1.createRedirectResponse)(path, req.querystring, 308);
    }
};
/*
 * Routes:
 * - auth
 * - redirects
 * - api routes
 * - rewrites (external and api)
 */
const routeApi = (req, manifest, routesManifest) => {
    const auth = (0, exports.handleAuth)(req, manifest);
    if (auth) {
        return auth;
    }
    const redirect = (0, exports.handleDomainRedirects)(req, manifest) ||
        handleCustomRedirects(req, routesManifest);
    if (redirect) {
        return redirect;
    }
    return (0, api_1.handleApiReq)(req, req.uri, manifest, routesManifest);
};
exports.routeApi = routeApi;
/*
 * Routes:
 * - auth
 * - redirects
 * - public files
 * - data routes
 * - pages
 * - rewrites (external and page)
 */
const routeDefault = async (req, manifest, prerenderManifest, routesManifest) => {
    const auth = (0, exports.handleAuth)(req, manifest);
    if (auth) {
        return auth;
    }
    const domainRedirect = (0, exports.handleDomainRedirects)(req, manifest);
    if (domainRedirect) {
        return domainRedirect;
    }
    const { normalisedUri: uri, missingExpectedBasePath } = (0, basepath_1.normalise)(req.uri, routesManifest);
    const is404 = uri.endsWith("/404");
    const isDataReq = uri.startsWith("/_next/data");
    const publicFile = (0, exports.handlePublicFiles)(uri, manifest);
    const isPublicFile = !!publicFile;
    const nextStaticFile = (0, exports.handleNextStaticFiles)(uri);
    const isNextStaticFile = !!nextStaticFile;
    // Only try to handle trailing slash redirects or public files if the URI isn't missing a base path.
    // This allows us to handle redirects without base paths.
    if (!missingExpectedBasePath) {
        const trailingSlash = !is404 &&
            handleTrailingSlash(req, manifest, isDataReq || isPublicFile || isNextStaticFile);
        if (trailingSlash) {
            return trailingSlash;
        }
        if (publicFile) {
            return publicFile;
        }
        if (nextStaticFile) {
            return nextStaticFile;
        }
    }
    const otherRedirect = handleCustomRedirects(req, routesManifest) ||
        (await handleLanguageRedirect(req, manifest, routesManifest));
    if (otherRedirect) {
        return otherRedirect;
    }
    const isPreview = await (0, preview_1.isValidPreviewRequest)(req.headers.cookie, prerenderManifest.preview.previewModeSigningKey);
    if (isDataReq) {
        return (0, data_1.handleDataReq)(uri, manifest, routesManifest, isPreview);
    }
    else {
        return (0, page_1.handlePageReq)(req, req.uri, manifest, routesManifest, isPreview);
    }
};
exports.routeDefault = routeDefault;
