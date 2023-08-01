"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const AwsSdkLambda = aws_sdk_1.default.Lambda;
const ramda_1 = require("ramda");
const core_1 = require("@serverless/core");
const utils_1 = require("./utils");
const waitUntilReady_1 = require("./waitUntilReady");
const outputsList = [
    "name",
    "hash",
    "description",
    "memory",
    "timeout",
    "code",
    "bucket",
    "shims",
    "handler",
    "runtime",
    "env",
    "role",
    "arn",
    "region",
    "tags"
];
const defaults = {
    description: "AWS Lambda Component",
    memory: 512,
    timeout: 10,
    code: process.cwd(),
    bucket: undefined,
    shims: [],
    handler: "handler.hello",
    runtime: "nodejs10.x",
    env: {},
    region: "us-east-1",
    tags: undefined
};
class AwsLambda extends core_1.Component {
    async default(inputs = {}) {
        var _a;
        this.context.status(`Deploying`);
        const config = (0, ramda_1.mergeDeepRight)(defaults, inputs);
        config.name = inputs.name || this.state.name || this.context.resourceId();
        config.tags = inputs.tags || this.state.tags;
        this.context.debug(`Starting deployment of lambda ${config.name} to the ${config.region} region.`);
        if (aws_sdk_1.default === null || aws_sdk_1.default === void 0 ? void 0 : aws_sdk_1.default.config) {
            aws_sdk_1.default.config.update({
                maxRetries: parseInt((_a = process.env.SLS_NEXT_MAX_RETRIES) !== null && _a !== void 0 ? _a : "10"),
                retryDelayOptions: { base: 200 }
            });
        }
        const lambda = new AwsSdkLambda({
            region: config.region,
            credentials: this.context.credentials.aws
        });
        if (!config.role || !config.role.arn) {
            const awsIamRole = await this.load("@serverless/aws-iam-role");
            const outputsAwsIamRole = await awsIamRole(config.role);
            config.role = { arn: outputsAwsIamRole.arn };
        }
        this.context.status("Packaging");
        this.context.debug(`Packaging lambda code from ${config.code}.`);
        config.zipPath = await (0, utils_1.pack)(config.code, config.shims);
        config.hash = await core_1.utils.hashFile(config.zipPath);
        const prevLambda = await (0, utils_1.getLambda)({ lambda, ...config });
        if (!prevLambda) {
            this.context.status(`Creating`);
            this.context.debug(`Creating lambda ${config.name} in the ${config.region} region.`);
            const createResult = await (0, utils_1.createLambda)({ lambda, ...config });
            config.arn = createResult.arn;
            config.hash = createResult.hash;
            await (0, waitUntilReady_1.waitUntilReady)(this.context, config.name, config.region);
        }
        else {
            config.arn = prevLambda.arn;
            if ((0, utils_1.configChanged)(prevLambda, config)) {
                if (prevLambda.hash !== config.hash) {
                    this.context.status(`Uploading code`);
                    this.context.debug(`Uploading ${config.name} lambda code.`);
                    await (0, utils_1.updateLambdaCode)({ lambda, ...config });
                }
                await (0, waitUntilReady_1.waitUntilReady)(this.context, config.name, config.region);
                this.context.status(`Updating`);
                this.context.debug(`Updating ${config.name} lambda config.`);
                const updateResult = await (0, utils_1.updateLambdaConfig)({ lambda, ...config });
                config.hash = updateResult.hash;
                await (0, waitUntilReady_1.waitUntilReady)(this.context, config.name, config.region);
            }
        }
        if (this.state.name && this.state.name !== config.name) {
            this.context.status(`Replacing`);
            await (0, utils_1.deleteLambda)({ lambda, name: this.state.name });
        }
        this.context.debug(`Successfully deployed lambda ${config.name} in the ${config.region} region.`);
        const outputs = (0, ramda_1.pick)(outputsList, config);
        this.state = outputs;
        await this.save();
        return outputs;
    }
    async publishVersion() {
        const { name, region, hash } = this.state;
        const lambda = new AwsSdkLambda({
            region,
            credentials: this.context.credentials.aws
        });
        const { Version } = await lambda
            .publishVersion({
            FunctionName: name,
            CodeSha256: hash
        })
            .promise();
        return { version: Version };
    }
    async remove() {
        this.context.status(`Removing`);
        if (!this.state.name) {
            this.context.debug(`Aborting removal. Function name not found in state.`);
            return;
        }
        const { name, region } = this.state;
        const lambda = new AwsSdkLambda({
            region,
            credentials: this.context.credentials.aws
        });
        const awsIamRole = await this.load("@serverless/aws-iam-role");
        await awsIamRole.remove();
        this.context.debug(`Removing lambda ${name} from the ${region} region.`);
        await (0, utils_1.deleteLambda)({ lambda, name });
        this.context.debug(`Successfully removed lambda ${name} from the ${region} region.`);
        const outputs = (0, ramda_1.pick)(outputsList, this.state);
        this.state = {};
        await this.save();
        return outputs;
    }
}
exports.default = AwsLambda;
