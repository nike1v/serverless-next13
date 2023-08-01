"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.handleRegeneration = exports.handleRequest = void 0;
// @ts-ignore
const prerender_manifest_json_1 = __importDefault(require("./prerender-manifest.json"));
// @ts-ignore
const manifest_json_1 = __importDefault(require("./manifest.json"));
// @ts-ignore
const routes_manifest_json_1 = __importDefault(require("./routes-manifest.json"));
// @ts-ignore
const lambda_manifest_json_1 = __importDefault(require("./lambda-manifest.json"));
const core_1 = require("@sls-next/core");
const aws_common_1 = require("@sls-next/aws-common");
const apigw_1 = require("src/compat/apigw");
const stream_1 = __importDefault(require("stream"));
const http_1 = __importDefault(require("http"));
/**
 * Lambda handler that wraps the platform-agnostic default handler.
 * @param event
 */
const handleRequest = async (event) => {
    var _a;
    const manifest = manifest_json_1.default;
    const prerenderManifest = prerender_manifest_json_1.default;
    const routesManifest = routes_manifest_json_1.default;
    const lambdaManifest = lambda_manifest_json_1.default;
    // Compatibility layer required to convert from Node.js req/res <-> API Gateway
    const { req, res, responsePromise } = (0, apigw_1.httpCompat)(event);
    // Initialize AWS platform specific client
    const bucketName = lambdaManifest.bucketName;
    const bucketRegion = lambdaManifest.bucketRegion;
    const regenerationQueueRegion = lambdaManifest.queueRegion;
    const regenerationQueueName = lambdaManifest.queueName;
    const awsPlatformClient = new aws_common_1.AwsPlatformClient(bucketName, bucketRegion, regenerationQueueName, regenerationQueueRegion);
    // Handle request with platform-agnostic handler
    await (0, core_1.defaultHandler)({
        req,
        res,
        responsePromise,
        manifest,
        prerenderManifest,
        routesManifest,
        options: {
            logExecutionTimes: (_a = lambdaManifest.logExecutionTimes) !== null && _a !== void 0 ? _a : false
        },
        platformClient: awsPlatformClient
    });
    // Convert to API Gateway compatible response
    return await responsePromise;
};
exports.handleRequest = handleRequest;
/**
 * Lambda handler that wraps the platform-agnostic regeneration handler.
 * @param event
 */
const handleRegeneration = async (event) => {
    await Promise.all(event.Records.map(async (record) => {
        const regenerationEvent = JSON.parse(record.body);
        const manifest = manifest_json_1.default;
        const lambdaManifest = lambda_manifest_json_1.default;
        // This is needed to build the original req/res Node.js objects to be passed into pages.
        const originalRequest = regenerationEvent.request;
        const req = Object.assign(new stream_1.default.Readable(), http_1.default.IncomingMessage.prototype);
        req.url = originalRequest.url; // this already includes query parameters
        req.headers = originalRequest.headers;
        const res = Object.assign(new stream_1.default.Readable(), http_1.default.ServerResponse.prototype);
        const awsPlatformClient = new aws_common_1.AwsPlatformClient(lambdaManifest.bucketName, lambdaManifest.bucketRegion, lambdaManifest.queueName, // we don't need to call the SQS queue as of now, but passing this for future uses
        lambdaManifest.queueRegion);
        await (0, core_1.regenerationHandler)({
            req,
            res,
            regenerationEvent,
            manifest,
            platformClient: awsPlatformClient
        });
    }));
};
exports.handleRegeneration = handleRegeneration;
/**
 * Entry point for Lambda handling - either a request event or SQS event (for regeneration).
 * @param event
 */
const handler = async (event) => {
    if (event.Records) {
        await (0, exports.handleRegeneration)(event);
    }
    else {
        return await (0, exports.handleRequest)(event);
    }
};
exports.handler = handler;
