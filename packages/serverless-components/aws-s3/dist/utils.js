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
exports.configureBucketTags = exports.configureCors = exports.ensureBucket = exports.bucketCreation = exports.deleteBucket = exports.accelerateBucket = exports.clearBucket = exports.uploadFile = exports.packAndUploadDir = exports.uploadDir = exports.getClients = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const klaw_sync_1 = __importDefault(require("klaw-sync"));
const mime_types_1 = __importDefault(require("mime-types"));
const s3_stream_upload_1 = __importDefault(require("s3-stream-upload"));
const ramda_1 = require("ramda");
const fs_extra_1 = require("fs-extra");
const archiver = __importStar(require("archiver"));
const core_1 = require("@serverless/core");
const _ = __importStar(require("lodash"));
const getClients = (credentials, region) => {
    const params = {
        region,
        credentials
    };
    return {
        regular: new aws_sdk_1.default.S3(params),
        accelerated: new aws_sdk_1.default.S3({
            ...params,
            endpoint: `s3-accelerate.amazonaws.com`
        })
    };
};
exports.getClients = getClients;
const bucketCreation = async (s3, Bucket) => {
    try {
        await s3.headBucket({ Bucket }).promise();
    }
    catch (e) {
        if (e.code === "NotFound" || e.code === "NoSuchBucket") {
            await core_1.utils.sleep(2000);
            return bucketCreation(s3, Bucket);
        }
        throw new Error(e);
    }
};
exports.bucketCreation = bucketCreation;
const ensureBucket = async (s3, name, debug) => {
    try {
        debug(`Checking if bucket ${name} exists.`);
        await s3.headBucket({ Bucket: name }).promise();
    }
    catch (e) {
        if (e.code === "NotFound") {
            debug(`Bucket ${name} does not exist. Creating...`);
            await s3.createBucket({ Bucket: name }).promise();
            debug(`Bucket ${name} created. Confirming it's ready...`);
            await bucketCreation(s3, name);
            debug(`Bucket ${name} creation confirmed.`);
        }
        else if (e.code === "Forbidden" && e.message === null) {
            throw Error(`Forbidden: Invalid credentials or this AWS S3 bucket name may already be taken`);
        }
        else if (e.code === "Forbidden") {
            throw Error(`Bucket name "${name}" is already taken.`);
        }
        else {
            throw e;
        }
    }
};
exports.ensureBucket = ensureBucket;
const uploadDir = async (s3, bucketName, dirPath, cacheControl, options) => {
    const items = await new Promise((resolve, reject) => {
        try {
            resolve((0, klaw_sync_1.default)(dirPath));
        }
        catch (error) {
            reject(error);
        }
    });
    const uploadItems = [];
    items.forEach((item) => {
        if (item.stats.isDirectory()) {
            return;
        }
        let key = path.relative(dirPath, item.path);
        if (options.keyPrefix) {
            key = path.posix.join(options.keyPrefix, key);
        }
        if (path.sep === "\\") {
            key = key.replace(/\\/g, "/");
        }
        const itemParams = {
            Bucket: bucketName,
            Key: key,
            Body: fs.readFileSync(item.path),
            ContentType: mime_types_1.default.lookup(path.basename(item.path)) || "application/octet-stream",
            CacheControl: cacheControl
        };
        uploadItems.push(s3.upload(itemParams).promise());
    });
    await Promise.all(uploadItems);
};
exports.uploadDir = uploadDir;
const packAndUploadDir = async ({ s3, bucketName, dirPath, key, append = [], cacheControl }) => {
    const ignore = (await core_1.utils.readFileIfExists(path.join(dirPath, ".slsignore"))) || [];
    return new Promise((resolve, reject) => {
        const archive = archiver.create("zip", {
            zlib: { level: 9 }
        });
        if (!(0, ramda_1.isEmpty)(append)) {
            append.forEach((file) => {
                const fileStream = (0, fs_extra_1.createReadStream)(file);
                archive.append(fileStream, { name: path.basename(file) });
            });
        }
        archive.glob("**/*", {
            cwd: dirPath,
            ignore
        }, {});
        archive
            .pipe((0, s3_stream_upload_1.default)(s3, {
            Bucket: bucketName,
            Key: key,
            CacheControl: cacheControl
        }))
            .on("error", function (err) {
            return reject(err);
        })
            .on("finish", function () {
            return resolve();
        });
        archive.finalize();
    });
};
exports.packAndUploadDir = packAndUploadDir;
const uploadFile = async ({ s3, bucketName, filePath, key, cacheControl }) => {
    await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe((0, s3_stream_upload_1.default)(s3, {
            Bucket: bucketName,
            Key: key,
            ContentType: mime_types_1.default.lookup(filePath) || "application/octet-stream",
            CacheControl: cacheControl
        }))
            .on("error", function (err) {
            return reject(err);
        })
            .on("finish", function () {
            return resolve();
        });
    });
};
exports.uploadFile = uploadFile;
const clearBucket = async (s3, bucketName) => {
    try {
        const data = await s3.listObjects({ Bucket: bucketName }).promise();
        const items = data.Contents;
        const promises = [];
        for (let i = 0; i < items.length; i += 1) {
            const deleteParams = { Bucket: bucketName, Key: items[i].Key };
            const delObj = s3.deleteObject(deleteParams).promise();
            promises.push(delObj);
        }
        await Promise.all(promises);
    }
    catch (error) {
        if (error.code !== "NoSuchBucket") {
            throw error;
        }
    }
};
exports.clearBucket = clearBucket;
const accelerateBucket = async (s3, bucketName, accelerated) => {
    try {
        await s3
            .putBucketAccelerateConfiguration({
            AccelerateConfiguration: {
                Status: accelerated ? "Enabled" : "Suspended"
            },
            Bucket: bucketName
        })
            .promise();
    }
    catch (e) {
        if (e.code === "NoSuchBucket") {
            await core_1.utils.sleep(2000);
            return accelerateBucket(s3, bucketName, accelerated);
        }
        throw e;
    }
};
exports.accelerateBucket = accelerateBucket;
const deleteBucket = async (s3, bucketName) => {
    try {
        await s3.deleteBucket({ Bucket: bucketName }).promise();
    }
    catch (error) {
        if (error.code !== "NoSuchBucket") {
            throw error;
        }
    }
};
exports.deleteBucket = deleteBucket;
const configureCors = async (s3, bucketName, config) => {
    const params = { Bucket: bucketName, CORSConfiguration: config };
    try {
        await s3.putBucketCors(params).promise();
    }
    catch (e) {
        if (e.code === "NoSuchBucket") {
            await core_1.utils.sleep(2000);
            return configureCors(s3, bucketName, config);
        }
        throw e;
    }
};
exports.configureCors = configureCors;
const configureBucketTags = async (s3, bucketName, configTags) => {
    const currentTags = {};
    try {
        const data = await s3.getBucketTagging({ Bucket: bucketName }).promise();
        data.TagSet.forEach((x) => {
            currentTags[x.Key] = x.Value;
        });
    }
    catch (error) {
        if (error.code === "NoSuchTagSet") {
        }
        else {
            throw error;
        }
    }
    if (!_.isEqual(configTags, currentTags)) {
        await s3.deleteBucketTagging({ Bucket: bucketName }).promise();
        const newTagSet = [];
        for (const [key, value] of Object.entries(configTags)) {
            newTagSet.push({ Key: key, Value: value });
        }
        await s3
            .putBucketTagging({
            Bucket: bucketName,
            Tagging: {
                TagSet: newTagSet
            }
        })
            .promise();
    }
};
exports.configureBucketTags = configureBucketTags;
