import { getLocalePrefixFromUri } from "../route/locale";
export const renderErrorPage = async (error, event, route, manifest, routesManifest, getPage) => {
    var _a;
    console.error(`Error rendering page: ${route.page}. Error:\n${error}\nRendering Next.js error page.`);
    const { req, res } = event;
    const localePrefix = getLocalePrefixFromUri((_a = req.url) !== null && _a !== void 0 ? _a : "", routesManifest);
    // Render static error page if present by returning static route
    const errorRoute = `${localePrefix}/500`;
    const staticErrorPage = manifest.pages.html.nonDynamic[errorRoute] ||
        manifest.pages.ssg.nonDynamic[errorRoute];
    if (staticErrorPage) {
        return {
            isData: route.isData,
            isStatic: true,
            file: `pages${localePrefix}/500.html`,
            statusCode: 500
        };
    }
    else {
        // Set status to 500 so _error.js will render a 500 page
        res.statusCode = 500;
        const errorPage = getPage("./pages/_error.js");
        await Promise.race([errorPage.render(req, res), event.responsePromise]);
    }
};
