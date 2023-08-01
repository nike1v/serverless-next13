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
const path = __importStar(require("path"));
const ramda_1 = require("ramda");
const core_1 = require("@serverless/core");
const utils_1 = require("./utils");
const defaults = {
    name: undefined,
    accelerated: true,
    region: "us-east-1",
    tags: undefined
};
class AwsS3 extends core_1.Component {
    async default(inputs = {}) {
        const config = (0, ramda_1.mergeDeepRight)(defaults, inputs);
        this.context.status(`Deploying`);
        config.name = inputs.name || this.state.name || this.context.resourceId();
        config.tags = inputs.tags || this.state.tags;
        this.context.debug(`Deploying bucket ${config.name} in region ${config.region}.`);
        const clients = (0, utils_1.getClients)(this.context.credentials.aws, config.region);
        await (0, utils_1.ensureBucket)(clients.regular, config.name, this.context.debug);
        if (config.accelerated) {
            if (config.name.includes(".")) {
                throw new Error("Accelerated buckets must be DNS-compliant and must NOT contain periods");
            }
            this.context.debug(`Setting acceleration to "${config.accelerated}" for bucket ${config.name}.`);
            await (0, utils_1.accelerateBucket)(clients.regular, config.name, config.accelerated);
        }
        if (config.cors) {
            this.context.debug(`Setting cors for bucket ${config.name}.`);
            await (0, utils_1.configureCors)(clients.regular, config.name, config.cors);
        }
        if (config.tags) {
            this.context.debug(`Configuring tags for bucket ${config.name}.`);
            await (0, utils_1.configureBucketTags)(clients.regular, config.name, config.tags);
        }
        const nameChanged = this.state.name && this.state.name !== config.name;
        if (nameChanged) {
            await this.remove();
        }
        this.state.name = config.name;
        this.state.region = config.region;
        this.state.accelerated = config.accelerated;
        this.state.url = `https://${config.name}.s3.amazonaws.com`;
        this.state.tags = config.tags;
        await this.save();
        this.context.debug(`Bucket ${config.name} was successfully deployed to the ${config.region} region.`);
        return this.state;
    }
    async remove() {
        this.context.status(`Removing`);
        if (!this.state.name) {
            this.context.debug(`Aborting removal. Bucket name not found in state.`);
            return;
        }
        const clients = (0, utils_1.getClients)(this.context.credentials.aws, this.state.region);
        this.context.debug(`Clearing bucket ${this.state.name} contents.`);
        await (0, utils_1.clearBucket)(this.state.accelerated ? clients.accelerated : clients.regular, this.state.name);
        this.context.debug(`Deleting bucket ${this.state.name} from region ${this.state.region}.`);
        await (0, utils_1.deleteBucket)(clients.regular, this.state.name);
        this.context.debug(`Bucket ${this.state.name} was successfully deleted from region ${this.state.region}.`);
        const outputs = {
            name: this.state.name,
            region: this.state.region,
            accelerated: this.state.accelerated
        };
        this.state = {};
        await this.save();
        return outputs;
    }
    async upload(inputs = {}) {
        this.context.status("Uploading");
        const name = this.state.name || inputs.name;
        const region = this.state.region || inputs.region || defaults.region;
        if (!name) {
            throw Error("Unable to upload. Bucket name not found in state.");
        }
        this.context.debug(`Starting upload to bucket ${name} in region ${region}`);
        const clients = (0, utils_1.getClients)(this.context.credentials.aws, region);
        if (inputs.dir && (await core_1.utils.dirExists(inputs.dir))) {
            if (inputs.zip) {
                this.context.debug(`Packing and uploading directory ${inputs.dir} to bucket ${name}`);
                const defaultKey = Math.random().toString(36).substring(6);
                await (0, utils_1.packAndUploadDir)({
                    s3: this.state.accelerated ? clients.accelerated : clients.regular,
                    bucketName: name,
                    dirPath: inputs.dir,
                    key: inputs.key || `${defaultKey}.zip`,
                    cacheControl: inputs.cacheControl
                });
            }
            else {
                this.context.debug(`Uploading directory ${inputs.dir} to bucket ${name}`);
                await (0, utils_1.uploadDir)(this.state.accelerated ? clients.accelerated : clients.regular, name, inputs.dir, inputs.cacheControl, { keyPrefix: inputs.keyPrefix });
            }
        }
        else if (inputs.file && (await core_1.utils.fileExists(inputs.file))) {
            this.context.debug(`Uploading file ${inputs.file} to bucket ${name}`);
            await (0, utils_1.uploadFile)({
                s3: this.state.accelerated ? clients.accelerated : clients.regular,
                bucketName: name,
                filePath: inputs.file,
                key: inputs.key || path.basename(inputs.file),
                cacheControl: inputs.cacheControl
            });
            this.context.debug(`File ${inputs.file} uploaded with key ${inputs.key || path.basename(inputs.file)}`);
        }
    }
}
exports.default = AwsS3;
