"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reduceInvalidationPaths = void 0;
/**
 * We don't need to invalidate sub paths if a parent has a wild card
 * invalidation. i.e. if `/users/*` exists, we don't need to invalidate `/users/details/*`
 */
const reduceInvalidationPaths = (invalidationPaths) => {
    const wildCardDirectories = invalidationPaths
        .filter((invalidationPath) => invalidationPath.endsWith("/*"))
        .map((invalidationPath) => invalidationPath.replace("/*", ""));
    return invalidationPaths.filter((invalidationPath) => {
        return !wildCardDirectories.some((wildCardDirectory) => invalidationPath.startsWith(wildCardDirectory) &&
            invalidationPath !== `${wildCardDirectory}*` &&
            invalidationPath !== `${wildCardDirectory}/*` &&
            wildCardDirectory !== invalidationPath);
    });
};
exports.reduceInvalidationPaths = reduceInvalidationPaths;
//# sourceMappingURL=reduceInvalidationPaths.js.map