"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundPage = exports.notFoundData = exports.staticNotFound = void 0;
const locale_1 = require("./locale");
const staticNotFound = (uri, manifest, routesManifest) => {
    const localePrefix = (0, locale_1.getLocalePrefixFromUri)(uri, routesManifest);
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
exports.staticNotFound = staticNotFound;
const notFoundData = (uri, manifest, routesManifest) => {
    return ((0, exports.staticNotFound)(uri, manifest, routesManifest) || {
        isData: true,
        isRender: true,
        page: "pages/_error.js",
        statusCode: 404
    });
};
exports.notFoundData = notFoundData;
const notFoundPage = (uri, manifest, routesManifest) => {
    return ((0, exports.staticNotFound)(uri, manifest, routesManifest) || {
        isData: false,
        isRender: true,
        page: "pages/_error.js",
        statusCode: 404
    });
};
exports.notFoundPage = notFoundPage;
