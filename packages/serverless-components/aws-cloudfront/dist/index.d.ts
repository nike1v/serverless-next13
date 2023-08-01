import AWS from "aws-sdk";
declare const createCloudFrontDistribution: (cf: AWS.CloudFront, s3: AWS.S3, inputs: Record<string, any>) => Promise<{
    id: string;
    arn: string;
    url: string;
}>;
declare const updateCloudFrontDistribution: (cf: any, s3: AWS.S3, distributionId: string, inputs: Record<string, any>) => Promise<{
    id: string;
    arn: string;
    url: string;
}>;
declare const deleteCloudFrontDistribution: (cf: AWS.CloudFront, distributionId: string) => Promise<void>;
declare const setCloudFrontDistributionTags: (cf: AWS.CloudFront, distributionArn: string, tags: Record<string, string>) => Promise<void>;
export { createCloudFrontDistribution, updateCloudFrontDistribution, deleteCloudFrontDistribution, setCloudFrontDistributionTags };
