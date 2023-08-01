"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getMimeType_1 = __importDefault(require("./getMimeType"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const getS3RegionalEndpoint = (bucketRegion) => {
    return (`https://s3.${bucketRegion}.amazonaws.com` +
        `${bucketRegion.startsWith("cn-") ? ".cn" : ""}`);
};
exports.default = async ({ bucketName, bucketRegion, credentials }) => {
    let s3 = new aws_sdk_1.default.S3({
        ...credentials,
        region: bucketRegion,
        endpoint: getS3RegionalEndpoint(bucketRegion),
        s3BucketEndpoint: false
    });
    try {
        const { Status } = await s3
            .getBucketAccelerateConfiguration({
            Bucket: bucketName
        })
            .promise();
        if (Status === "Enabled") {
            s3 = new aws_sdk_1.default.S3({
                ...credentials,
                region: bucketRegion,
                endpoint: getS3RegionalEndpoint(bucketRegion),
                s3BucketEndpoint: false,
                useAccelerateEndpoint: true
            });
        }
    }
    catch (err) {
        console.warn(`Checking for bucket acceleration failed, falling back to non-accelerated S3 client. Err: ${err.message}`);
    }
    return {
        uploadFile: async (options) => {
            const { filePath, cacheControl, s3Key } = options;
            const fileBody = await fs_extra_1.default.readFile(filePath);
            return s3
                .upload({
                Bucket: bucketName,
                Key: s3Key || filePath,
                Body: fileBody,
                ContentType: (0, getMimeType_1.default)(filePath),
                CacheControl: cacheControl || undefined
            })
                .promise();
        },
        deleteFilesByPattern: async (options) => {
            var _a;
            const { prefix, pattern, excludePattern } = options;
            const foundKeys = [];
            let continuationToken = undefined;
            while (true) {
                const data = await s3
                    .listObjectsV2({
                    Bucket: bucketName,
                    Prefix: prefix,
                    ContinuationToken: continuationToken
                })
                    .promise();
                const contents = (_a = data.Contents) !== null && _a !== void 0 ? _a : [];
                contents.forEach(function (content) {
                    if (content.Key) {
                        const key = content.Key;
                        if (pattern.test(key) &&
                            (!excludePattern || !excludePattern.test(key))) {
                            foundKeys.push(content.Key);
                        }
                    }
                });
                if (data.IsTruncated) {
                    continuationToken = data.NextContinuationToken;
                }
                else {
                    break;
                }
            }
            const maxKeysToDelete = 1000;
            let start = 0;
            while (start < foundKeys.length) {
                const objects = [];
                for (let i = start; i < start + maxKeysToDelete && i < foundKeys.length; i++) {
                    objects.push({
                        Key: foundKeys[i]
                    });
                }
                await s3
                    .deleteObjects({
                    Bucket: bucketName,
                    Delete: {
                        Objects: objects
                    }
                })
                    .promise();
                start += maxKeysToDelete;
            }
        },
        getFile: async (options) => {
            var _a;
            try {
                const data = await s3
                    .getObject({
                    Bucket: bucketName,
                    Key: options.key
                })
                    .promise();
                return (_a = data.Body) === null || _a === void 0 ? void 0 : _a.toString("utf-8");
            }
            catch (e) {
                if (e.code === "NoSuchKey") {
                    return undefined;
                }
            }
        }
    };
};
