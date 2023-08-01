import { getLocalePrefixFromUri } from "./locale";
export const staticNotFound = (uri, manifest, routesManifest) => {
    const localePrefix = getLocalePrefixFromUri(uri, routesManifest);
    const notFoundUri = `${localePrefix}/404`;
    const static404 = manifest.pages.html.nonDynamic[notFoundUri] ||
        manifest.pages.ssg.nonDynamic[notFoundUri];
    if (static404) {
        return {
            isData: false,
            isStatic: true,
            file: `pages${notFoundUri}.html`,
            statusCode: 404
        };
    }
};
export const notFoundData = (uri, manifest, routesManifest) => {
    return (staticNotFound(uri, manifest, routesManifest) || {
        isData: true,
        isRender: true,
        page: "pages/_error.js",
        statusCode: 404
    });
};
export const notFoundPage = (uri, manifest, routesManifest) => {
    return (staticNotFound(uri, manifest, routesManifest) || {
        isData: false,
        isRender: true,
        page: "pages/_error.js",
        statusCode: 404
    });
};
