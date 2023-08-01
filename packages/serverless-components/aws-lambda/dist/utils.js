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
exports.pack = exports.configChanged = exports.getAccountId = exports.getPolicy = exports.deleteLambda = exports.getLambda = exports.updateLambdaConfig = exports.updateLambdaCode = exports.createLambda = void 0;
const os_1 = require("os");
const path = __importStar(require("path"));
const archiver = __importStar(require("archiver"));
const globby = __importStar(require("globby"));
const ramda_1 = require("ramda");
const fs_extra_1 = require("fs-extra");
const core_1 = require("@serverless/core");
const _ = __importStar(require("lodash"));
const VALID_FORMATS = ["zip", "tar"];
const isValidFormat = (format) => (0, ramda_1.contains)(format, VALID_FORMATS);
const packDir = async (inputDirPath, outputFilePath, include = [], exclude = [], prefix) => {
    const format = (0, ramda_1.last)((0, ramda_1.split)(".", outputFilePath));
    if (!isValidFormat(format)) {
        throw new Error('Please provide a valid format. Either a "zip" or a "tar"');
    }
    const patterns = ["**/*"];
    if (!(0, ramda_1.isNil)(exclude)) {
        exclude.forEach((excludedItem) => patterns.push(`!${excludedItem}`));
    }
    const files = (await globby.default(patterns, { cwd: inputDirPath, dot: true }))
        .sort()
        .map((file) => ({
        input: path.join(inputDirPath, file),
        output: prefix ? path.join(prefix, file) : file
    }));
    return new Promise((resolve, reject) => {
        const output = (0, fs_extra_1.createWriteStream)(outputFilePath);
        const archive = archiver.create(format, {
            zlib: { level: 9 }
        });
        output.on("open", () => {
            archive.pipe(output);
            files.forEach((file) => archive.append((0, fs_extra_1.createReadStream)(file.input), {
                name: file.output,
                date: new Date(0)
            }));
            if (!(0, ramda_1.isNil)(include)) {
                include.forEach((file) => {
                    const stream = (0, fs_extra_1.createReadStream)(file);
                    archive.append(stream, {
                        name: path.basename(file),
                        date: new Date(0)
                    });
                });
            }
            archive.finalize();
        });
        archive.on("error", (err) => reject(err));
        output.on("close", () => resolve(outputFilePath));
    });
};
const getAccountId = async (aws) => {
    const STS = new aws.STS();
    const res = await STS.getCallerIdentity({}).promise();
    return res.Account;
};
exports.getAccountId = getAccountId;
const createLambda = async ({ lambda, name, handler, memory, timeout, runtime, env, description, zipPath, bucket, role, layer, tags }) => {
    const params = {
        FunctionName: name,
        Code: {},
        Description: description,
        Handler: handler,
        MemorySize: memory,
        Publish: true,
        Role: role.arn,
        Runtime: runtime,
        Timeout: timeout,
        Environment: {
            Variables: env
        },
        Tags: tags
    };
    if (layer && layer.arn) {
        params.Layers = [layer.arn];
    }
    if (bucket) {
        params.Code.S3Bucket = bucket;
        params.Code.S3Key = path.basename(zipPath);
    }
    else {
        params.Code.ZipFile = await (0, fs_extra_1.readFile)(zipPath);
    }
    const res = await lambda.createFunction(params).promise();
    return { arn: res.FunctionArn, hash: res.CodeSha256 };
};
exports.createLambda = createLambda;
const updateLambdaConfig = async ({ lambda, name, handler, memory, timeout, runtime, env, description, role, layer, tags }) => {
    const functionConfigParams = {
        FunctionName: name,
        Description: description,
        Handler: handler,
        MemorySize: memory,
        Role: role.arn,
        Runtime: runtime,
        Timeout: timeout,
        Environment: {
            Variables: env
        }
    };
    if (layer && layer.arn) {
        functionConfigParams.Layers = [layer.arn];
    }
    const res = await lambda
        .updateFunctionConfiguration(functionConfigParams)
        .promise();
    if (tags) {
        const listTagsResponse = await lambda
            .listTags({ Resource: res.FunctionArn })
            .promise();
        const currentTags = listTagsResponse.Tags;
        if (!_.isEqual(currentTags, tags)) {
            if (currentTags && Object.keys(currentTags).length > 0)
                await lambda
                    .untagResource({
                    Resource: res.FunctionArn,
                    TagKeys: Object.keys(currentTags)
                })
                    .promise();
            if (Object.keys(tags).length > 0)
                await lambda
                    .tagResource({
                    Resource: res.FunctionArn,
                    Tags: tags
                })
                    .promise();
        }
    }
    return { arn: res.FunctionArn, hash: res.CodeSha256 };
};
exports.updateLambdaConfig = updateLambdaConfig;
const updateLambdaCode = async ({ lambda, name, zipPath, bucket }) => {
    const functionCodeParams = {
        FunctionName: name,
        Publish: true
    };
    if (bucket) {
        functionCodeParams.S3Bucket = bucket;
        functionCodeParams.S3Key = path.basename(zipPath);
    }
    else {
        functionCodeParams.ZipFile = await (0, fs_extra_1.readFile)(zipPath);
    }
    const res = await lambda.updateFunctionCode(functionCodeParams).promise();
    return res.FunctionArn;
};
exports.updateLambdaCode = updateLambdaCode;
const getLambda = async ({ lambda, name }) => {
    try {
        const res = await lambda
            .getFunctionConfiguration({
            FunctionName: name
        })
            .promise();
        return {
            name: res.FunctionName,
            description: res.Description,
            timeout: res.Timeout,
            runtime: res.Runtime,
            role: {
                arn: res.Role
            },
            handler: res.Handler,
            memory: res.MemorySize,
            hash: res.CodeSha256,
            env: res.Environment ? res.Environment.Variables : {},
            arn: res.FunctionArn
        };
    }
    catch (e) {
        if (e.code === "ResourceNotFoundException") {
            return null;
        }
        throw e;
    }
};
exports.getLambda = getLambda;
const deleteLambda = async ({ lambda, name }) => {
    try {
        const params = { FunctionName: name };
        await lambda.deleteFunction(params).promise();
    }
    catch (error) {
        if (error.code !== "ResourceNotFoundException") {
            throw error;
        }
    }
};
exports.deleteLambda = deleteLambda;
const getPolicy = ({ name, region, accountId }) => {
    return {
        Version: "2012-10-17",
        Statement: [
            {
                Action: ["logs:CreateLogStream"],
                Resource: [
                    `arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/${name}:*`
                ],
                Effect: "Allow"
            },
            {
                Action: ["logs:PutLogEvents"],
                Resource: [
                    `arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/${name}:*:*`
                ],
                Effect: "Allow"
            }
        ]
    };
};
exports.getPolicy = getPolicy;
const configChanged = (prevLambda, lambda) => {
    const keys = [
        "description",
        "runtime",
        "role",
        "handler",
        "memory",
        "timeout",
        "env",
        "hash"
    ];
    const inputs = (0, ramda_1.pick)(keys, lambda);
    inputs.role = { arn: inputs.role.arn };
    const prevInputs = (0, ramda_1.pick)(keys, prevLambda);
    return (0, ramda_1.not)((0, ramda_1.equals)(inputs, prevInputs));
};
exports.configChanged = configChanged;
const pack = (code, shims = [], packDeps = true) => {
    if (core_1.utils.isArchivePath(code)) {
        return path.resolve(code);
    }
    let exclude = [];
    if (!packDeps) {
        exclude = ["node_modules/**"];
    }
    const outputFilePath = path.join((0, os_1.tmpdir)(), `${Math.random().toString(36).substring(6)}.zip`);
    return packDir(code, outputFilePath, shims, exclude);
};
exports.pack = pack;
