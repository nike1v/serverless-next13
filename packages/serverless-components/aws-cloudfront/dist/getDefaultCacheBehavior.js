"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const addLambdaAtEdgeToCacheBehavior_1 = __importDefault(require("./addLambdaAtEdgeToCacheBehavior"));
const cacheBehaviorUtils_1 = require("./cacheBehaviorUtils");
exports.default = (originId, defaults = {}) => {
    const { allowedHttpMethods = ["HEAD", "GET"], forward = {}, minTTL = 0, defaultTTL = 86400, maxTTL = 31536000, compress = false, smoothStreaming = false, viewerProtocolPolicy = "redirect-to-https", fieldLevelEncryptionId = "", responseHeadersPolicyId = "", realtimeLogConfigArn = undefined } = defaults;
    const defaultCacheBehavior = {
        TargetOriginId: originId,
        ForwardedValues: (0, cacheBehaviorUtils_1.getForwardedValues)(forward),
        TrustedSigners: {
            Enabled: false,
            Quantity: 0,
            Items: []
        },
        ViewerProtocolPolicy: viewerProtocolPolicy,
        MinTTL: minTTL,
        AllowedMethods: {
            Quantity: allowedHttpMethods.length,
            Items: allowedHttpMethods,
            CachedMethods: {
                Quantity: 2,
                Items: ["HEAD", "GET"]
            }
        },
        SmoothStreaming: smoothStreaming,
        DefaultTTL: defaultTTL,
        MaxTTL: maxTTL,
        Compress: compress,
        LambdaFunctionAssociations: {
            Quantity: 0,
            Items: []
        },
        FieldLevelEncryptionId: fieldLevelEncryptionId,
        ResponseHeadersPolicyId: responseHeadersPolicyId,
        RealtimeLogConfigArn: realtimeLogConfigArn
    };
    (0, addLambdaAtEdgeToCacheBehavior_1.default)(defaultCacheBehavior, defaults["lambda@edge"]);
    return defaultCacheBehavior;
};
