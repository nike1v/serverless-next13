import { renderErrorPage } from "./error";
import { setCustomHeaders } from "./headers";
import { redirect } from "./redirect";
import { toRequest } from "./request";
import { routeDefault } from "../route";
import { addDefaultLocaleToPath, findDomainLocale } from "../route/locale";
import { unauthorized } from "./unauthorized";
export const renderRoute = async (event, route, manifest, routesManifest, getPage) => {
    const { req, res } = event;
    setCustomHeaders(event, routesManifest);
    // For SSR rewrites to work the page needs to be passed a localized url
    if (req.url && routesManifest.i18n && !route.isData) {
        req.url = addDefaultLocaleToPath(req.url, routesManifest, findDomainLocale(toRequest(event), routesManifest));
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
        return renderErrorPage(error, event, route, manifest, routesManifest, getPage);
    }
};
/*
 * Handles page and data routes.
 *
 * Returns one of: ExternalRoute, PublicFileRoute, StaticRoute
 * for handling in the caller.
 *
 * If return is void, the response has already been generated in
 * event.res/event.responsePromise which the caller should wait on.
 */
export const handleDefault = async (event, manifest, prerenderManifest, routesManifest, getPage) => {
    const request = toRequest(event);
    const route = await routeDefault(request, manifest, prerenderManifest, routesManifest);
    if (route.querystring) {
        event.req.url = `${event.req.url}${request.querystring ? "&" : "?"}${route.querystring}`;
    }
    if (route.isRedirect) {
        return redirect(event, route);
    }
    if (route.isRender) {
        return renderRoute(event, route, manifest, routesManifest, getPage);
    }
    if (route.isApi) {
        const { page } = route;
        setCustomHeaders(event, routesManifest);
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
        return unauthorized(event, route);
    }
    // Let typescript check this is correct type to be returned
    return route;
};
