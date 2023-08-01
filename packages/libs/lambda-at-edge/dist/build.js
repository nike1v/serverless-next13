"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASSETS_DIR = exports.REGENERATION_LAMBDA_CODE_DIR = exports.IMAGE_LAMBDA_CODE_DIR = exports.API_LAMBDA_CODE_DIR = exports.DEFAULT_LAMBDA_CODE_DIR = void 0;
const nft_1 = require("@vercel/nft");
const execa_1 = __importDefault(require("execa"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const path_2 = __importDefault(require("path"));
const pathToPosix_1 = __importDefault(require("@sls-next/core/dist/build/lib/pathToPosix"));
const normalizeNodeModules_1 = __importDefault(require("@sls-next/core/dist/build/lib/normalizeNodeModules"));
const createServerlessConfig_1 = __importDefault(require("@sls-next/core/dist/build/lib/createServerlessConfig"));
const redirector_1 = require("@sls-next/core/dist/build/lib/redirector");
const readDirectoryFiles_1 = __importDefault(require("@sls-next/core/dist/build/lib/readDirectoryFiles"));
const filterOutDirectories_1 = __importDefault(require("@sls-next/core/dist/build/lib/filterOutDirectories"));
const core_1 = require("@sls-next/core");
const next_i18next_1 = require("@sls-next/core/dist/build/third-party/next-i18next");
const normalize_path_1 = __importDefault(require("normalize-path"));
exports.DEFAULT_LAMBDA_CODE_DIR = "default-lambda";
exports.API_LAMBDA_CODE_DIR = "api-lambda";
exports.IMAGE_LAMBDA_CODE_DIR = "image-lambda";
exports.REGENERATION_LAMBDA_CODE_DIR = "regeneration-lambda";
exports.ASSETS_DIR = "assets";
const defaultBuildOptions = {
    args: [],
    cwd: process.cwd(),
    env: {},
    cmd: "./node_modules/.bin/next",
    useServerlessTraceTarget: false,
    logLambdaExecutionTimes: false,
    domainRedirects: {},
    minifyHandlers: false,
    enableHTTPCompression: true,
    authentication: undefined,
    resolve: undefined,
    baseDir: process.cwd(),
    cleanupDotNext: true,
    assetIgnorePatterns: [],
    regenerationQueueName: undefined,
    separateApiLambda: true,
    useV2Handler: false
};
class Builder {
    constructor(nextConfigDir, outputDir, buildOptions, nextStaticDir) {
        this.buildOptions = defaultBuildOptions;
        this.nextConfigDir = path_2.default.resolve(nextConfigDir);
        this.nextStaticDir = path_2.default.resolve(nextStaticDir !== null && nextStaticDir !== void 0 ? nextStaticDir : nextConfigDir);
        this.dotNextDir = path_2.default.join(this.nextConfigDir, ".next");
        this.serverDir = path_2.default.join(this.dotNextDir, "server");
        this.outputDir = outputDir;
        if (buildOptions) {
            this.buildOptions = buildOptions;
        }
    }
    async readPublicFiles(assetIgnorePatterns) {
        const dirExists = await fs_extra_1.default.pathExists((0, path_1.join)(this.nextConfigDir, "public"));
        if (dirExists) {
            const files = await (0, readDirectoryFiles_1.default)((0, path_1.join)(this.nextConfigDir, "public"), assetIgnorePatterns);
            return files
                .map((e) => (0, normalize_path_1.default)(e.path))
                .map((path) => path.replace((0, normalize_path_1.default)(this.nextConfigDir), ""))
                .map((path) => path.replace("/public/", ""));
        }
        else {
            return [];
        }
    }
    async readPagesManifest() {
        const path = (0, path_1.join)(this.serverDir, "pages-manifest.json");
        const hasServerPageManifest = await fs_extra_1.default.pathExists(path);
        if (!hasServerPageManifest) {
            return Promise.reject("pages-manifest not found. Check if project correctly builded");
        }
        return await fs_extra_1.default.readJSON(path);
    }
    copyLambdaHandlerDependencies(fileList, reasons, handlerDirectory, base) {
        return fileList
            .filter((file) => {
            if (file.endsWith(".ts") || file.endsWith(".tsx")) {
                return false;
            }
            const reason = reasons.get(file);
            return ((!reason || reason.type !== "initial") && file !== "package.json");
        })
            .map((filePath) => {
            const resolvedFilePath = path_2.default.resolve((0, path_1.join)(base, filePath));
            const dst = (0, normalizeNodeModules_1.default)(path_2.default.relative(this.serverDir, resolvedFilePath));
            if (resolvedFilePath !== (0, path_1.join)(this.outputDir, handlerDirectory, dst)) {
                return fs_extra_1.default.copy(resolvedFilePath, (0, path_1.join)(this.outputDir, handlerDirectory, dst));
            }
            else {
                return Promise.resolve();
            }
        });
    }
    isSSRJSFile(buildManifest, relativePageFile) {
        if (path_2.default.extname(relativePageFile) === ".js") {
            const page = relativePageFile.startsWith("/")
                ? `pages${relativePageFile}`
                : `pages/${relativePageFile}`;
            if (page === "pages/_error.js" ||
                Object.values(buildManifest.pages.ssr.nonDynamic).includes(page) ||
                Object.values(buildManifest.pages.ssr.dynamic).includes(page)) {
                return true;
            }
        }
        return false;
    }
    async processAndCopyRoutesManifest(source, destination) {
        const routesManifest = require(source);
        routesManifest.redirects = routesManifest.redirects.filter((redirect) => {
            return !(0, redirector_1.isTrailingSlashRedirect)(redirect, routesManifest.basePath);
        });
        await fs_extra_1.default.writeFile(destination, JSON.stringify(routesManifest));
    }
    async processAndCopyHandler(handlerType, destination, shouldMinify) {
        const source = path_2.default.dirname(require.resolve(`@sls-next/lambda-at-edge/dist/${handlerType}/${shouldMinify ? "minified" : "standard"}`));
        await fs_extra_1.default.copy(source, destination);
    }
    async copyTraces(buildManifest, destination) {
        let copyTraces = [];
        if (this.buildOptions.useServerlessTraceTarget) {
            const ignoreAppAndDocumentPages = (page) => {
                const basename = path_2.default.basename(page);
                return basename !== "_app.js" && basename !== "_document.js";
            };
            const allSsrPages = [
                ...Object.values(buildManifest.pages.ssr.nonDynamic),
                ...Object.values(buildManifest.pages.ssr.dynamic)
            ].filter(ignoreAppAndDocumentPages);
            const ssrPages = Object.values(allSsrPages).map((pageFile) => path_2.default.join(this.serverDir, pageFile));
            const base = this.buildOptions.baseDir || process.cwd();
            const { fileList, reasons } = await (0, nft_1.nodeFileTrace)(ssrPages, {
                base,
                resolve: this.buildOptions.resolve
            });
            copyTraces = this.copyLambdaHandlerDependencies(Array.from(fileList), reasons, destination, base);
        }
        await Promise.all(copyTraces);
    }
    async buildDefaultLambda(buildManifest, apiBuildManifest, separateApiLambda, useV2Handler) {
        var _a;
        const hasAPIRoutes = await fs_extra_1.default.pathExists((0, path_1.join)(this.serverDir, "pages/api"));
        return Promise.all([
            this.copyTraces(buildManifest, exports.DEFAULT_LAMBDA_CODE_DIR),
            this.processAndCopyHandler(useV2Handler ? "default-handler-v2" : "default-handler", (0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR), !!this.buildOptions.minifyHandlers),
            ((_a = this.buildOptions) === null || _a === void 0 ? void 0 : _a.handler)
                ? fs_extra_1.default.copy((0, path_1.join)(this.nextConfigDir, this.buildOptions.handler), (0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR, this.buildOptions.handler))
                : Promise.resolve(),
            fs_extra_1.default.writeJson((0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR, "manifest.json"), buildManifest),
            fs_extra_1.default.copy((0, path_1.join)(this.serverDir, "pages"), (0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR, "pages"), {
                filter: (file) => {
                    const isNotPrerenderedHTMLPage = path_2.default.extname(file) !== ".html";
                    const isNotStaticPropsJSONFile = path_2.default.extname(file) !== ".json";
                    const isNotApiPage = separateApiLambda && !useV2Handler
                        ? (0, pathToPosix_1.default)(file).indexOf("pages/api/") === -1 &&
                            !(0, pathToPosix_1.default)(file).endsWith("pages/api")
                        : true;
                    const isNotExcludedJSFile = hasAPIRoutes ||
                        path_2.default.extname(file) !== ".js" ||
                        this.isSSRJSFile(buildManifest, (0, pathToPosix_1.default)(path_2.default.relative(path_2.default.join(this.serverDir, "pages"), file)));
                    return (isNotApiPage &&
                        isNotPrerenderedHTMLPage &&
                        isNotStaticPropsJSONFile &&
                        isNotExcludedJSFile);
                }
            }),
            this.copyJSFiles(exports.DEFAULT_LAMBDA_CODE_DIR),
            this.copyChunks(exports.DEFAULT_LAMBDA_CODE_DIR),
            fs_extra_1.default.copy((0, path_1.join)(this.dotNextDir, "prerender-manifest.json"), (0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR, "prerender-manifest.json")),
            this.processAndCopyRoutesManifest((0, path_1.join)(this.dotNextDir, "routes-manifest.json"), (0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR, "routes-manifest.json")),
            this.runThirdPartyIntegrations((0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR), (0, path_1.join)(this.outputDir, exports.REGENERATION_LAMBDA_CODE_DIR))
        ]);
    }
    async buildApiLambda(apiBuildManifest) {
        var _a;
        let copyTraces = [];
        if (this.buildOptions.useServerlessTraceTarget) {
            const allApiPages = [
                ...Object.values(apiBuildManifest.apis.nonDynamic),
                ...Object.values(apiBuildManifest.apis.dynamic).map((entry) => entry.file)
            ];
            const apiPages = Object.values(allApiPages).map((pageFile) => path_2.default.join(this.serverDir, pageFile));
            const base = this.buildOptions.baseDir || process.cwd();
            const { fileList, reasons } = await (0, nft_1.nodeFileTrace)(apiPages, {
                base,
                resolve: this.buildOptions.resolve
            });
            copyTraces = this.copyLambdaHandlerDependencies(Array.from(fileList), reasons, exports.API_LAMBDA_CODE_DIR, base);
        }
        return Promise.all([
            ...copyTraces,
            this.processAndCopyHandler("api-handler", (0, path_1.join)(this.outputDir, exports.API_LAMBDA_CODE_DIR), !!this.buildOptions.minifyHandlers),
            ((_a = this.buildOptions) === null || _a === void 0 ? void 0 : _a.handler)
                ? fs_extra_1.default.copy((0, path_1.join)(this.nextConfigDir, this.buildOptions.handler), (0, path_1.join)(this.outputDir, exports.API_LAMBDA_CODE_DIR, this.buildOptions.handler))
                : Promise.resolve(),
            fs_extra_1.default.copy((0, path_1.join)(this.serverDir, "pages/api"), (0, path_1.join)(this.outputDir, exports.API_LAMBDA_CODE_DIR, "pages/api")),
            this.copyJSFiles(exports.API_LAMBDA_CODE_DIR),
            this.copyChunks(exports.API_LAMBDA_CODE_DIR),
            fs_extra_1.default.writeJson((0, path_1.join)(this.outputDir, exports.API_LAMBDA_CODE_DIR, "manifest.json"), apiBuildManifest),
            this.processAndCopyRoutesManifest((0, path_1.join)(this.dotNextDir, "routes-manifest.json"), (0, path_1.join)(this.outputDir, exports.API_LAMBDA_CODE_DIR, "routes-manifest.json"))
        ]);
    }
    async buildRegenerationHandler(buildManifest, useV2Handler) {
        await Promise.all([
            this.copyTraces(buildManifest, exports.REGENERATION_LAMBDA_CODE_DIR),
            fs_extra_1.default.writeJson((0, path_1.join)(this.outputDir, exports.REGENERATION_LAMBDA_CODE_DIR, "manifest.json"), buildManifest),
            this.processAndCopyHandler(useV2Handler ? "regeneration-handler-v2" : "regeneration-handler", (0, path_1.join)(this.outputDir, exports.REGENERATION_LAMBDA_CODE_DIR), !!this.buildOptions.minifyHandlers),
            this.copyJSFiles(exports.REGENERATION_LAMBDA_CODE_DIR),
            this.copyChunks(exports.REGENERATION_LAMBDA_CODE_DIR),
            fs_extra_1.default.copy((0, path_1.join)(this.serverDir, "pages"), (0, path_1.join)(this.outputDir, exports.REGENERATION_LAMBDA_CODE_DIR, "pages"), {
                filter: (file) => {
                    const isNotPrerenderedHTMLPage = path_2.default.extname(file) !== ".html";
                    const isNotStaticPropsJSONFile = path_2.default.extname(file) !== ".json";
                    const isNotApiPage = (0, pathToPosix_1.default)(file).indexOf("pages/api") === -1;
                    return (isNotPrerenderedHTMLPage &&
                        isNotStaticPropsJSONFile &&
                        isNotApiPage);
                }
            })
        ]);
    }
    copyChunks(handlerDir) {
        return !this.buildOptions.useServerlessTraceTarget &&
            fs_extra_1.default.existsSync((0, path_1.join)(this.serverDir, "chunks"))
            ? fs_extra_1.default.copy((0, path_1.join)(this.serverDir, "chunks"), (0, path_1.join)(this.outputDir, handlerDir, "chunks"))
            : Promise.resolve();
    }
    async copyJSFiles(handlerDir) {
        await Promise.all([
            (await fs_extra_1.default.pathExists((0, path_1.join)(this.serverDir, "webpack-api-runtime.js")))
                ? fs_extra_1.default.copy((0, path_1.join)(this.serverDir, "webpack-api-runtime.js"), (0, path_1.join)(this.outputDir, handlerDir, "webpack-api-runtime.js"))
                : Promise.resolve(),
            (await fs_extra_1.default.pathExists((0, path_1.join)(this.serverDir, "webpack-runtime.js")))
                ? fs_extra_1.default.copy((0, path_1.join)(this.serverDir, "webpack-runtime.js"), (0, path_1.join)(this.outputDir, handlerDir, "webpack-runtime.js"))
                : Promise.resolve()
        ]);
    }
    async buildImageLambda(buildManifest) {
        var _a;
        await Promise.all([
            this.processAndCopyHandler("image-handler", (0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR), !!this.buildOptions.minifyHandlers),
            ((_a = this.buildOptions) === null || _a === void 0 ? void 0 : _a.handler)
                ? fs_extra_1.default.copy((0, path_1.join)(this.nextConfigDir, this.buildOptions.handler), (0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR, this.buildOptions.handler))
                : Promise.resolve(),
            fs_extra_1.default.writeJson((0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR, "manifest.json"), buildManifest),
            this.processAndCopyRoutesManifest((0, path_1.join)(this.dotNextDir, "routes-manifest.json"), (0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR, "routes-manifest.json")),
            fs_extra_1.default.copy((0, path_1.join)(path_2.default.dirname(require.resolve("@sls-next/core/package.json")), "dist", "sharp_node_modules"), (0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR, "node_modules")),
            fs_extra_1.default.copy((0, path_1.join)(this.dotNextDir, "images-manifest.json"), (0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR, "images-manifest.json"))
        ]);
    }
    async readNextConfig() {
        const nextConfigPath = path_2.default.join(this.nextConfigDir, "next.config.js");
        if (await fs_extra_1.default.pathExists(nextConfigPath)) {
            const nextConfig = await require(nextConfigPath);
            let normalisedNextConfig;
            if (typeof nextConfig === "object") {
                normalisedNextConfig = nextConfig;
            }
            else if (typeof nextConfig === "function") {
                normalisedNextConfig = nextConfig("phase-production-server", {});
            }
            return normalisedNextConfig;
        }
    }
    async buildStaticAssets(defaultBuildManifest, routesManifest, ignorePatterns) {
        const buildId = defaultBuildManifest.buildId;
        const basePath = routesManifest.basePath;
        const nextConfigDir = this.nextConfigDir;
        const nextStaticDir = this.nextStaticDir;
        const dotNextDirectory = path_2.default.join(this.nextConfigDir, ".next");
        const assetOutputDirectory = path_2.default.join(this.outputDir, exports.ASSETS_DIR);
        const normalizedBasePath = basePath ? basePath.slice(1) : "";
        const withBasePath = (key) => path_2.default.join(normalizedBasePath, key);
        const copyIfExists = async (source, destination) => {
            if (await fs_extra_1.default.pathExists(source)) {
                await fs_extra_1.default.copy(source, destination);
            }
        };
        const copyBuildId = copyIfExists(path_2.default.join(dotNextDirectory, "BUILD_ID"), path_2.default.join(assetOutputDirectory, withBasePath("BUILD_ID")));
        const buildStaticFiles = await (0, readDirectoryFiles_1.default)(path_2.default.join(dotNextDirectory, "static"), ignorePatterns);
        const staticFileAssets = buildStaticFiles
            .filter(filterOutDirectories_1.default)
            .map((fileItem) => {
            const source = fileItem.path;
            const destination = path_2.default.join(assetOutputDirectory, withBasePath(path_2.default
                .relative(path_2.default.resolve(nextConfigDir), source)
                .replace(/^.next/, "_next")));
            return copyIfExists(source, destination);
        });
        const htmlPaths = [
            ...Object.keys(defaultBuildManifest.pages.html.dynamic),
            ...Object.keys(defaultBuildManifest.pages.html.nonDynamic)
        ];
        const ssgPaths = Object.keys(defaultBuildManifest.pages.ssg.nonDynamic);
        const fallbackFiles = Object.values(defaultBuildManifest.pages.ssg.dynamic)
            .map(({ fallback }) => fallback)
            .filter((fallback) => fallback);
        const htmlFiles = [...htmlPaths, ...ssgPaths].map((path) => {
            return path.endsWith("/") ? `${path}index.html` : `${path}.html`;
        });
        const jsonFiles = ssgPaths.map((path) => {
            return path.endsWith("/") ? `${path}index.json` : `${path}.json`;
        });
        const htmlAssets = [...htmlFiles, ...fallbackFiles].map((file) => {
            const source = path_2.default.join(dotNextDirectory, `server/pages${file}`);
            const destination = path_2.default.join(assetOutputDirectory, withBasePath(`static-pages/${buildId}${file}`));
            return copyIfExists(source, destination);
        });
        const jsonAssets = jsonFiles.map((file) => {
            const source = path_2.default.join(dotNextDirectory, `server/pages${file}`);
            const destination = path_2.default.join(assetOutputDirectory, withBasePath(`_next/data/${buildId}${file}`));
            return copyIfExists(source, destination);
        });
        if (await fs_extra_1.default.pathExists(path_2.default.join(nextStaticDir, "public", "static"))) {
            throw new Error("You cannot have assets in the directory [public/static] as they conflict with the static/* CloudFront cache behavior. Please move these assets into another directory.");
        }
        const buildPublicOrStaticDirectory = async (directory) => {
            const directoryPath = path_2.default.join(nextStaticDir, directory);
            if (!(await fs_extra_1.default.pathExists(directoryPath))) {
                return Promise.resolve([]);
            }
            const files = await (0, readDirectoryFiles_1.default)(directoryPath, ignorePatterns);
            return files.filter(filterOutDirectories_1.default).map((fileItem) => {
                const source = fileItem.path;
                const destination = path_2.default.join(assetOutputDirectory, withBasePath(path_2.default.relative(path_2.default.resolve(nextStaticDir), fileItem.path)));
                return fs_extra_1.default.copy(source, destination);
            });
        };
        const [publicDirAssets, staticDirAssets] = await Promise.all([
            buildPublicOrStaticDirectory("public"),
            buildPublicOrStaticDirectory("static")
        ]);
        return Promise.all([
            copyBuildId,
            ...staticFileAssets,
            ...htmlAssets,
            ...jsonAssets,
            ...publicDirAssets,
            ...staticDirAssets
        ]);
    }
    async cleanupDotNext(shouldClean) {
        if (!shouldClean) {
            return;
        }
        const exists = await fs_extra_1.default.pathExists(this.dotNextDir);
        if (exists) {
            const fileItems = await fs_extra_1.default.readdir(this.dotNextDir);
            await Promise.all(fileItems
                .filter((fileItem) => fileItem !== "cache")
                .map((fileItem) => fs_extra_1.default.remove((0, path_1.join)(this.dotNextDir, fileItem))));
        }
    }
    async build(debugMode) {
        var _a, _b;
        const { cmd, args, cwd, env, useServerlessTraceTarget, cleanupDotNext, assetIgnorePatterns, separateApiLambda, useV2Handler } = Object.assign(defaultBuildOptions, this.buildOptions);
        await Promise.all([
            this.cleanupDotNext(cleanupDotNext),
            fs_extra_1.default.emptyDir((0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR)),
            fs_extra_1.default.emptyDir((0, path_1.join)(this.outputDir, exports.API_LAMBDA_CODE_DIR)),
            fs_extra_1.default.emptyDir((0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR)),
            fs_extra_1.default.emptyDir((0, path_1.join)(this.outputDir, exports.REGENERATION_LAMBDA_CODE_DIR)),
            fs_extra_1.default.emptyDir((0, path_1.join)(this.outputDir, exports.ASSETS_DIR))
        ]);
        const { restoreUserConfig } = await (0, createServerlessConfig_1.default)(cwd, path_2.default.join(this.nextConfigDir), useServerlessTraceTarget);
        try {
            const subprocess = (0, execa_1.default)(cmd, args, {
                cwd,
                env
            });
            if (debugMode) {
                subprocess.stdout.pipe(process.stdout);
            }
            await subprocess;
        }
        finally {
            await restoreUserConfig();
        }
        const routesManifest = require((0, path_1.join)(this.dotNextDir, "routes-manifest.json"));
        const prerenderManifest = require((0, path_1.join)(this.dotNextDir, "prerender-manifest.json"));
        const options = {
            buildId: await fs_extra_1.default.readFile(path_2.default.join(this.dotNextDir, "BUILD_ID"), "utf-8"),
            ...this.buildOptions,
            domainRedirects: (_a = this.buildOptions.domainRedirects) !== null && _a !== void 0 ? _a : {}
        };
        const { apiManifest, imageManifest, pageManifest } = await (0, core_1.prepareBuildManifests)(options, await this.readNextConfig(), routesManifest, await this.readPagesManifest(), prerenderManifest, await this.readPublicFiles(assetIgnorePatterns));
        const { enableHTTPCompression, logLambdaExecutionTimes, regenerationQueueName, disableOriginResponseHandler } = this.buildOptions;
        const apiBuildManifest = {
            ...apiManifest,
            enableHTTPCompression
        };
        const defaultBuildManifest = {
            ...pageManifest,
            enableHTTPCompression,
            logLambdaExecutionTimes,
            regenerationQueueName,
            disableOriginResponseHandler
        };
        const imageBuildManifest = {
            ...imageManifest,
            enableHTTPCompression
        };
        await this.buildDefaultLambda(defaultBuildManifest, apiBuildManifest, separateApiLambda, useV2Handler);
        await this.buildRegenerationHandler(defaultBuildManifest, useV2Handler);
        const hasAPIPages = Object.keys(apiBuildManifest.apis.nonDynamic).length > 0 ||
            Object.keys(apiBuildManifest.apis.dynamic).length > 0;
        if (hasAPIPages && separateApiLambda && !useV2Handler) {
            await this.buildApiLambda(apiBuildManifest);
        }
        const hasImagesManifest = fs_extra_1.default.existsSync((0, path_1.join)(this.dotNextDir, "images-manifest.json"));
        const imagesManifest = hasImagesManifest
            ? await fs_extra_1.default.readJSON((0, path_1.join)(this.dotNextDir, "images-manifest.json"))
            : null;
        const imageLoader = (_b = imagesManifest === null || imagesManifest === void 0 ? void 0 : imagesManifest.images) === null || _b === void 0 ? void 0 : _b.loader;
        const isDefaultLoader = !imageLoader || imageLoader === "default";
        const hasImageOptimizer = hasImagesManifest && isDefaultLoader;
        const exportMarker = fs_extra_1.default.existsSync((0, path_1.join)(this.dotNextDir, "export-marker.json"))
            ? await fs_extra_1.default.readJSON(path_2.default.join(this.dotNextDir, "export-marker.json"))
            : {};
        const isNextImageImported = exportMarker.isNextImageImported !== false;
        if (hasImageOptimizer && isNextImageImported) {
            await this.buildImageLambda(imageBuildManifest);
        }
        await this.buildStaticAssets(defaultBuildManifest, routesManifest, assetIgnorePatterns);
    }
    async runThirdPartyIntegrations(defaultLambdaDir, regenerationLambdaDir) {
        await Promise.all([
            new next_i18next_1.NextI18nextIntegration(this.nextConfigDir, defaultLambdaDir).execute(),
            new next_i18next_1.NextI18nextIntegration(this.nextConfigDir, regenerationLambdaDir).execute()
        ]);
    }
}
exports.default = Builder;
