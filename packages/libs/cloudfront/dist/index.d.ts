import AWS from "aws-sdk";
import { Credentials } from "./lib/cloudfront";
export type CreateInvalidationOptions = {
    credentials: Credentials;
    distributionId: string;
    paths?: string[];
};
declare const createInvalidation: (options: CreateInvalidationOptions) => Promise<AWS.CloudFront.CreateInvalidationResult>;
export type CheckCloudFrontDistributionReadyOptions = {
    credentials: Credentials;
    distributionId: string;
    waitDuration: number;
    pollInterval: number;
};
declare const checkCloudFrontDistributionReady: (options: CheckCloudFrontDistributionReadyOptions) => Promise<boolean>;
export { createInvalidation, checkCloudFrontDistributionReady };
