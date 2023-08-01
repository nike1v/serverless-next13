"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCloudFrontDistributionReady = exports.createInvalidation = void 0;
const cloudfront_1 = __importDefault(require("./lib/cloudfront"));
const createInvalidation = (options) => {
    const { credentials, distributionId, paths } = options;
    const cf = (0, cloudfront_1.default)({
        credentials
    });
    return cf.createInvalidation({ distributionId, paths });
};
exports.createInvalidation = createInvalidation;
const checkCloudFrontDistributionReady = async (options) => {
    var _a;
    const { credentials, distributionId, waitDuration, pollInterval } = options;
    const startDate = new Date();
    const startTime = startDate.getTime();
    const waitDurationMillis = waitDuration * 1000;
    const cf = (0, cloudfront_1.default)({
        credentials
    });
    while (new Date().getTime() - startTime < waitDurationMillis) {
        const result = await cf.getDistribution(distributionId);
        if (((_a = result.Distribution) === null || _a === void 0 ? void 0 : _a.Status) === "Deployed") {
            return true;
        }
        await new Promise((r) => setTimeout(r, pollInterval * 1000));
    }
    return false;
};
exports.checkCloudFrontDistributionReady = checkCloudFrontDistributionReady;
