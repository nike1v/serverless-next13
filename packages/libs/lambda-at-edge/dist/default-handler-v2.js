"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const prerender_manifest_json_1 = __importDefault(require("./prerender-manifest.json"));
const manifest_json_1 = __importDefault(require("./manifest.json"));
const routes_manifest_json_1 = __importDefault(require("./routes-manifest.json"));
const next_aws_cloudfront_1 = __importDefault(require("@sls-next/next-aws-cloudfront"));
const core_1 = require("@sls-next/core");
const removeBlacklistedHeaders_1 = require("./headers/removeBlacklistedHeaders");
const s3BucketNameFromEventRequest_1 = require("./s3/s3BucketNameFromEventRequest");
const aws_common_1 = require("@sls-next/aws-common");
const handler = async (event) => {
    var _a, _b, _c, _d;
    const manifest = manifest_json_1.default;
    const prerenderManifest = prerender_manifest_json_1.default;
    const routesManifest = routes_manifest_json_1.default;
    const { req, res, responsePromise } = (0, next_aws_cloudfront_1.default)(event.Records[0].cf, {
        enableHTTPCompression: manifest.enableHTTPCompression
    });
    const request = event.Records[0].cf.request;
    const bucketName = (_a = (0, s3BucketNameFromEventRequest_1.s3BucketNameFromEventRequest)(request)) !== null && _a !== void 0 ? _a : "";
    const { region: bucketRegion } = ((_b = request.origin) === null || _b === void 0 ? void 0 : _b.s3) || {
        region: "us-east-1"
    };
    const regenerationQueueRegion = bucketRegion;
    const regenerationQueueName = (_c = manifest.regenerationQueueName) !== null && _c !== void 0 ? _c : `${bucketName}.fifo`;
    const awsPlatformClient = new aws_common_1.AwsPlatformClient(bucketName, bucketRegion, regenerationQueueName, regenerationQueueRegion);
    await (0, core_1.defaultHandler)({
        req,
        res,
        responsePromise,
        manifest,
        prerenderManifest,
        routesManifest,
        options: {
            logExecutionTimes: (_d = manifest.logLambdaExecutionTimes) !== null && _d !== void 0 ? _d : false
        },
        platformClient: awsPlatformClient
    });
    const response = await responsePromise;
    if (response.headers) {
        (0, removeBlacklistedHeaders_1.removeBlacklistedHeaders)(response.headers);
    }
    return response;
};
exports.handler = handler;
