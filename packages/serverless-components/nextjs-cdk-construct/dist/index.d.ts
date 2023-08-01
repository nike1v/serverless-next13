import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { ARecord } from "aws-cdk-lib/aws-route53";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Role } from "aws-cdk-lib/aws-iam";
import { Props } from "./props";
import { Construct } from "constructs";
export * from "./props";
export declare class NextJSLambdaEdge extends Construct {
    private props;
    private routesManifest;
    private apiBuildManifest;
    private imageManifest;
    private defaultManifest;
    private prerenderManifest;
    distribution: cloudfront.Distribution;
    bucket: s3.Bucket;
    edgeLambdaRole: Role;
    defaultNextLambda: lambda.Function;
    nextApiLambda: lambda.Function | null;
    nextImageLambda: lambda.Function | null;
    nextStaticsCachePolicy: cloudfront.CachePolicy;
    nextImageCachePolicy: cloudfront.CachePolicy;
    nextLambdaCachePolicy: cloudfront.CachePolicy;
    aRecord?: ARecord;
    regenerationQueue?: sqs.Queue;
    regenerationFunction?: lambda.Function;
    constructor(scope: Construct, id: string, props: Props);
    private pathPattern;
    private readRoutesManifest;
    private readDefaultManifest;
    private readPrerenderManifest;
    private readApiBuildManifest;
    private readImageBuildManifest;
}
