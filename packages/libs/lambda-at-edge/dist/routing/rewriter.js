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
exports.externalRewrite = exports.createExternalRewriteResponse = void 0;
const next_aws_cloudfront_1 = __importDefault(require("@sls-next/next-aws-cloudfront"));
const ignoredHeaders = [
    "connection",
    "expect",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "proxy-connection",
    "trailer",
    "upgrade",
    "x-accel-buffering",
    "x-accel-charset",
    "x-accel-limit-rate",
    "x-accel-redirect",
    "x-cache",
    "x-forwarded-proto",
    "x-real-ip",
    "content-length",
    "host",
    "transfer-encoding",
    "via"
];
const ignoredHeaderPrefixes = ["x-amz-cf-", "x-amzn-", "x-edge-"];
function isIgnoredHeader(name) {
    const lowerCaseName = name.toLowerCase();
    for (const prefix of ignoredHeaderPrefixes) {
        if (lowerCaseName.startsWith(prefix)) {
            return true;
        }
    }
    return ignoredHeaders.includes(lowerCaseName);
}
async function createExternalRewriteResponse(customRewrite, req, res, body) {
    const { default: fetch } = await Promise.resolve().then(() => __importStar(require("node-fetch")));
    const reqHeaders = {};
    Object.assign(reqHeaders, req.headers);
    if (reqHeaders.hasOwnProperty("host")) {
        delete reqHeaders.host;
    }
    let fetchResponse;
    if (body) {
        const decodedBody = Buffer.from(body, "base64").toString("utf8");
        fetchResponse = await fetch(customRewrite, {
            headers: reqHeaders,
            method: req.method,
            body: decodedBody,
            redirect: "manual"
        });
    }
    else {
        fetchResponse = await fetch(customRewrite, {
            headers: reqHeaders,
            method: req.method,
            compress: false,
            redirect: "manual"
        });
    }
    for (const [name, val] of fetchResponse.headers.entries()) {
        if (!isIgnoredHeader(name)) {
            res.setHeader(name, val);
        }
    }
    res.statusCode = fetchResponse.status;
    res.end(await fetchResponse.buffer());
}
exports.createExternalRewriteResponse = createExternalRewriteResponse;
const externalRewrite = async (event, enableHTTPCompression, rewrite) => {
    var _a;
    const request = event.Records[0].cf.request;
    const { req, res, responsePromise } = (0, next_aws_cloudfront_1.default)(event.Records[0].cf, {
        enableHTTPCompression
    });
    await createExternalRewriteResponse(rewrite + (request.querystring ? "?" : "") + request.querystring, req, res, (_a = request.body) === null || _a === void 0 ? void 0 : _a.data);
    return await responsePromise;
};
exports.externalRewrite = externalRewrite;
