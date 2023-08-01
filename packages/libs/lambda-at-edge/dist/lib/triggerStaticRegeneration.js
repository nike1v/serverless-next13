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
exports.triggerStaticRegeneration = void 0;
const s3BucketNameFromEventRequest_1 = require("../s3/s3BucketNameFromEventRequest");
const crypto = __importStar(require("crypto"));
const client_sqs_1 = require("@aws-sdk/client-sqs");
const triggerStaticRegeneration = async (options) => {
    var _a, _b;
    const { region } = ((_a = options.request.origin) === null || _a === void 0 ? void 0 : _a.s3) || {};
    const bucketName = (0, s3BucketNameFromEventRequest_1.s3BucketNameFromEventRequest)(options.request);
    const queueName = options.queueName;
    if (!bucketName) {
        throw new Error("Expected bucket name to be defined");
    }
    if (!region) {
        throw new Error("Expected region to be defined");
    }
    const sqs = new client_sqs_1.SQSClient({
        region,
        maxAttempts: 1
    });
    const regenerationEvent = {
        region,
        bucketName,
        pageS3Path: options.pageS3Path,
        cloudFrontEventRequest: options.request,
        basePath: options.basePath,
        pagePath: options.pagePath
    };
    try {
        const hashedUri = crypto
            .createHash("md5")
            .update(options.request.uri)
            .digest("hex");
        await sqs.send(new client_sqs_1.SendMessageCommand({
            QueueUrl: `https://sqs.${region}.amazonaws.com/${queueName}`,
            MessageBody: JSON.stringify(regenerationEvent),
            MessageDeduplicationId: (_b = options.eTag) !== null && _b !== void 0 ? _b : (options.lastModified
                ? new Date(options.lastModified).getTime().toString()
                : new Date().getTime().toString()),
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
};
exports.triggerStaticRegeneration = triggerStaticRegeneration;
