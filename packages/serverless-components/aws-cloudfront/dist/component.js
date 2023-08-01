"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const ramda_1 = require("ramda");
const core_1 = require("@serverless/core");
const _1 = require("./");
class CloudFront extends core_1.Component {
    async default(inputs = {}) {
        var _a, _b, _c;
        this.context.status("Deploying");
        inputs.region = (_a = inputs.region) !== null && _a !== void 0 ? _a : "us-east-1";
        inputs.bucketRegion = (_b = inputs.bucketRegion) !== null && _b !== void 0 ? _b : "us-east-1";
        inputs.enabled = inputs.enabled !== false;
        inputs.comment =
            inputs.comment === null || inputs.comment === undefined
                ? ""
                : String(inputs.comment);
        inputs.aliases = inputs.aliases || undefined;
        inputs.priceClass = [
            "PriceClass_All",
            "PriceClass_200",
            "PriceClass_100"
        ].includes(inputs.priceClass)
            ? inputs.priceClass
            : "PriceClass_All";
        inputs.errorPages = inputs.errorPages || [];
        this.context.debug(`Starting deployment of CloudFront distribution to the ${inputs.region} region.`);
        if (aws_sdk_1.default === null || aws_sdk_1.default === void 0 ? void 0 : aws_sdk_1.default.config) {
            aws_sdk_1.default.config.update({
                maxRetries: parseInt((_c = process.env.SLS_NEXT_MAX_RETRIES) !== null && _c !== void 0 ? _c : "10"),
                retryDelayOptions: { base: 200 }
            });
        }
        const cf = new aws_sdk_1.default.CloudFront({
            credentials: this.context.credentials.aws,
            region: inputs.region
        });
        const s3 = new aws_sdk_1.default.S3({
            credentials: this.context.credentials.aws,
            region: inputs.bucketRegion
        });
        this.state.id = inputs.distributionId || this.state.id;
        if (this.state.id) {
            if (!(0, ramda_1.equals)(this.state.origins, inputs.origins) ||
                !(0, ramda_1.equals)(this.state.defaults, inputs.defaults) ||
                !(0, ramda_1.equals)(this.state.enabled, inputs.enabled) ||
                !(0, ramda_1.equals)(this.state.comment, inputs.comment) ||
                !(0, ramda_1.equals)(this.state.aliases, inputs.aliases) ||
                !(0, ramda_1.equals)(this.state.priceClass, inputs.priceClass) ||
                !(0, ramda_1.equals)(this.state.errorPages, inputs.errorPages) ||
                !(0, ramda_1.equals)(this.state.webACLId, inputs.webACLId) ||
                !(0, ramda_1.equals)(this.state.restrictions, inputs.restrictions) ||
                !(0, ramda_1.equals)(this.state.certificate, inputs.certificate) ||
                !(0, ramda_1.equals)(this.state.originAccessIdentityId, inputs.originAccessIdentityId) ||
                !(0, ramda_1.equals)(this.state.tags, inputs.tags)) {
                this.context.debug(`Updating CloudFront distribution of ID ${this.state.id}.`);
                this.state = await (0, _1.updateCloudFrontDistribution)(cf, s3, this.state.id, inputs);
            }
            if (inputs.tags && !(0, ramda_1.equals)(this.state.tags, inputs.tags)) {
                this.context.debug(`Updating tags for CloudFront distribution of ID ${this.state.id}.`);
                await (0, _1.setCloudFrontDistributionTags)(cf, this.state.arn, inputs.tags);
            }
        }
        else {
            this.context.debug(`Creating CloudFront distribution in the ${inputs.region} region.`);
            this.state = await (0, _1.createCloudFrontDistribution)(cf, s3, inputs);
        }
        this.state.region = inputs.region;
        this.state.enabled = inputs.enabled;
        this.state.comment = inputs.comment;
        this.state.aliases = inputs.aliases;
        this.state.priceClass = inputs.priceClass;
        this.state.origins = inputs.origins;
        this.state.errorPages = inputs.errorPages;
        this.state.defaults = inputs.defaults;
        this.state.tags = inputs.tags;
        await this.save();
        this.context.debug(`CloudFront deployed successfully with URL: ${this.state.url}.`);
        return this.state;
    }
    async remove() {
        this.context.status(`Removing`);
        if (!this.state.id) {
            return;
        }
        const cf = new aws_sdk_1.default.CloudFront({
            credentials: this.context.credentials.aws,
            region: this.state.region
        });
        await (0, _1.deleteCloudFrontDistribution)(cf, this.state.id);
        this.state = {};
        await this.save();
        this.context.debug(`CloudFront distribution was successfully removed.`);
        return {};
    }
}
exports.default = CloudFront;
