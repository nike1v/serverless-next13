import { renderErrorPage } from "./error";
import { renderRoute } from "./default";
import { setCustomHeaders } from "./headers";
import { notFoundPage } from "../route/notfound";
import { renderPageToHtml } from "../utils/renderUtils";
const renderNotFound = async (event, manifest, routesManifest, getPage) => {
    var _a;
    const route = notFoundPage((_a = event.req.url) !== null && _a !== void 0 ? _a : "", manifest, routesManifest);
    if (route.isStatic) {
        return route;
    }
    return await renderRoute(event, route, manifest, routesManifest, getPage);
};
const renderFallback = async (event, route, manifest, routesManifest, getPage) => {
    const { req, res } = event;
    setCustomHeaders(event, routesManifest);
    const page = getPage(route.page);
    try {
        const { html, renderOpts } = await renderPageToHtml(page, req, res, "passthrough");
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
        return renderErrorPage(error, event, route, manifest, routesManifest, getPage);
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
export const handleFallback = async (event, route, manifest, routesManifest, getPage) => {
    // This should not be needed if all SSR routes are handled correctly
    if (route.isRender) {
        return renderRoute(event, route, manifest, routesManifest, getPage);
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
