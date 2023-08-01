"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readInvalidationPathsFromManifest = void 0;
const path = __importStar(require("path"));
const dynamicPathToInvalidationPath = (dynamicPath) => {
    // Match "/:", "/[" or "/[[..."
    // Only the last one indicates an optional catch-all group,
    // where a route without both the the group and the slash matches.
    // E.g. /pages/[[...slug]] matches on /pages and /pages/foo
    const firstSplit = dynamicPath.match(/\/(:|\[(\[\.\.\.)?)/);
    const [firstSegment] = dynamicPath.split(/\/[:[]/);
    if (firstSplit && firstSplit[0] === "/[[...") {
        // If the firstSplit is the optional catch-all,
        // append the wildcard directly (without a slash)
        return (firstSegment || "/") + "*";
    }
    // Ensure this is posix path as CloudFront needs forward slash in invalidation
    return path.posix.join(firstSegment || "/", "*");
};
const readInvalidationPathsFromManifest = (manifest) => {
    var _a, _b;
    return [
        ...Object.keys(manifest.pages.html.dynamic).map(dynamicPathToInvalidationPath),
        ...Object.keys(manifest.pages.html.nonDynamic),
        ...Object.keys(manifest.pages.ssr.dynamic).map(dynamicPathToInvalidationPath),
        ...Object.keys(manifest.pages.ssr.nonDynamic),
        ...Object.keys(((_a = manifest.pages.ssg) === null || _a === void 0 ? void 0 : _a.dynamic) || {}).map(dynamicPathToInvalidationPath),
        ...Object.keys(((_b = manifest.pages.ssg) === null || _b === void 0 ? void 0 : _b.nonDynamic) || {})
    ];
};
exports.readInvalidationPathsFromManifest = readInvalidationPathsFromManifest;
//# sourceMappingURL=readInvalidationPathsFromManifest.js.map