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
exports.AwsPlatformClient = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const client_sqs_1 = require("@aws-sdk/client-sqs");
// FIXME: using static imports for AWS clients instead of dynamic imports are not imported correctly (if (1) imported from root @aws-sdk/client-sqs it works but isn't treeshook and
// (2) if dynamically imported from deeper @aws-sdk/client-sqs/SQSClient it doesn't resolve and is treated as external. However (2) is working in the old way where AWS clients are direct dependencies of lambda-at-edge. Might be due to nested dynamic imports?
// However it should be negligible as these clients are pretty lightweight.
/**
 * Client to access pages/files, store pages to S3 and trigger SQS regeneration.
 */
class AwsPlatformClient {
    constructor(bucketName, bucketRegion, regenerationQueueName, regenerationQueueRegion) {
        this.bucketName = bucketName;
        this.bucketRegion = bucketRegion;
        this.regenerationQueueName = regenerationQueueName;
        this.regenerationQueueRegion = regenerationQueueRegion;
    }
    async getObject(pageKey) {
        var _a, _b, _c, _d;
        const s3 = new client_s3_1.S3Client({
            region: this.bucketRegion,
            maxAttempts: 3
        });
        // S3 Body is stream per: https://github.com/aws/aws-sdk-js-v3/issues/1096
        const getStream = await Promise.resolve().then(() => __importStar(require("get-stream")));
        const s3Params = {
            Bucket: this.bucketName,
            Key: pageKey
        };
        let s3StatusCode;
        let bodyBuffer;
        let s3Response;
        try {
            s3Response = await s3.send(new client_s3_1.GetObjectCommand(s3Params));
            bodyBuffer = await getStream.buffer(s3Response.Body);
            s3StatusCode = (_a = s3Response.$metadata.httpStatusCode) !== null && _a !== void 0 ? _a : 200; // assume OK if not set, but it should be
        }
        catch (e) {
            s3StatusCode = e.$metadata.httpStatusCode;
            console.info("Got error response from S3. Will default to returning empty response. Error: " +
                e);
            return {
                body: undefined,
                headers: {},
                statusCode: s3StatusCode,
                expires: undefined,
                lastModified: undefined,
                eTag: undefined,
                cacheControl: undefined,
                contentType: undefined
            };
        }
        return {
            body: bodyBuffer,
            headers: {
                "Cache-Control": s3Response.CacheControl,
                "Content-Disposition": s3Response.ContentDisposition,
                "Content-Type": s3Response.ContentType,
                "Content-Language": s3Response.ContentLanguage,
                "Content-Length": (_b = s3Response.ContentLength) === null || _b === void 0 ? void 0 : _b.toString(),
                "Content-Encoding": s3Response.ContentEncoding,
                "Content-Range": s3Response.ContentRange,
                ETag: s3Response.ETag,
                "Accept-Ranges": s3Response.AcceptRanges
            },
            lastModified: (_c = s3Response.LastModified) === null || _c === void 0 ? void 0 : _c.toString(),
            expires: (_d = s3Response.Expires) === null || _d === void 0 ? void 0 : _d.toString(),
            eTag: s3Response.ETag,
            cacheControl: s3Response.CacheControl,
            statusCode: s3StatusCode,
            contentType: s3Response.ContentType
        };
    }
    async storePage(options) {
        const s3 = new client_s3_1.S3Client({
            region: this.bucketRegion,
            maxAttempts: 3
        });
        const s3BasePath = options.basePath
            ? `${options.basePath.replace(/^\//, "")}/`
            : "";
        const baseKey = options.uri
            .replace(/^\/$/, "index")
            .replace(/^\//, "")
            .replace(/\.(json|html)$/, "")
            .replace(/^_next\/data\/[^\/]*\//, "");
        const jsonKey = `_next/data/${options.buildId}/${baseKey}.json`;
        const htmlKey = `static-pages/${options.buildId}/${baseKey}.html`;
        const cacheControl = options.revalidate
            ? undefined
            : "public, max-age=0, s-maxage=2678400, must-revalidate";
        const expires = options.revalidate
            ? new Date(new Date().getTime() + 1000 * options.revalidate)
            : undefined;
        const s3JsonParams = {
            Bucket: this.bucketName,
            Key: `${s3BasePath}${jsonKey}`,
            Body: JSON.stringify(options.pageData),
            ContentType: "application/json",
            CacheControl: cacheControl,
            Expires: expires
        };
        const s3HtmlParams = {
            Bucket: this.bucketName,
            Key: `${s3BasePath}${htmlKey}`,
            Body: options.html,
            ContentType: "text/html",
            CacheControl: cacheControl,
            Expires: expires
        };
        await Promise.all([
            s3.send(new client_s3_1.PutObjectCommand(s3JsonParams)),
            s3.send(new client_s3_1.PutObjectCommand(s3HtmlParams))
        ]);
        return {
            cacheControl,
            expires
        };
    }
    async triggerStaticRegeneration(options) {
        var _a, _b;
        if (!this.regenerationQueueRegion || !this.regenerationQueueName) {
            throw new Error("SQS regeneration queue region and name is not set.");
        }
        const sqs = new client_sqs_1.SQSClient({
            region: this.regenerationQueueRegion,
            maxAttempts: 1
        });
        const regenerationEvent = {
            request: {
                url: options.req.url,
                headers: options.req.headers
            },
            pagePath: options.pagePath,
            basePath: options.basePath,
            pageKey: options.pageKey,
            storeName: this.bucketName,
            storeRegion: this.bucketRegion
        };
        try {
            const crypto = await Promise.resolve().then(() => __importStar(require("crypto")));
            // Hashed URI for messageGroupId to allow for long URIs, as SQS has limit of 128 characters
            // MD5 is used since this is only used for grouping purposes
            const hashedUri = crypto
                .createHash("md5")
                .update((_a = options.req.url) !== null && _a !== void 0 ? _a : "")
                .digest("hex");
            await sqs.send(new client_sqs_1.SendMessageCommand({
                QueueUrl: `https://sqs.${this.regenerationQueueRegion}.amazonaws.com/${this.regenerationQueueName}`,
                MessageBody: JSON.stringify(regenerationEvent),
                // We only want to trigger the regeneration once for every previous
                // update. This will prevent the case where this page is being
                // requested again whilst its already started to regenerate.
                MessageDeduplicationId: (_b = options.eTag) !== null && _b !== void 0 ? _b : (options.lastModified
                    ? new Date(options.lastModified).getTime().toString()
                    : new Date().getTime().toString()),
                // Only deduplicate based on the object, i.e. we can generate
                // different pages in parallel, just not the same one
                MessageGroupId: hashedUri
            }));
            return { throttle: false };
        }
        catch (error) {
            if (error.code === "RequestThrottled") {
                return { throttle: true };
            }
            else {
                throw error;
            }
        }
    }
}
exports.AwsPlatformClient = AwsPlatformClient;
