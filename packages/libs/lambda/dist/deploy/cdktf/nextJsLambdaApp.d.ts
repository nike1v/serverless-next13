import { apigatewayv2 as APIGatewayV2, cloudfront as CloudFront, iam as IAM, lambdafunction as LambdaFunction, s3 as S3, sqs as SQS } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { DataArchiveFile } from "@cdktf/provider-archive";
import { Resource } from "@cdktf/provider-null";
import { CoreBuildOptions } from "@sls-next/core";
import { LambdaBuildOptions } from "src/types";
export type NextJsLambdaAppProps = {
    /**
     * The app name. This will prefix names of various infrastructure such as Lambda, S3 bucket, SQS queue, etc.
     * Please ensure the name only contains alphanumeric characters and dashes to be compatible across all resources.
     */
    appName: string;
    /**
     * The AWS region to provision the Next.js app infrastructure.
     * If omitted, it will default to us-east-1.
     */
    region?: string;
    coreBuildOptions?: CoreBuildOptions;
    lambdaBuildOptions?: LambdaBuildOptions;
    imageLambdaPolicyConfig?: Partial<IAM.IamPolicyConfig>;
    defaultLambdaPolicyConfig?: Partial<IAM.IamPolicyConfig>;
    s3BucketConfig?: Partial<S3.S3BucketConfig>;
    apiGatewayApiConfig?: Partial<APIGatewayV2.Apigatewayv2ApiConfig>;
    apiGatewayApiMainStageConfig?: Partial<APIGatewayV2.Apigatewayv2StageConfig>;
    apiGatewayDefaultRouteConfig?: Partial<APIGatewayV2.Apigatewayv2RouteConfig>;
    apiGatewayImageRouteConfig?: Partial<APIGatewayV2.Apigatewayv2RouteConfig>;
    apiGatewayDefaultIntegrationConfig?: Partial<APIGatewayV2.Apigatewayv2IntegrationConfig>;
    apiGatewayImageIntegrationConfig?: Partial<APIGatewayV2.Apigatewayv2IntegrationConfig>;
    domainConfig?: Partial<APIGatewayV2.Apigatewayv2DomainNameConfig>;
    defaultLambdaConfig?: Partial<LambdaFunction.LambdaFunctionConfig>;
    defaultLambdaPermissionConfig?: Partial<LambdaFunction.LambdaPermissionConfig>;
    defaultLambdaRegenerationEventSourceMappingConfig?: Partial<LambdaFunction.LambdaEventSourceMapping>;
    defaultLambdaRoleConfig?: Partial<IAM.IamRoleConfig>;
    imageLambdaConfig?: Partial<LambdaFunction.LambdaFunctionConfig>;
    imageLambdaPermissionConfig?: Partial<LambdaFunction.LambdaPermissionConfig>;
    imageLambdaRoleConfig?: Partial<IAM.IamRoleConfig>;
    regenerationQueueConfig?: Partial<SQS.SqsQueueConfig>;
    regenerationQueuePolicyConfig?: Partial<SQS.SqsQueuePolicyConfig>;
    cloudFrontDistributionConfig?: Partial<CloudFront.CloudfrontDistributionConfig>;
    cloudFrontCachePolicyConfig?: Partial<CloudFront.CloudfrontCachePolicyConfig>;
};
/**
 * A Terraform for CDK construct to deploy Next.js apps to Lambda + API Gateway V2 + CloudFront.
 * This requires minimal configuration to deploy, and nearly all of the Terraform resource configurations can be overridden.
 * Note: this is a work-in-progress and may not function properly.
 * Refer to Terraform docs at {@link https://registry.terraform.io/providers/hashicorp/aws/latest/docs}
 */
export declare class NextJsLambdaApp extends Construct {
    protected readonly props: NextJsLambdaAppProps;
    protected s3Bucket: S3.S3Bucket;
    protected defaultLambda: LambdaFunction.LambdaFunction;
    protected imageLambda: LambdaFunction.LambdaFunction;
    protected apiGatewayApi: APIGatewayV2.Apigatewayv2Api;
    protected apiGatewayDefaultIntegration: APIGatewayV2.Apigatewayv2Integration;
    protected apiGatewayImageIntegration: APIGatewayV2.Apigatewayv2Integration;
    protected apiGatewayDefaultRoute: APIGatewayV2.Apigatewayv2Route;
    protected apiGatewayImagesRoute: APIGatewayV2.Apigatewayv2Route;
    protected cloudFrontDistribution: CloudFront.CloudfrontDistribution;
    protected regenerationQueue: SQS.SqsQueue;
    protected defaultLambdaRole: IAM.IamRole;
    protected imageLambdaRole: IAM.IamRole;
    protected apiGatewayMainStage: APIGatewayV2.Apigatewayv2Stage;
    protected defaultLambdaZip: DataArchiveFile;
    protected imageLambdaZip: DataArchiveFile;
    protected defaultLambdaPolicy: IAM.IamPolicy;
    protected imageLambdaPolicy: IAM.IamPolicy;
    protected uploadAssetsResource: Resource;
    protected defaultLambdaRegenerationEventSourceMapping: LambdaFunction.LambdaEventSourceMapping;
    protected defaultLambdaPermission: LambdaFunction.LambdaPermission;
    protected imageLambdaPermission: LambdaFunction.LambdaPermission;
    protected cloudFrontCachePolicy: CloudFront.CloudfrontCachePolicy;
    protected buildResource: Resource;
    protected invalidateCloudFrontResource: Resource;
    constructor(scope: Construct, id: string, props: NextJsLambdaAppProps);
    /**
     * Create an API Gateway V2 HTTP API which will serve all Next.js requests.
     * @protected
     */
    protected createAPIGatewayApi(): APIGatewayV2.Apigatewayv2Api;
    protected createAPIGatewayMainStage(): APIGatewayV2.Apigatewayv2Stage;
    protected createS3Bucket(): S3.S3Bucket;
    protected createDefaultLambda(): LambdaFunction.LambdaFunction;
    protected createImageLambda(): LambdaFunction.LambdaFunction;
    protected createRegenerationQueue(): SQS.SqsQueue;
    protected createRegenerationQueuePolicy(): SQS.SqsQueuePolicyConfig;
    protected createCloudFrontDistribution(): CloudFront.CloudfrontDistribution;
    protected createCloudFrontCachePolicy(): CloudFront.CloudfrontCachePolicy;
    protected createAPIGatewayDefaultRoute(): APIGatewayV2.Apigatewayv2Route;
    protected createAPIGatewayImageRoute(): APIGatewayV2.Apigatewayv2Route;
    protected createAPIGatewayDefaultIntegration(): APIGatewayV2.Apigatewayv2Integration;
    protected createDefaultLambdaPermission(): LambdaFunction.LambdaPermission;
    protected createImageLambdaPermission(): LambdaFunction.LambdaPermission;
    protected createAPIGatewayImageIntegration(): APIGatewayV2.Apigatewayv2Integration;
    protected createDefaultLambdaRole(): IAM.IamRole;
    protected createImageLambdaRole(): IAM.IamRole;
    protected createDefaultLambdaPolicy(): IAM.IamPolicy;
    /**
     * Attach the default lambda to the regeneration queue so it can process regeneration event messages.
     * @protected
     */
    protected createDefaultLambdaRegenerationEventSourceMapping(): LambdaFunction.LambdaEventSourceMapping;
    private createImageLambdaPolicy;
}
