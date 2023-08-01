"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaBuilder = exports.IMAGE_LAMBDA_CODE_DIR = exports.DEFAULT_LAMBDA_CODE_DIR = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const path_2 = __importDefault(require("path"));
const builder_1 = __importDefault(require("@sls-next/core/dist/build/builder"));
exports.DEFAULT_LAMBDA_CODE_DIR = "default-lambda";
exports.IMAGE_LAMBDA_CODE_DIR = "image-lambda";
class LambdaBuilder extends builder_1.default {
    constructor(lambdaBuildOptions, coreBuildOptions) {
        super(coreBuildOptions);
        this.lambdaBuildOptions = lambdaBuildOptions;
    }
    async buildPlatform(manifests, debugMode) {
        var _a;
        const { pageManifest, imageManifest } = manifests;
        const imageBuildManifest = {
            ...imageManifest
        };
        // Build Lambda-specific manifest which will be included in the default and image handlers
        const lambdaManifest = {
            bucketName: this.lambdaBuildOptions.bucketName,
            bucketRegion: this.lambdaBuildOptions.bucketRegion,
            queueName: this.lambdaBuildOptions.queueName,
            queueRegion: this.lambdaBuildOptions.queueRegion
        };
        await this.buildDefaultLambda(pageManifest, lambdaManifest);
        // If using Next.js 10 and images-manifest.json is present then image optimizer can be used
        const hasImagesManifest = await fs_extra_1.default.pathExists((0, path_1.join)(this.dotNextDir, "images-manifest.json"));
        // However if using a non-default loader, the lambda is not needed
        const imagesManifest = hasImagesManifest
            ? await fs_extra_1.default.readJSON((0, path_1.join)(this.dotNextDir, "images-manifest.json"))
            : null;
        const imageLoader = (_a = imagesManifest === null || imagesManifest === void 0 ? void 0 : imagesManifest.images) === null || _a === void 0 ? void 0 : _a.loader;
        const isDefaultLoader = !imageLoader || imageLoader === "default";
        const hasImageOptimizer = hasImagesManifest && isDefaultLoader;
        // ...nor if the image component is not used
        const exportMarker = (await fs_extra_1.default.pathExists((0, path_1.join)(this.dotNextDir, "export-marker.json")))
            ? await fs_extra_1.default.readJSON(path_2.default.join(this.dotNextDir, "export-marker.json"))
            : {};
        const isNextImageImported = exportMarker.isNextImageImported !== false;
        if (hasImageOptimizer && isNextImageImported) {
            await this.buildImageLambda(imageBuildManifest, lambdaManifest);
        }
    }
    /**
     * Process and copy handler code. This allows minifying it before copying to Lambda package.
     * @param handlerType
     * @param destination
     * @param shouldMinify
     */
    async processAndCopyHandler(handlerType, destination, shouldMinify) {
        const source = path_2.default.dirname(require.resolve(`@sls-next/lambda/dist/bundles/${handlerType}/${shouldMinify ? "minified" : "standard"}`));
        await fs_extra_1.default.copy(source, destination);
    }
    /**
     * Build default lambda which handles all requests as well as regeneration requests.
     * @param pageManifest
     * @param lambdaManifest
     * @private
     */
    async buildDefaultLambda(pageManifest, lambdaManifest) {
        var _a;
        const hasAPIRoutes = await fs_extra_1.default.pathExists((0, path_1.join)(this.serverDir, "pages/api"));
        await fs_extra_1.default.mkdir((0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR));
        return Promise.all([
            this.processAndCopyHandler("default-handler", (0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR), this.buildOptions.minifyHandlers),
            ((_a = this.buildOptions) === null || _a === void 0 ? void 0 : _a.handler)
                ? fs_extra_1.default.copy((0, path_1.join)(this.nextConfigDir, this.buildOptions.handler), (0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR, this.buildOptions.handler))
                : Promise.resolve(),
            fs_extra_1.default.writeJson((0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR, "manifest.json"), pageManifest, this.buildOptions.minifyHandlers ? undefined : { spaces: 2 }),
            fs_extra_1.default.writeJson((0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR, "lambda-manifest.json"), lambdaManifest, this.buildOptions.minifyHandlers ? undefined : { spaces: 2 }),
            fs_extra_1.default.copy((0, path_1.join)(this.serverDir, "pages"), (0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR, "pages"), {
                filter: this.getDefaultHandlerFileFilter(hasAPIRoutes, pageManifest)
            }),
            this.copyChunks(exports.DEFAULT_LAMBDA_CODE_DIR),
            this.copyJSFiles(exports.DEFAULT_LAMBDA_CODE_DIR),
            fs_extra_1.default.copy((0, path_1.join)(this.dotNextDir, "prerender-manifest.json"), (0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR, "prerender-manifest.json")),
            this.processAndCopyRoutesManifest((0, path_1.join)(this.dotNextDir, "routes-manifest.json"), (0, path_1.join)(this.outputDir, exports.DEFAULT_LAMBDA_CODE_DIR, "routes-manifest.json"))
        ]);
    }
    /**
     * Build image optimization lambda (supported by Next.js 10+)
     * @param imageBuildManifest
     * @param lambdaManifest
     */
    async buildImageLambda(imageBuildManifest, lambdaManifest) {
        var _a;
        await fs_extra_1.default.mkdir((0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR));
        await Promise.all([
            this.processAndCopyHandler("image-handler", (0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR), this.buildOptions.minifyHandlers),
            ((_a = this.buildOptions) === null || _a === void 0 ? void 0 : _a.handler)
                ? fs_extra_1.default.copy((0, path_1.join)(this.nextConfigDir, this.buildOptions.handler), (0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR, this.buildOptions.handler))
                : Promise.resolve(),
            fs_extra_1.default.writeJson((0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR, "manifest.json"), imageBuildManifest, this.buildOptions.minifyHandlers ? undefined : { spaces: 2 }),
            fs_extra_1.default.writeJson((0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR, "lambda-manifest.json"), lambdaManifest, this.buildOptions.minifyHandlers ? undefined : { spaces: 2 }),
            this.processAndCopyRoutesManifest((0, path_1.join)(this.dotNextDir, "routes-manifest.json"), (0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR, "routes-manifest.json")),
            fs_extra_1.default.copy((0, path_1.join)(path_2.default.dirname(require.resolve("@sls-next/core/package.json")), "dist", "sharp_node_modules"), (0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR, "node_modules")),
            fs_extra_1.default.copy((0, path_1.join)(this.dotNextDir, "images-manifest.json"), (0, path_1.join)(this.outputDir, exports.IMAGE_LAMBDA_CODE_DIR, "images-manifest.json"))
        ]);
    }
}
exports.LambdaBuilder = LambdaBuilder;
