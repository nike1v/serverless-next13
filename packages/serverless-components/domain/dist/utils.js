"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMinimumProtocolVersionValid = exports.removeDomainFromCloudFrontDistribution = exports.addDomainToCloudfrontDistribution = exports.removeCloudFrontDomainDnsRecords = exports.configureDnsForCloudFrontDistribution = exports.getDomainHostedZoneId = exports.validateCertificate = exports.createCertificate = exports.getCertificateArnByDomain = exports.describeCertificateByArn = exports.getOutdatedDomains = exports.prepareSubdomains = exports.getClients = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const core_1 = require("@serverless/core");
const HOSTED_ZONE_ID = "Z2FDTNDATAQYW2";
const getClients = (credentials, region = "us-east-1") => {
    if (aws_sdk_1.default && aws_sdk_1.default.config) {
        aws_sdk_1.default.config.update({
            maxRetries: parseInt(process.env.SLS_NEXT_MAX_RETRIES || "10"),
            retryDelayOptions: { base: 200 }
        });
    }
    const route53 = new aws_sdk_1.default.Route53({
        credentials,
        region
    });
    const acm = new aws_sdk_1.default.ACM({
        credentials,
        region: "us-east-1"
    });
    const cf = new aws_sdk_1.default.CloudFront({
        credentials,
        region
    });
    return {
        route53,
        acm,
        cf
    };
};
exports.getClients = getClients;
const prepareSubdomains = (inputs) => {
    const subdomains = [];
    for (const subdomain in inputs.subdomains || {}) {
        const domainObj = {};
        domainObj.domain = `${subdomain}.${inputs.domain}`;
        if (inputs.subdomains[subdomain].url.includes("cloudfront")) {
            domainObj.distributionId = inputs.subdomains[subdomain].id;
            domainObj.url = inputs.subdomains[subdomain].url;
            domainObj.type = "awsCloudFront";
        }
        subdomains.push(domainObj);
    }
    return subdomains;
};
exports.prepareSubdomains = prepareSubdomains;
const getOutdatedDomains = (inputs, state) => {
    if (inputs.domain !== state.domain) {
        return state;
    }
    const outdatedDomains = {
        domain: state.domain,
        subdomains: []
    };
    for (const domain of state.subdomains) {
        if (!inputs.subdomains[domain.domain]) {
            outdatedDomains.subdomains.push(domain);
        }
    }
    return outdatedDomains;
};
exports.getOutdatedDomains = getOutdatedDomains;
const getDomainHostedZoneId = async (route53, domain, privateZone) => {
    const params = {
        DNSName: domain
    };
    const hostedZonesRes = await route53.listHostedZonesByName(params).promise();
    const hostedZone = hostedZonesRes.HostedZones.find((zone) => zone.Config.PrivateZone === privateZone && zone.Name.includes(domain));
    if (!hostedZone) {
        throw Error(`Domain ${domain} was not found in your AWS account. Please purchase it from Route53 first then try again.`);
    }
    return hostedZone.Id.replace("/hostedzone/", "");
};
exports.getDomainHostedZoneId = getDomainHostedZoneId;
const describeCertificateByArn = async (acm, certificateArn) => {
    const certificate = await acm
        .describeCertificate({ CertificateArn: certificateArn })
        .promise();
    return certificate && certificate.Certificate
        ? certificate.Certificate
        : null;
};
exports.describeCertificateByArn = describeCertificateByArn;
const getCertificateArnByDomain = async (acm, domain) => {
    const listRes = await acm.listCertificates().promise();
    for (const certificate of listRes.CertificateSummaryList) {
        if (certificate.DomainName === domain && certificate.CertificateArn) {
            if (domain.startsWith("www.")) {
                const nakedDomain = domain.replace("www.", "");
                const certDetail = await describeCertificateByArn(acm, certificate.CertificateArn);
                const nakedDomainCert = certDetail.DomainValidationOptions.find(({ DomainName }) => DomainName === nakedDomain);
                if (!nakedDomainCert) {
                    continue;
                }
            }
            return certificate.CertificateArn;
        }
    }
    return null;
};
exports.getCertificateArnByDomain = getCertificateArnByDomain;
const createCertificate = async (acm, domain) => {
    const wildcardSubDomain = `*.${domain}`;
    const params = {
        DomainName: domain,
        SubjectAlternativeNames: [domain, wildcardSubDomain],
        ValidationMethod: "DNS"
    };
    const res = await acm.requestCertificate(params).promise();
    return res.CertificateArn;
};
exports.createCertificate = createCertificate;
const validateCertificate = async (acm, route53, certificate, domain, domainHostedZoneId) => {
    let readinessCheckCount = 16;
    let statusCheckCount = 16;
    let validationResourceRecord;
    const checkReadiness = async function () {
        if (readinessCheckCount < 1) {
            throw new Error("Your newly created AWS ACM Certificate is taking a while to initialize.  Please try running this component again in a few minutes.");
        }
        const cert = await describeCertificateByArn(acm, certificate.CertificateArn);
        cert.DomainValidationOptions.forEach((option) => {
            if (domain === option.DomainName) {
                validationResourceRecord = option.ResourceRecord;
            }
        });
        if (!validationResourceRecord) {
            readinessCheckCount--;
            await core_1.utils.sleep(5000);
            return await checkReadiness();
        }
    };
    await checkReadiness();
    const checkRecordsParams = {
        HostedZoneId: domainHostedZoneId,
        MaxItems: "10",
        StartRecordName: validationResourceRecord.Name
    };
    const existingRecords = await route53
        .listResourceRecordSets(checkRecordsParams)
        .promise();
    if (!existingRecords.ResourceRecordSets.length) {
        const recordParams = {
            HostedZoneId: domainHostedZoneId,
            ChangeBatch: {
                Changes: [
                    {
                        Action: "UPSERT",
                        ResourceRecordSet: {
                            Name: validationResourceRecord.Name,
                            Type: validationResourceRecord.Type,
                            TTL: 300,
                            ResourceRecords: [
                                {
                                    Value: validationResourceRecord.Value
                                }
                            ]
                        }
                    }
                ]
            }
        };
        await route53.changeResourceRecordSets(recordParams).promise();
    }
    const checkStatus = async function () {
        if (statusCheckCount < 1) {
            throw new Error("Your newly validated AWS ACM Certificate is taking a while to register as valid.  Please try running this component again in a few minutes.");
        }
        const cert = await describeCertificateByArn(acm, certificate.CertificateArn);
        if (cert.Status !== "ISSUED") {
            statusCheckCount--;
            await core_1.utils.sleep(10000);
            return await checkStatus();
        }
    };
    await checkStatus();
};
exports.validateCertificate = validateCertificate;
const configureDnsForCloudFrontDistribution = (route53, subdomain, domainHostedZoneId, distributionUrl, domainType, context) => {
    const dnsRecordParams = {
        HostedZoneId: domainHostedZoneId,
        ChangeBatch: {
            Changes: []
        }
    };
    if (!subdomain.domain.startsWith("www.") || domainType !== "apex") {
        dnsRecordParams.ChangeBatch.Changes.push({
            Action: "UPSERT",
            ResourceRecordSet: {
                Name: subdomain.domain,
                Type: "A",
                AliasTarget: {
                    HostedZoneId: HOSTED_ZONE_ID,
                    DNSName: distributionUrl,
                    EvaluateTargetHealth: false
                }
            }
        });
    }
    if (subdomain.domain.startsWith("www.") && domainType !== "www") {
        dnsRecordParams.ChangeBatch.Changes.push({
            Action: "UPSERT",
            ResourceRecordSet: {
                Name: subdomain.domain.replace("www.", ""),
                Type: "A",
                AliasTarget: {
                    HostedZoneId: HOSTED_ZONE_ID,
                    DNSName: distributionUrl,
                    EvaluateTargetHealth: false
                }
            }
        });
    }
    context.debug("Updating Route53 DNS records with parameters:\n" +
        JSON.stringify(dnsRecordParams, null, 2));
    return route53.changeResourceRecordSets(dnsRecordParams).promise();
};
exports.configureDnsForCloudFrontDistribution = configureDnsForCloudFrontDistribution;
const removeCloudFrontDomainDnsRecords = async (route53, domain, domainHostedZoneId, distributionUrl, context) => {
    const params = {
        HostedZoneId: domainHostedZoneId,
        ChangeBatch: {
            Changes: [
                {
                    Action: "DELETE",
                    ResourceRecordSet: {
                        Name: domain,
                        Type: "A",
                        AliasTarget: {
                            HostedZoneId: HOSTED_ZONE_ID,
                            DNSName: distributionUrl,
                            EvaluateTargetHealth: false
                        }
                    }
                }
            ]
        }
    };
    try {
        context.debug("Updating Route53 with parameters:\n" + JSON.stringify(params, null, 2));
        await route53.changeResourceRecordSets(params).promise();
    }
    catch (e) {
        if (e.code !== "InvalidChangeBatch") {
            throw e;
        }
    }
};
exports.removeCloudFrontDomainDnsRecords = removeCloudFrontDomainDnsRecords;
const addDomainToCloudfrontDistribution = async (cf, subdomain, certificateArn, domainMinimumProtocolVersion, domainType, defaultCloudfrontInputs, context) => {
    const params = await cf
        .getDistributionConfig({ Id: subdomain.distributionId })
        .promise();
    params.IfMatch = params.ETag;
    delete params.ETag;
    params.Id = subdomain.distributionId;
    params.DistributionConfig.Aliases = {
        Items: [subdomain.domain]
    };
    if (subdomain.domain.startsWith("www.")) {
        if (domainType === "apex") {
            params.DistributionConfig.Aliases.Items = [
                `${subdomain.domain.replace("www.", "")}`
            ];
        }
        else if (domainType !== "www") {
            params.DistributionConfig.Aliases.Items.push(`${subdomain.domain.replace("www.", "")}`);
        }
    }
    params.DistributionConfig.Aliases.Quantity =
        params.DistributionConfig.Aliases.Items.length;
    params.DistributionConfig.ViewerCertificate = {
        ACMCertificateArn: certificateArn,
        SSLSupportMethod: "sni-only",
        MinimumProtocolVersion: domainMinimumProtocolVersion,
        Certificate: certificateArn,
        CertificateSource: "acm",
        ...defaultCloudfrontInputs.viewerCertificate
    };
    context.debug("Updating CloudFront distribution with parameters:\n" +
        JSON.stringify(params, null, 2));
    const res = await cf.updateDistribution(params).promise();
    return {
        id: res.Distribution.Id,
        arn: res.Distribution.ARN,
        url: res.Distribution.DomainName
    };
};
exports.addDomainToCloudfrontDistribution = addDomainToCloudfrontDistribution;
const removeDomainFromCloudFrontDistribution = async (cf, subdomain, domainMinimumProtocolVersion, context) => {
    const params = await cf
        .getDistributionConfig({ Id: subdomain.distributionId })
        .promise();
    params.IfMatch = params.ETag;
    delete params.ETag;
    params.Id = subdomain.distributionId;
    params.DistributionConfig.Aliases = {
        Quantity: 0,
        Items: []
    };
    params.DistributionConfig.ViewerCertificate = {
        SSLSupportMethod: "sni-only",
        MinimumProtocolVersion: domainMinimumProtocolVersion
    };
    context.debug("Updating CloudFront distribution with parameters:\n" +
        JSON.stringify(params, null, 2));
    const res = await cf.updateDistribution(params).promise();
    return {
        id: res.Distribution.Id,
        arn: res.Distribution.ARN,
        url: res.Distribution.DomainName
    };
};
exports.removeDomainFromCloudFrontDistribution = removeDomainFromCloudFrontDistribution;
const isMinimumProtocolVersionValid = (minimumProtocolVersion) => {
    var _a;
    const validMinimumProtocolVersions = /(^SSLv3$|^TLSv1$|^TLSv1.1_2016$|^TLSv1.2_2018$|^TLSv1.2_2019$|^TLSv1.2_2021$|^TLSv1_2016$)/g;
    return (((_a = minimumProtocolVersion.match(validMinimumProtocolVersions)) === null || _a === void 0 ? void 0 : _a.length) === 1);
};
exports.isMinimumProtocolVersionValid = isMinimumProtocolVersionValid;
