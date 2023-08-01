"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getOriginConfig_1 = require("./getOriginConfig");
const getCacheBehavior_1 = __importDefault(require("./getCacheBehavior"));
const addLambdaAtEdgeToCacheBehavior_1 = __importDefault(require("./addLambdaAtEdgeToCacheBehavior"));
exports.default = (origins, options) => {
    const distributionOrigins = {
        Quantity: 0,
        Items: []
    };
    const distributionCacheBehaviors = {
        Quantity: 0,
        Items: []
    };
    for (const origin of origins) {
        const newOriginConfig = (0, getOriginConfig_1.getOriginConfig)(origin, options);
        const originConfig = distributionOrigins.Items.find(({ Id }) => Id === newOriginConfig.Id) ||
            newOriginConfig;
        if (originConfig === newOriginConfig) {
            distributionOrigins.Quantity = distributionOrigins.Quantity + 1;
            distributionOrigins.Items.push(originConfig);
        }
        if (typeof origin === "object") {
            for (const pathPattern in origin.pathPatterns) {
                const pathPatternConfig = origin.pathPatterns[pathPattern];
                const cacheBehavior = (0, getCacheBehavior_1.default)(pathPattern, pathPatternConfig, originConfig.Id);
                (0, addLambdaAtEdgeToCacheBehavior_1.default)(cacheBehavior, pathPatternConfig["lambda@edge"]);
                distributionCacheBehaviors.Quantity =
                    distributionCacheBehaviors.Quantity + 1;
                distributionCacheBehaviors.Items.push(cacheBehavior);
            }
        }
    }
    return {
        Origins: distributionOrigins,
        CacheBehaviors: distributionCacheBehaviors
    };
};
