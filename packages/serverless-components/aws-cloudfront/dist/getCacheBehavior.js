"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cacheBehaviorUtils_1 = require("./cacheBehaviorUtils");
exports.default = (pathPattern, pathPatternConfig, originId) => {
    const { allowedHttpMethods = ["GET", "HEAD"], minTTL, defaultTTL, maxTTL, compress = true, smoothStreaming = false, viewerProtocolPolicy = "https-only", fieldLevelEncryptionId = "", responseHeadersPolicyId = "", trustedSigners = {
        Enabled: false,
        Quantity: 0
    } } = pathPatternConfig;
    return {
        ForwardedValues: (0, cacheBehaviorUtils_1.getForwardedValues)(pathPatternConfig.forward, {
            cookies: "all",
            queryString: true
        }),
        MinTTL: minTTL,
        PathPattern: pathPattern,
        TargetOriginId: originId,
        TrustedSigners: trustedSigners,
        ViewerProtocolPolicy: viewerProtocolPolicy,
        AllowedMethods: {
            Quantity: allowedHttpMethods.length,
            Items: allowedHttpMethods,
            CachedMethods: {
                Items: ["GET", "HEAD"],
                Quantity: 2
            }
        },
        Compress: compress,
        SmoothStreaming: smoothStreaming,
        DefaultTTL: defaultTTL,
        MaxTTL: maxTTL,
        FieldLevelEncryptionId: fieldLevelEncryptionId,
        ResponseHeadersPolicyId: responseHeadersPolicyId,
        LambdaFunctionAssociations: {
            Quantity: 0,
            Items: []
        }
    };
};
