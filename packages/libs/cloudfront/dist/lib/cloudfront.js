"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const constants_1 = require("./constants");
exports.default = ({ credentials }) => {
    var _a;
    if (aws_sdk_1.default === null || aws_sdk_1.default === void 0 ? void 0 : aws_sdk_1.default.config) {
        aws_sdk_1.default.config.update({
            maxRetries: parseInt((_a = process.env.SLS_NEXT_MAX_RETRIES) !== null && _a !== void 0 ? _a : "10"),
            retryDelayOptions: { base: 200 }
        });
    }
    const cloudFront = new aws_sdk_1.default.CloudFront({ credentials });
    return {
        createInvalidation: async (options) => {
            const timestamp = +new Date() + "";
            const { distributionId, callerReference = timestamp, paths = [constants_1.ALL_FILES_PATH] } = options;
            return await cloudFront
                .createInvalidation({
                DistributionId: distributionId,
                InvalidationBatch: {
                    CallerReference: callerReference,
                    Paths: {
                        Quantity: paths.length,
                        Items: paths
                    }
                }
            })
                .promise();
        },
        getDistribution: async (distributionId) => {
            return await cloudFront
                .getDistribution({
                Id: distributionId
            })
                .promise();
        }
    };
};
