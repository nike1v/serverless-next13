"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadStaticAssetsFromBuild = exports.deleteOldStaticAssets = exports.getAssetDirectoryFileCachePolicies = void 0;
const path_1 = __importDefault(require("path"));
const readDirectoryFiles_1 = __importDefault(require("./lib/readDirectoryFiles"));
const constants_1 = require("./lib/constants");
const s3_1 = __importDefault(require("./lib/s3"));
const pathToPosix_1 = __importDefault(require("./lib/pathToPosix"));
const getPublicAssetCacheControl_1 = __importDefault(require("./lib/getPublicAssetCacheControl"));
const getAssetDirectoryFileCachePolicies = (options) => {
    const { basePath, publicDirectoryCache, serverlessBuildOutDir } = options;
    const normalizedBasePath = basePath ? basePath.slice(1) : "";
    const assetsOutputDirectory = path_1.default.join(serverlessBuildOutDir, "assets");
    const buildIdPath = path_1.default.join(assetsOutputDirectory, normalizedBasePath, "BUILD_ID");
    const buildIdUpload = {
        path: buildIdPath,
        cacheControl: undefined
    };
    const nextStaticFiles = (0, readDirectoryFiles_1.default)(path_1.default.join(assetsOutputDirectory, normalizedBasePath, "_next", "static"));
    const nextStaticFilesUploads = nextStaticFiles.map((fileItem) => ({
        path: fileItem.path,
        cacheControl: constants_1.IMMUTABLE_CACHE_CONTROL_HEADER
    }));
    const nextDataFiles = (0, readDirectoryFiles_1.default)(path_1.default.join(assetsOutputDirectory, normalizedBasePath, "_next", "data"));
    const nextDataFilesUploads = nextDataFiles.map((fileItem) => ({
        path: fileItem.path,
        cacheControl: constants_1.SERVER_CACHE_CONTROL_HEADER
    }));
    const htmlPages = (0, readDirectoryFiles_1.default)(path_1.default.join(assetsOutputDirectory, normalizedBasePath, "static-pages"));
    const htmlPagesUploads = htmlPages.map((fileItem) => {
        const isDynamicFallback = /\[.*]/.test(fileItem.path);
        if (isDynamicFallback) {
            return {
                path: fileItem.path,
                cacheControl: constants_1.SERVER_NO_CACHE_CACHE_CONTROL_HEADER
            };
        }
        else {
            return {
                path: fileItem.path,
                cacheControl: constants_1.SERVER_CACHE_CONTROL_HEADER
            };
        }
    });
    const publicFiles = (0, readDirectoryFiles_1.default)(path_1.default.join(assetsOutputDirectory, normalizedBasePath, "public"));
    const staticFiles = (0, readDirectoryFiles_1.default)(path_1.default.join(assetsOutputDirectory, normalizedBasePath, "static"));
    const publicAndStaticUploads = [...publicFiles, ...staticFiles].map((fileItem) => ({
        path: fileItem.path,
        cacheControl: (0, getPublicAssetCacheControl_1.default)(fileItem.path, publicDirectoryCache)
    }));
    return [
        ...nextStaticFilesUploads,
        ...nextDataFilesUploads,
        ...htmlPagesUploads,
        ...publicAndStaticUploads,
        buildIdUpload
    ].map(({ cacheControl, path: absolutePath }) => ({
        cacheControl,
        path: {
            relative: path_1.default.relative(assetsOutputDirectory, absolutePath),
            absolute: absolutePath
        }
    }));
};
exports.getAssetDirectoryFileCachePolicies = getAssetDirectoryFileCachePolicies;
const uploadStaticAssetsFromBuild = async (options) => {
    const { bucketName, bucketRegion, credentials, basePath, publicDirectoryCache, nextConfigDir } = options;
    const files = getAssetDirectoryFileCachePolicies({
        basePath,
        publicDirectoryCache,
        serverlessBuildOutDir: path_1.default.join(nextConfigDir, ".serverless_nextjs")
    });
    const s3 = await (0, s3_1.default)({
        bucketName,
        bucketRegion,
        credentials: credentials
    });
    return Promise.all(files.map((file) => s3.uploadFile({
        s3Key: (0, pathToPosix_1.default)(file.path.relative),
        filePath: file.path.absolute,
        cacheControl: file.cacheControl
    })));
};
exports.uploadStaticAssetsFromBuild = uploadStaticAssetsFromBuild;
const deleteOldStaticAssets = async (options) => {
    const { bucketName, bucketRegion, basePath } = options;
    const normalizedBasePathPrefix = basePath ? basePath.slice(1) + "/" : "";
    const s3 = await (0, s3_1.default)({
        bucketName,
        bucketRegion,
        credentials: options.credentials
    });
    const buildId = await s3.getFile({
        key: normalizedBasePathPrefix + "BUILD_ID"
    });
    if (buildId) {
        const deleteNextDataFiles = s3.deleteFilesByPattern({
            prefix: `${normalizedBasePathPrefix}_next/data`,
            pattern: new RegExp(`${normalizedBasePathPrefix}_next/data/.+/`),
            excludePattern: new RegExp(`${normalizedBasePathPrefix}_next/data/${buildId}/`)
        });
        const deleteStaticPageFiles = s3.deleteFilesByPattern({
            prefix: `${normalizedBasePathPrefix}static-pages`,
            pattern: new RegExp(`${normalizedBasePathPrefix}static-pages/.+/`),
            excludePattern: new RegExp(`${normalizedBasePathPrefix}static-pages/${buildId}/`)
        });
        await Promise.all([deleteNextDataFiles, deleteStaticPageFiles]);
    }
};
exports.deleteOldStaticAssets = deleteOldStaticAssets;
