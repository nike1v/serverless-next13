import AWS from "aws-sdk";
type CloudFrontClientFactoryOptions = {
    credentials: Credentials;
};
type CreateInvalidationOptions = {
    distributionId: string;
    callerReference?: string;
    paths?: string[];
};
export type CloudFrontClient = {
    createInvalidation: (options: CreateInvalidationOptions) => Promise<AWS.CloudFront.CreateInvalidationResult>;
    getDistribution: (distributionId: string) => Promise<AWS.CloudFront.GetDistributionResult>;
};
export type Credentials = {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
};
declare const _default: ({ credentials }: CloudFrontClientFactoryOptions) => CloudFrontClient;
export default _default;
