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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
// @ts-ignore
const lambda_manifest_json_1 = __importDefault(require("./lambda-manifest.json"));
// @ts-ignore
const routes_manifest_json_1 = __importDefault(require("./routes-manifest.json"));
const aws_common_1 = require("@sls-next/aws-common");
const apigw_1 = require("src/compat/apigw");
const module_1 = require("@sls-next/core/dist/module");
const url_1 = __importDefault(require("url"));
const images_1 = require("@sls-next/core/dist/module/images");
const basePath = routes_manifest_json_1.default.basePath;
const isImageOptimizerRequest = (uri) => uri.startsWith("/_next/image");
/**
 * Entry point for Lambda image handling.
 * @param event
 */
const handler = async (event) => {
    var _a, _b;
    // Compatibility layer required to convert from Node.js req/res <-> API Gateway
    const { req, res, responsePromise } = (0, apigw_1.httpCompat)(event);
    const uri = (0, images_1.normaliseUri)((_a = req.url) !== null && _a !== void 0 ? _a : "", basePath);
    // Handle image optimizer requests
    // TODO: probably can move these to core package
    const isImageRequest = isImageOptimizerRequest(uri);
    if (isImageRequest) {
        let imagesManifest;
        try {
            // @ts-ignore
            imagesManifest = await Promise.resolve().then(() => __importStar(require("./images-manifest.json")));
        }
        catch (error) {
            console.warn("Images manifest not found for image optimizer request. Image optimizer will fallback to defaults.");
        }
        const urlWithParsedQuery = url_1.default.parse((_b = req.url) !== null && _b !== void 0 ? _b : "", true);
        const lambdaManifest = lambda_manifest_json_1.default;
        const awsPlatformClient = new aws_common_1.AwsPlatformClient(lambdaManifest.bucketName, lambdaManifest.bucketRegion, undefined, undefined);
        await (0, images_1.imageOptimizer)(basePath, imagesManifest, req, res, urlWithParsedQuery, awsPlatformClient);
        const routesManifest = routes_manifest_json_1.default;
        (0, module_1.setCustomHeaders)({ res, req, responsePromise }, routesManifest);
    }
    else {
        // TODO: probably move this into the platform-agnostic handler
        res.writeHead(404);
        res.end();
    }
    return await responsePromise;
};
exports.handler = handler;
