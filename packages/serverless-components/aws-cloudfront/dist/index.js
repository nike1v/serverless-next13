"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCloudFrontDistributionTags = exports.deleteCloudFrontDistribution = exports.updateCloudFrontDistribution = exports.createCloudFrontDistribution = void 0;
const parseInputOrigins_1 = __importDefault(require("./parseInputOrigins"));
const getDefaultCacheBehavior_1 = __importDefault(require("./getDefaultCacheBehavior"));
const createOriginAccessIdentity_1 = __importDefault(require("./createOriginAccessIdentity"));
const grantCloudFrontBucketAccess_1 = __importDefault(require("./grantCloudFrontBucketAccess"));
const getCustomErrorResponses_1 = __importDefault(require("./getCustomErrorResponses"));
const DEFAULT_MINIMUM_PROTOCOL_VERSION = "TLSv1.2_2019";
const DEFAULT_SSL_SUPPORT_METHOD = "sni-only";
const servePrivateContentEnabled = (inputs) => inputs.origins.some((origin) => {
    return origin && origin.private === true;
});
const updateBucketsPolicies = async (s3, origins, s3CanonicalUserId) => {
    const bucketNames = origins.Items.filter((origin) => origin.S3OriginConfig).map((origin) => origin.Id);
    await Promise.all(bucketNames.map((bucketName) => (0, grantCloudFrontBucketAccess_1.default)(s3, bucketName, s3CanonicalUserId)));
};
const createCloudFrontDistribution = async (cf, s3, inputs) => {
    var _a;
    const params = {
        DistributionConfig: {
            CallerReference: String(Date.now()),
            Comment: inputs.comment !== null && inputs.comment !== undefined
                ? inputs.comment
                : "",
            Aliases: inputs.aliases !== null && inputs.aliases !== undefined
                ? {
                    Quantity: inputs.aliases.length,
                    Items: inputs.aliases
                }
                : {
                    Quantity: 0,
                    Items: []
                },
            Origins: {
                Quantity: 0,
                Items: []
            },
            CustomErrorResponses: {
                Quantity: 0,
                Items: []
            },
            PriceClass: inputs.priceClass,
            Enabled: inputs.enabled,
            HttpVersion: "http2",
            DefaultCacheBehavior: undefined
        },
        Tags: {
            Items: []
        }
    };
    const distributionConfig = params.DistributionConfig;
    let originAccessIdentityId;
    let s3CanonicalUserId;
    if (servePrivateContentEnabled(inputs)) {
        ({ originAccessIdentityId, s3CanonicalUserId } =
            await (0, createOriginAccessIdentity_1.default)(cf));
    }
    const { Origins, CacheBehaviors } = (0, parseInputOrigins_1.default)(inputs.origins, {
        originAccessIdentityId
    });
    if (s3CanonicalUserId) {
        await updateBucketsPolicies(s3, Origins, s3CanonicalUserId);
    }
    distributionConfig.Origins = Origins;
    distributionConfig.DefaultCacheBehavior = (0, getDefaultCacheBehavior_1.default)(Origins.Items[0].Id, inputs.defaults);
    if (CacheBehaviors) {
        distributionConfig.CacheBehaviors = CacheBehaviors;
    }
    distributionConfig.CustomErrorResponses = (0, getCustomErrorResponses_1.default)(inputs.errorPages);
    if (inputs.webACLId !== undefined && inputs.webACLId !== null) {
        distributionConfig.WebACLId = inputs.webACLId;
    }
    if (inputs.restrictions !== undefined && inputs.restrictions !== null) {
        const geoRestriction = inputs.restrictions.geoRestriction;
        distributionConfig.Restrictions = {
            GeoRestriction: {
                RestrictionType: geoRestriction.restrictionType,
                Quantity: geoRestriction.items ? geoRestriction.items.length : 0
            }
        };
        if (geoRestriction.items && geoRestriction.items.length > 0) {
            distributionConfig.Restrictions.GeoRestriction.Items =
                geoRestriction.items;
        }
    }
    if (inputs.certificate !== undefined && inputs.certificate !== null) {
        if (typeof inputs.certificate !== "object") {
            throw new Error("Certificate input must be an object with cloudFrontDefaultCertificate, acmCertificateArn, iamCertificateId, sslSupportMethod, minimumProtocolVersion.");
        }
        distributionConfig.ViewerCertificate = {
            CloudFrontDefaultCertificate: inputs.certificate.cloudFrontDefaultCertificate,
            ACMCertificateArn: inputs.certificate.acmCertificateArn,
            IAMCertificateId: inputs.certificate.iamCertificateId,
            SSLSupportMethod: inputs.certificate.sslSupportMethod || DEFAULT_SSL_SUPPORT_METHOD,
            MinimumProtocolVersion: inputs.certificate.minimumProtocolVersion ||
                DEFAULT_MINIMUM_PROTOCOL_VERSION
        };
    }
    const tagsList = [];
    for (const [key, value] of Object.entries((_a = inputs.tags) !== null && _a !== void 0 ? _a : {})) {
        tagsList.push({ Key: key, Value: value });
    }
    params.Tags.Items = tagsList;
    const res = await cf
        .createDistributionWithTags({ DistributionConfigWithTags: params })
        .promise();
    return {
        id: res.Distribution.Id,
        arn: res.Distribution.ARN,
        url: `https://${res.Distribution.DomainName}`
    };
};
exports.createCloudFrontDistribution = createCloudFrontDistribution;
const updateCloudFrontDistribution = async (cf, s3, distributionId, inputs) => {
    const params = await cf
        .getDistributionConfig({ Id: distributionId })
        .promise();
    params.IfMatch = params.ETag;
    delete params.ETag;
    params.Id = distributionId;
    params.DistributionConfig.Enabled = inputs.enabled;
    params.DistributionConfig.Comment =
        inputs.comment !== null && inputs.comment !== undefined
            ? inputs.comment
            : "";
    params.DistributionConfig.PriceClass = inputs.priceClass;
    if (inputs.aliases !== null && inputs.aliases !== undefined) {
        params.DistributionConfig.Aliases = {
            Items: inputs.aliases,
            Quantity: inputs.aliases.length
        };
    }
    if (inputs.webACLId !== undefined && inputs.webACLId !== null) {
        params.DistributionConfig.WebACLId = inputs.webACLId;
    }
    if (inputs.restrictions !== undefined && inputs.restrictions !== null) {
        const geoRestriction = inputs.restrictions.geoRestriction;
        params.DistributionConfig.Restrictions = {
            GeoRestriction: {
                RestrictionType: geoRestriction.restrictionType,
                Quantity: geoRestriction.items ? geoRestriction.items.length : 0,
                Items: geoRestriction.items
            }
        };
        if (geoRestriction.items && geoRestriction.items.length > 0) {
            params.DistributionConfig.Restrictions.GeoRestriction.Items =
                geoRestriction.items;
        }
    }
    if (inputs.certificate !== undefined && inputs.certificate !== null) {
        if (typeof inputs.certificate !== "object") {
            throw new Error("Certificate input must be an object with cloudFrontDefaultCertificate, acmCertificateArn, iamCertificateId, sslSupportMethod, minimumProtocolVersion.");
        }
        params.DistributionConfig.ViewerCertificate = {
            CloudFrontDefaultCertificate: inputs.certificate.cloudFrontDefaultCertificate,
            ACMCertificateArn: inputs.certificate.acmCertificateArn,
            IAMCertificateId: inputs.certificate.iamCertificateId,
            SSLSupportMethod: inputs.certificate.sslSupportMethod || DEFAULT_SSL_SUPPORT_METHOD,
            MinimumProtocolVersion: inputs.certificate.minimumProtocolVersion ||
                DEFAULT_MINIMUM_PROTOCOL_VERSION
        };
    }
    let s3CanonicalUserId;
    let { originAccessIdentityId } = inputs;
    if (servePrivateContentEnabled(inputs)) {
        if (originAccessIdentityId) {
            ({
                CloudFrontOriginAccessIdentity: { S3CanonicalUserId: s3CanonicalUserId }
            } = await cf
                .getCloudFrontOriginAccessIdentity({ Id: originAccessIdentityId })
                .promise());
        }
        else {
            ({ originAccessIdentityId, s3CanonicalUserId } =
                await (0, createOriginAccessIdentity_1.default)(cf));
        }
    }
    const { Origins, CacheBehaviors } = (0, parseInputOrigins_1.default)(inputs.origins, {
        originAccessIdentityId
    });
    if (s3CanonicalUserId) {
        await updateBucketsPolicies(s3, Origins, s3CanonicalUserId);
    }
    params.DistributionConfig.DefaultCacheBehavior = (0, getDefaultCacheBehavior_1.default)(Origins.Items[0].Id, inputs.defaults);
    const origins = params.DistributionConfig.Origins;
    const inputOrigins = Origins;
    const existingOriginIds = origins.Items.map((origin) => origin.Id);
    inputOrigins.Items.forEach((inputOrigin) => {
        const originIndex = existingOriginIds.indexOf(inputOrigin.Id);
        if (originIndex > -1) {
            origins.Items.splice(originIndex, 1, inputOrigin);
        }
        else {
            origins.Items.push(inputOrigin);
            origins.Quantity += 1;
        }
    });
    if (CacheBehaviors) {
        const behaviors = (params.DistributionConfig.CacheBehaviors = params
            .DistributionConfig.CacheBehaviors || { Items: [] });
        const behaviorPaths = behaviors.Items.map((b) => b.PathPattern);
        CacheBehaviors.Items.forEach((inputBehavior) => {
            const behaviorIndex = behaviorPaths.indexOf(inputBehavior.PathPattern);
            if (behaviorIndex > -1) {
                behaviors.Items.splice(behaviorIndex, 1, inputBehavior);
            }
            else {
                behaviors.Items.push(inputBehavior);
            }
        });
        behaviors.Quantity = behaviors.Items.length;
    }
    params.DistributionConfig.CustomErrorResponses = (0, getCustomErrorResponses_1.default)(inputs.errorPages);
    const res = await cf.updateDistribution(params).promise();
    return {
        id: res.Distribution.Id,
        arn: res.Distribution.ARN,
        url: `https://${res.Distribution.DomainName}`
    };
};
exports.updateCloudFrontDistribution = updateCloudFrontDistribution;
const disableCloudFrontDistribution = async (cf, distributionId) => {
    const params = await cf
        .getDistributionConfig({ Id: distributionId })
        .promise();
    params.IfMatch = params.ETag;
    delete params.ETag;
    params.Id = distributionId;
    params.DistributionConfig.Enabled = false;
    const res = await cf.updateDistribution(params).promise();
    return {
        id: res.Distribution.Id,
        arn: res.Distribution.ARN,
        url: `https://${res.Distribution.DomainName}`
    };
};
const deleteCloudFrontDistribution = async (cf, distributionId) => {
    try {
        const res = await cf
            .getDistributionConfig({ Id: distributionId })
            .promise();
        const params = { Id: distributionId, IfMatch: res.ETag };
        await cf.deleteDistribution(params).promise();
    }
    catch (e) {
        if (e.code === "DistributionNotDisabled") {
            await disableCloudFrontDistribution(cf, distributionId);
        }
        else {
            throw e;
        }
    }
};
exports.deleteCloudFrontDistribution = deleteCloudFrontDistribution;
const setCloudFrontDistributionTags = async (cf, distributionArn, tags) => {
    const listTagsResponse = await cf
        .listTagsForResource({
        Resource: distributionArn
    })
        .promise();
    const existingTags = {};
    if (listTagsResponse.Tags && listTagsResponse.Tags.Items) {
        for (const tag of listTagsResponse.Tags.Items) {
            existingTags[tag.Key] = tag.Value;
        }
    }
    if (Object.keys(existingTags).length > 0) {
        await cf
            .untagResource({
            Resource: distributionArn,
            TagKeys: {
                Items: Object.keys(existingTags)
            }
        })
            .promise();
    }
    const newTags = [];
    for (const [key, value] of Object.entries(tags)) {
        newTags.push({ Key: key, Value: value });
    }
    if (newTags.length > 0) {
        await cf
            .tagResource({
            Resource: distributionArn,
            Tags: {
                Items: newTags
            }
        })
            .promise();
    }
};
exports.setCloudFrontDistributionTags = setCloudFrontDistributionTags;
