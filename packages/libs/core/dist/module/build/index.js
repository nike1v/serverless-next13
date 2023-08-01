import { isDynamicRoute, isOptionalCatchAllRoute } from "./isDynamicRoute";
import { normaliseDomainRedirects } from "./normaliseDomainRedirects";
import { pathToRegexStr } from "./pathToRegexStr";
import { getSortedRoutes } from "./sortedRoutes";
import { usedSSR } from "./ssr";
export const prepareBuildManifests = async (buildOptions, nextConfig, routesManifest, pagesManifest, prerenderManifest, publicFiles) => {
    var _a, _b, _c, _d;
    const { authentication, buildId, domainRedirects: unnormalisedDomainRedirects } = buildOptions;
    const separateApiLambda = (_a = (!buildOptions.useV2Handler && buildOptions.separateApiLambda)) !== null && _a !== void 0 ? _a : true;
    const domainRedirects = normaliseDomainRedirects(unnormalisedDomainRedirects);
    const pageManifest = {
        buildId,
        pages: {
            dynamic: [],
            ssr: {
                dynamic: {},
                nonDynamic: {}
            },
            html: {
                dynamic: {},
                nonDynamic: {}
            },
            ssg: {
                dynamic: {},
                nonDynamic: {},
                notFound: {}
            }
        },
        publicFiles: {},
        trailingSlash: (_b = nextConfig === null || nextConfig === void 0 ? void 0 : nextConfig.trailingSlash) !== null && _b !== void 0 ? _b : false,
        domainRedirects,
        authentication,
        hasApiPages: false
    };
    const apiManifest = {
        apis: {
            dynamic: [],
            nonDynamic: {}
        },
        domainRedirects,
        authentication
    };
    const allSsrPages = pageManifest.pages.ssr;
    const ssgPages = pageManifest.pages.ssg;
    const htmlPages = pageManifest.pages.html;
    const apiPages = apiManifest.apis;
    const dynamicApi = {};
    const isHtmlPage = (path) => path.endsWith(".html");
    const isApiPage = (path) => {
        return path.startsWith("pages/api");
    };
    Object.entries(pagesManifest).forEach(([route, pageFile]) => {
        // Check for optional catch all dynamic routes vs. other types of dynamic routes
        // We also add another route without dynamic parameter for optional catch all dynamic routes
        const isOptionalCatchAllDynamicRoute = isOptionalCatchAllRoute(route);
        const isOtherDynamicRoute = !isOptionalCatchAllDynamicRoute && isDynamicRoute(route);
        // the base path of optional catch-all without parameter
        const optionalBaseRoute = isOptionalCatchAllDynamicRoute
            ? route.split("/[[")[0] || "/"
            : "";
        // To easily track whether default handler has any API pages
        if (!pageManifest.hasApiPages && isApiPage(pageFile)) {
            pageManifest.hasApiPages = true;
        }
        if (isHtmlPage(pageFile)) {
            if (isOtherDynamicRoute) {
                htmlPages.dynamic[route] = pageFile;
            }
            else if (isOptionalCatchAllDynamicRoute) {
                htmlPages.dynamic[route] = pageFile;
                htmlPages.nonDynamic[optionalBaseRoute] = pageFile;
            }
            else {
                htmlPages.nonDynamic[route] = pageFile;
            }
        }
        else if (separateApiLambda && isApiPage(pageFile)) {
            // We only want to put API pages in a separate manifest when separateApiLambda is set to true
            if (isOtherDynamicRoute) {
                dynamicApi[route] = {
                    file: pageFile,
                    regex: pathToRegexStr(route)
                };
            }
            else if (isOptionalCatchAllDynamicRoute) {
                dynamicApi[route] = {
                    file: pageFile,
                    regex: pathToRegexStr(route)
                };
                apiPages.nonDynamic[optionalBaseRoute] = pageFile;
            }
            else {
                apiPages.nonDynamic[route] = pageFile;
            }
        }
        else if (isOtherDynamicRoute) {
            allSsrPages.dynamic[route] = pageFile;
        }
        else if (isOptionalCatchAllDynamicRoute) {
            allSsrPages.dynamic[route] = pageFile;
            allSsrPages.nonDynamic[optionalBaseRoute] = pageFile;
        }
        else {
            allSsrPages.nonDynamic[route] = pageFile;
        }
    });
    // Add non-dynamic SSG routes
    Object.entries(prerenderManifest.routes).forEach(([route, ssgRoute]) => {
        const { initialRevalidateSeconds, srcRoute } = ssgRoute;
        ssgPages.nonDynamic[route] = {
            initialRevalidateSeconds,
            srcRoute
        };
    });
    // Add dynamic SSG routes
    Object.entries((_c = prerenderManifest.dynamicRoutes) !== null && _c !== void 0 ? _c : {}).forEach(([route, dynamicSsgRoute]) => {
        const { fallback } = dynamicSsgRoute;
        ssgPages.dynamic[route] = {
            fallback
        };
    });
    // Add not found SSG routes
    const notFound = {};
    ((_d = prerenderManifest.notFoundRoutes) !== null && _d !== void 0 ? _d : []).forEach((route) => {
        notFound[route] = true;
    });
    ssgPages.notFound = notFound;
    // Include only SSR routes that are in runtime use
    const ssrPages = (pageManifest.pages.ssr = usedSSR(pageManifest, routesManifest));
    // Duplicate unlocalized routes for all specified locales.
    // This makes it easy to match locale-prefixed routes in handler
    if (routesManifest.i18n) {
        const localeSsgPages = {
            dynamic: {}
        };
        const localeSsrPages = {
            dynamic: {},
            nonDynamic: {}
        };
        for (const locale of routesManifest.i18n.locales) {
            for (const key in ssrPages.nonDynamic) {
                const newKey = key === "/" ? `/${locale}` : `/${locale}${key}`;
                // Page stays the same, only route changes
                localeSsrPages.nonDynamic[newKey] = ssrPages.nonDynamic[key];
            }
            for (const key in ssrPages.dynamic) {
                const newKey = key === "/" ? `/${locale}` : `/${locale}${key}`;
                // Page stays the same
                localeSsrPages.dynamic[newKey] = ssrPages.dynamic[key];
            }
            for (const key in ssgPages.dynamic) {
                const newKey = key === "/" ? `/${locale}` : `/${locale}${key}`;
                // Only route and fallback need to be localized
                const { fallback, ...rest } = ssgPages.dynamic[key];
                localeSsgPages.dynamic[newKey] = {
                    fallback: fallback && fallback.replace("/", `/${locale}/`),
                    ...rest
                };
            }
        }
        // We need the SSR dynamic pages to still have the keys without the locale
        // so that default locale ISR will work (as it uses non-locale source route as the right SSR page to use)
        for (const key in ssrPages.dynamic) {
            localeSsrPages.dynamic[key] = ssrPages.dynamic[key];
        }
        pageManifest.pages.ssr = {
            dynamic: localeSsrPages.dynamic,
            nonDynamic: localeSsrPages.nonDynamic
        };
        pageManifest.pages.ssg.dynamic = localeSsgPages.dynamic;
    }
    // Sort page routes
    const dynamicRoutes = Object.keys(pageManifest.pages.html.dynamic)
        .concat(Object.keys(pageManifest.pages.ssg.dynamic))
        .concat(Object.keys(pageManifest.pages.ssr.dynamic));
    const sortedRoutes = getSortedRoutes(dynamicRoutes);
    pageManifest.pages.dynamic = sortedRoutes.map((route) => {
        return {
            route: route,
            regex: pathToRegexStr(route)
        };
    });
    // Sort api routes
    const sortedApi = getSortedRoutes(Object.keys(dynamicApi));
    apiManifest.apis.dynamic = sortedApi.map((route) => {
        return {
            file: dynamicApi[route].file,
            regex: pathToRegexStr(route)
        };
    });
    // Public files
    const files = {};
    publicFiles.forEach((file) => {
        files[`/${file}`] = file;
    });
    pageManifest.publicFiles = files;
    // Image manifest
    const imageManifest = {
        authentication,
        domainRedirects: domainRedirects
    };
    return {
        pageManifest,
        apiManifest,
        imageManifest
    };
};
export * from "./types";
