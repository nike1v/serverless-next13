"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOriginConfig = void 0;
const getBucketNameFromUrl_1 = require("./getBucketNameFromUrl");
const getOriginConfig = (origin, options = { originAccessIdentityId: "" }) => {
    const originUrl = typeof origin === "string" ? origin : origin.url;
    const { hostname, pathname } = new URL(originUrl);
    const originConfig = {
        Id: hostname,
        DomainName: hostname,
        CustomHeaders: {
            Quantity: 0,
            Items: []
        },
        OriginPath: pathname === "/" ? "" : pathname
    };
    if (originUrl.includes("s3")) {
        const bucketName = (0, getBucketNameFromUrl_1.getBucketNameFromUrl)(hostname);
        originConfig.Id = bucketName;
        originConfig.DomainName = hostname;
        originConfig.S3OriginConfig = {
            OriginAccessIdentity: options.originAccessIdentityId
                ? `origin-access-identity/cloudfront/${options.originAccessIdentityId}`
                : ""
        };
    }
    else {
        if (typeof origin === "object" && origin.headers) {
            originConfig.CustomHeaders.Quantity = Object.keys(origin.headers).length;
            originConfig.CustomHeaders.Items = Object.keys(origin.headers).map((key) => ({
                HeaderName: key,
                HeaderValue: origin.headers[key]
            }));
        }
        originConfig.CustomOriginConfig = {
            HTTPPort: 80,
            HTTPSPort: 443,
            OriginProtocolPolicy: typeof origin === "object" && origin.protocolPolicy
                ? origin.protocolPolicy
                : "https-only",
            OriginSslProtocols: {
                Quantity: 1,
                Items: ["TLSv1.2"]
            },
            OriginReadTimeout: 30,
            OriginKeepaliveTimeout: 5
        };
    }
    return originConfig;
};
exports.getOriginConfig = getOriginConfig;
