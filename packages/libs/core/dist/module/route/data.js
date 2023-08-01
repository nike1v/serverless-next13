import { addDefaultLocaleToPath } from "./locale";
import { matchDynamicRoute } from "../match";
import { notFoundData } from "./notfound";
/*
 * Get page name from data route
 */
const normaliseDataUri = (uri, buildId) => {
    const prefix = `/_next/data/${buildId}`;
    if (!uri.startsWith(prefix)) {
        return uri;
    }
    return uri
        .slice(prefix.length)
        .replace(/\.json$/, "")
        .replace(/^(\/index)?$/, "/");
};
/*
 * Get full data route uri from page name
 */
const fullDataUri = (uri, buildId) => {
    const prefix = `/_next/data/${buildId}`;
    if (uri === "/") {
        return `${prefix}/index.json`;
    }
    return `${prefix}${uri}.json`;
};
/*
 * Handles a data route
 */
export const handleDataReq = (uri, manifest, routesManifest, isPreview) => {
    var _a, _b, _c;
    const { buildId, pages } = manifest;
    const localeUri = addDefaultLocaleToPath(normaliseDataUri(uri, buildId), routesManifest);
    if (pages.ssg.nonDynamic[localeUri] && !isPreview) {
        const ssg = pages.ssg.nonDynamic[localeUri];
        const route = (_a = ssg.srcRoute) !== null && _a !== void 0 ? _a : localeUri;
        return {
            isData: true,
            isStatic: true,
            file: fullDataUri(localeUri, buildId),
            page: pages.ssr.nonDynamic[route],
            revalidate: ssg.initialRevalidateSeconds
        };
    }
    // Handle encoded ISR data request. Although it's not recommended to use non-URL safe chars, Next.js does handle this case
    const decodedUri = decodeURI(localeUri);
    if (pages.ssg.nonDynamic[decodedUri] && !isPreview) {
        const ssg = pages.ssg.nonDynamic[decodedUri];
        if (ssg.initialRevalidateSeconds) {
            const route = (_b = ssg.srcRoute) !== null && _b !== void 0 ? _b : decodedUri;
            return {
                isData: true,
                isStatic: true,
                file: fullDataUri(localeUri, buildId),
                page: pages.ssr.nonDynamic[route],
                revalidate: ssg.initialRevalidateSeconds
            };
        }
    }
    if (((_c = pages.ssg.notFound) !== null && _c !== void 0 ? _c : {})[localeUri] && !isPreview) {
        return notFoundData(uri, manifest, routesManifest);
    }
    if (pages.ssr.nonDynamic[localeUri]) {
        return {
            isData: true,
            isRender: true,
            page: pages.ssr.nonDynamic[localeUri]
        };
    }
    const dynamic = matchDynamicRoute(localeUri, pages.dynamic);
    const dynamicSSG = dynamic && pages.ssg.dynamic[dynamic];
    if (dynamicSSG && !isPreview) {
        return {
            isData: true,
            isStatic: true,
            file: fullDataUri(localeUri, buildId),
            page: dynamic ? pages.ssr.dynamic[dynamic] : undefined,
            fallback: dynamicSSG.fallback
        };
    }
    const dynamicSSR = dynamic && pages.ssr.dynamic[dynamic];
    if (dynamicSSR) {
        return {
            isData: true,
            isRender: true,
            page: dynamicSSR
        };
    }
    return notFoundData(uri, manifest, routesManifest);
};
