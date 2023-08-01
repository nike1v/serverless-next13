import { handleApiReq } from "./api";
import { getUnauthenticatedResponse } from "./auth";
import { normalise } from "./basepath";
import { handleDataReq } from "./data";
import { handlePageReq } from "./page";
import { isValidPreviewRequest } from "./preview";
import { createRedirectResponse, getDomainRedirectPath, getLanguageRedirectPath, getRedirectPath, getTrailingSlashPath } from "./redirect";
export const handleAuth = (req, manifest) => {
    const { headers } = req;
    return getUnauthenticatedResponse(headers.authorization, manifest.authentication);
};
const handleCustomRedirects = (req, routesManifest) => {
    const redirect = getRedirectPath(req, routesManifest);
    if (redirect) {
        const { path, statusCode } = redirect;
        return createRedirectResponse(path, req.querystring, statusCode);
    }
};
export const handleDomainRedirects = (req, manifest) => {
    const path = getDomainRedirectPath(req, manifest);
    if (path) {
        return createRedirectResponse(path, req.querystring, 308);
    }
};
const handleLanguageRedirect = async (req, manifest, routesManifest) => {
    const languageRedirectUri = await getLanguageRedirectPath(req, manifest, routesManifest);
    if (languageRedirectUri) {
        return createRedirectResponse(languageRedirectUri, req.querystring, 307);
    }
};
export const handleNextStaticFiles = (uri) => {
    if (uri.startsWith("/_next/static")) {
        return {
            isNextStaticFile: true,
            file: uri
        };
    }
};
export const handlePublicFiles = (uri, manifest) => {
    const decodedUri = decodeURI(uri);
    const isPublicFile = manifest.publicFiles && manifest.publicFiles[decodedUri];
    if (isPublicFile) {
        return {
            isPublicFile: true,
            file: uri
        };
    }
};
const handleTrailingSlash = (req, manifest, isFile) => {
    const path = getTrailingSlashPath(req, manifest, isFile);
    if (path) {
        return createRedirectResponse(path, req.querystring, 308);
    }
};
/*
 * Routes:
 * - auth
 * - redirects
 * - api routes
 * - rewrites (external and api)
 */
export const routeApi = (req, manifest, routesManifest) => {
    const auth = handleAuth(req, manifest);
    if (auth) {
        return auth;
    }
    const redirect = handleDomainRedirects(req, manifest) ||
        handleCustomRedirects(req, routesManifest);
    if (redirect) {
        return redirect;
    }
    return handleApiReq(req, req.uri, manifest, routesManifest);
};
/*
 * Routes:
 * - auth
 * - redirects
 * - public files
 * - data routes
 * - pages
 * - rewrites (external and page)
 */
export const routeDefault = async (req, manifest, prerenderManifest, routesManifest) => {
    const auth = handleAuth(req, manifest);
    if (auth) {
        return auth;
    }
    const domainRedirect = handleDomainRedirects(req, manifest);
    if (domainRedirect) {
        return domainRedirect;
    }
    const { normalisedUri: uri, missingExpectedBasePath } = normalise(req.uri, routesManifest);
    const is404 = uri.endsWith("/404");
    const isDataReq = uri.startsWith("/_next/data");
    const publicFile = handlePublicFiles(uri, manifest);
    const isPublicFile = !!publicFile;
    const nextStaticFile = handleNextStaticFiles(uri);
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
    const isPreview = await isValidPreviewRequest(req.headers.cookie, prerenderManifest.preview.previewModeSigningKey);
    if (isDataReq) {
        return handleDataReq(uri, manifest, routesManifest, isPreview);
    }
    else {
        return handlePageReq(req, req.uri, manifest, routesManifest, isPreview);
    }
};
