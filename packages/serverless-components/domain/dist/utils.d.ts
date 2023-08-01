import AWS from "aws-sdk";
declare const getClients: (credentials: any, region?: string) => {
    route53: AWS.Route53;
    acm: AWS.ACM;
    cf: AWS.CloudFront;
};
declare const prepareSubdomains: (inputs: any) => any[];
declare const getOutdatedDomains: (inputs: any, state: any) => any;
declare const getDomainHostedZoneId: (route53: any, domain: any, privateZone: any) => Promise<any>;
declare const describeCertificateByArn: (acm: any, certificateArn: any) => Promise<any>;
declare const getCertificateArnByDomain: (acm: any, domain: any) => Promise<any>;
declare const createCertificate: (acm: any, domain: any) => Promise<any>;
declare const validateCertificate: (acm: any, route53: any, certificate: any, domain: any, domainHostedZoneId: any) => Promise<void>;
declare const configureDnsForCloudFrontDistribution: (route53: any, subdomain: any, domainHostedZoneId: any, distributionUrl: any, domainType: any, context: any) => any;
declare const removeCloudFrontDomainDnsRecords: (route53: any, domain: any, domainHostedZoneId: any, distributionUrl: any, context: any) => Promise<void>;
declare const addDomainToCloudfrontDistribution: (cf: any, subdomain: any, certificateArn: any, domainMinimumProtocolVersion: any, domainType: any, defaultCloudfrontInputs: any, context: any) => Promise<{
    id: any;
    arn: any;
    url: any;
}>;
declare const removeDomainFromCloudFrontDistribution: (cf: any, subdomain: any, domainMinimumProtocolVersion: any, context: any) => Promise<{
    id: any;
    arn: any;
    url: any;
}>;
declare const isMinimumProtocolVersionValid: (minimumProtocolVersion: any) => boolean;
export { getClients, prepareSubdomains, getOutdatedDomains, describeCertificateByArn, getCertificateArnByDomain, createCertificate, validateCertificate, getDomainHostedZoneId, configureDnsForCloudFrontDistribution, removeCloudFrontDomainDnsRecords, addDomainToCloudfrontDistribution, removeDomainFromCloudFrontDistribution, isMinimumProtocolVersionValid };
