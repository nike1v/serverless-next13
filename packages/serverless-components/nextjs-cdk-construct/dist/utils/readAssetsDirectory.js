"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAssetsDirectory = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const pathToPosix_1 = __importDefault(require("./pathToPosix"));
const IMMUTABLE_CACHE_CONTROL_HEADER = "public, max-age=31536000, immutable";
const SERVER_CACHE_CONTROL_HEADER = "public, max-age=0, s-maxage=2678400, must-revalidate";
const DEFAULT_PUBLIC_DIR_CACHE_CONTROL = "public, max-age=31536000, must-revalidate";
const filterNonExistentPathKeys = (config) => {
    return Object.keys(config).reduce((newConfig, nextConfigKey) => ({
        ...newConfig,
        ...(fs_extra_1.default.pathExistsSync(config[nextConfigKey].path)
            ? { [nextConfigKey]: config[nextConfigKey] }
            : {})
    }), {});
};
const readAssetsDirectory = (options) => {
    const { assetsDirectory } = options;
    // Ensure these are posix paths so they are compatible with AWS S3
    const publicFiles = (0, pathToPosix_1.default)(path_1.default.join(assetsDirectory, "public"));
    const staticFiles = (0, pathToPosix_1.default)(path_1.default.join(assetsDirectory, "static"));
    const staticPages = (0, pathToPosix_1.default)(path_1.default.join(assetsDirectory, "static-pages"));
    const nextData = (0, pathToPosix_1.default)(path_1.default.join(assetsDirectory, "_next", "data"));
    const nextStatic = (0, pathToPosix_1.default)(path_1.default.join(assetsDirectory, "_next", "static"));
    return filterNonExistentPathKeys({
        publicFiles: {
            path: publicFiles,
            cacheControl: DEFAULT_PUBLIC_DIR_CACHE_CONTROL
        },
        staticFiles: {
            path: staticFiles,
            cacheControl: DEFAULT_PUBLIC_DIR_CACHE_CONTROL
        },
        staticPages: {
            path: staticPages,
            cacheControl: SERVER_CACHE_CONTROL_HEADER
        },
        nextData: { path: nextData, cacheControl: SERVER_CACHE_CONTROL_HEADER },
        nextStatic: {
            path: nextStatic,
            cacheControl: IMMUTABLE_CACHE_CONTROL_HEADER
        }
    });
};
exports.readAssetsDirectory = readAssetsDirectory;
//# sourceMappingURL=readAssetsDirectory.js.map