"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextJsLambdaApp = void 0;
const provider_aws_1 = require("@cdktf/provider-aws");
const cdktf_1 = require("cdktf");
const constructs_1 = require("constructs");
const provider_archive_1 = require("@cdktf/provider-archive");
const provider_null_1 = require("@cdktf/provider-null");
const path = __importStar(require("path"));
const DEFAULT_OUTPUT_DIR = ".serverless_nextjs";
const DEFAULT_AWS_REGION = "us-east-1";
/**
 * A Terraform for CDK construct to deploy Next.js apps to Lambda + API Gateway V2 + CloudFront.
 * This requires minimal configuration to deploy, and nearly all of the Terraform resource configurations can be overridden.
 * Note: this is a work-in-progress and may not function properly.
 * Refer to Terraform docs at {@link https://registry.terraform.io/providers/hashicorp/aws/latest/docs}
 */
class NextJsLambdaApp extends constructs_1.Construct {
    constructor(scope, id, props) {
        var _a, _b, _c, _d, _e, _f;
        super(scope, id);
        this.props = props;
        const coreBuildOptions = {
            outputDir: DEFAULT_OUTPUT_DIR,
            nextConfigDir: "./"
        };
        const lambdaBuildOptions = {
            bucketName: (_b = (_a = this.props.s3BucketConfig) === null || _a === void 0 ? void 0 : _a.bucket) !== null && _b !== void 0 ? _b : `${this.props.appName}-sls-next-bucket`,
            bucketRegion: (_c = this.props.region) !== null && _c !== void 0 ? _c : DEFAULT_AWS_REGION
        };
        // Build app using LambdaBuilder if we are supposed to build (see if this can be a TerraForm null resource component
        // Note that the code can't be executed directly since we are using Terraform to apply the changes, so we need to
        // FIXME: implement this script
        this.buildResource = new provider_null_1.Resource(this, "BuildResource", {});
        this.buildResource.addOverride("provisioner", [
            {
                "local-exec": {
                    command: `node ${__dirname}/dist/build/scripts/buildApp.js --coreBuildOptions ${JSON.stringify(coreBuildOptions)} --lambdaBuildOptions ${JSON.stringify(lambdaBuildOptions)}`
                }
            }
        ]);
        // Zip up code
        new provider_archive_1.ArchiveProvider(this, "Archive");
        this.defaultLambdaZip = new provider_archive_1.DataArchiveFile(this, "DefaultLambdaZip", {
            sourceDir: path.join((_d = coreBuildOptions.outputDir) !== null && _d !== void 0 ? _d : DEFAULT_OUTPUT_DIR, "default-lambda"),
            outputPath: "default-lambda.zip",
            type: "zip"
        });
        this.imageLambdaZip = new provider_archive_1.DataArchiveFile(this, "ImageLambdaZip", {
            sourceDir: path.join((_e = coreBuildOptions.outputDir) !== null && _e !== void 0 ? _e : DEFAULT_OUTPUT_DIR, "image-lambda"),
            outputPath: "image-lambda.zip",
            type: "zip"
        });
        // Create infrastructure all within the same region, or us-east-1 if not specified
        new provider_aws_1.AwsProvider(this, "AWS", {
            region: (_f = this.props.region) !== null && _f !== void 0 ? _f : DEFAULT_AWS_REGION
        });
        // S3 bucket
        this.s3Bucket = this.createS3Bucket();
        // Upload assets. We don't use the S3.S3BucketObject resources since it will force S3 state to be the same as the source,
        // so previous assets may be lost. Instead, we execute a script via a custom resource which will retain the last 2 versions
        // and delete other old resources.
        // FIXME: implement this script
        this.uploadAssetsResource = new provider_null_1.Resource(this, "UploadAssetsResource", {
            dependsOn: [this.s3Bucket]
        });
        this.uploadAssetsResource.addOverride("provisioner", [
            {
                "local-exec": {
                    command: `node ${__dirname}/dist/deploy/cdktf/scripts/uploadAssets.js --coreBuildOptions ${JSON.stringify(props.coreBuildOptions)} --lambdaBuildOptions ${JSON.stringify(props.lambdaBuildOptions)}`
                }
            }
        ]);
        // SQS queue for regeneration
        this.regenerationQueue = this.createRegenerationQueue();
        // Default lambda which also handles regeneration requests
        this.defaultLambdaPolicy = this.createDefaultLambdaPolicy();
        this.defaultLambdaRole = this.createDefaultLambdaRole();
        this.defaultLambda = this.createDefaultLambda();
        this.defaultLambdaRegenerationEventSourceMapping =
            this.createDefaultLambdaRegenerationEventSourceMapping();
        // Image lambda for image optimization
        this.imageLambdaPolicy = this.createImageLambdaPolicy();
        this.imageLambdaRole = this.createImageLambdaRole();
        this.imageLambda = this.createImageLambda();
        // API Gateway V2
        this.apiGatewayApi = this.createAPIGatewayApi();
        this.apiGatewayMainStage = this.createAPIGatewayMainStage();
        // Permissions for API Gateway to invoke Lambda
        this.defaultLambdaPermission = this.createDefaultLambdaPermission();
        this.imageLambdaPermission = this.createImageLambdaPermission();
        // API Gateway Lambda Integrations
        this.apiGatewayDefaultIntegration =
            this.createAPIGatewayDefaultIntegration();
        this.apiGatewayImageIntegration = this.createAPIGatewayImageIntegration();
        // API Gateway Routes
        this.apiGatewayDefaultRoute = this.createAPIGatewayDefaultRoute();
        this.apiGatewayImagesRoute = this.createAPIGatewayImageRoute();
        // CloudFront distribution created on top of API Gateway V2 for caching static files purposes
        this.cloudFrontCachePolicy = this.createCloudFrontCachePolicy();
        this.cloudFrontDistribution = this.createCloudFrontDistribution();
        // Run custom script to invalidate CF distribution, since there is no Terraform resource to do so but we need to do it each time.
        // FIXME: implement this script and allow custom paths
        const invalidationPaths = ["/*"];
        this.invalidateCloudFrontResource = new provider_null_1.Resource(this, "invalidateCloudFrontResource", {
            dependsOn: [this.defaultLambda, this.imageLambda, this.apiGatewayApi]
        });
        this.invalidateCloudFrontResource.addOverride("provisioner", [
            {
                "local-exec": {
                    command: `node ./dist/deploy/scripts/invalidateCloudFrontDistribution.js --paths ${JSON.stringify(invalidationPaths)}`
                }
            }
        ]);
    }
    /**
     * Create an API Gateway V2 HTTP API which will serve all Next.js requests.
     * @protected
     */
    createAPIGatewayApi() {
        const apiGatewayApiConfig = {
            name: `${this.props.appName}-sls-next-api-gateway`,
            description: `${this.props.appName} API Gateway`,
            protocolType: "HTTP"
        };
        Object.assign(apiGatewayApiConfig, this.props.apiGatewayApiConfig);
        return new provider_aws_1.apigatewayv2.Apigatewayv2Api(this, "ApiGateway", apiGatewayApiConfig);
    }
    createAPIGatewayMainStage() {
        const apiGatewayApiMainStageConfig = {
            apiId: this.apiGatewayApi.id,
            name: "main",
            autoDeploy: true
        };
        Object.assign(apiGatewayApiMainStageConfig, this.props.apiGatewayApiMainStageConfig);
        return new provider_aws_1.apigatewayv2.Apigatewayv2Stage(this, "ApiGatewayMainStage", apiGatewayApiMainStageConfig);
    }
    createS3Bucket() {
        const s3BucketConfig = {
            bucket: `${this.props.appName}-sls-next-bucket`,
            accelerationStatus: "Enabled"
        };
        Object.assign(s3BucketConfig, this.props.s3BucketConfig);
        return new provider_aws_1.s3.S3Bucket(this, "NextJsS3Bucket", s3BucketConfig);
    }
    createDefaultLambda() {
        const lambdaConfig = {
            functionName: `${this.props.appName}-sls-next-default-lambda`,
            role: this.defaultLambdaRole.arn,
            memorySize: 512,
            runtime: "nodejs18.x",
            handler: "index.handler",
            description: `${this.props.appName} Default Lambda`,
            timeout: 15,
            filename: this.defaultLambdaZip.outputPath,
            sourceCodeHash: this.defaultLambdaZip.outputBase64Sha256
        };
        Object.assign(lambdaConfig, this.props.defaultLambdaConfig);
        return new provider_aws_1.lambdafunction.LambdaFunction(this, "DefaultLambda", lambdaConfig);
    }
    createImageLambda() {
        const lambdaConfig = {
            functionName: `${this.props.appName}-sls-next-image-lambda`,
            role: this.imageLambdaRole.arn,
            memorySize: 512,
            runtime: "nodejs18.x",
            handler: "index.handler",
            description: `${this.props.appName} Image Lambda`,
            timeout: 15,
            filename: this.imageLambdaZip.outputPath,
            sourceCodeHash: this.imageLambdaZip.outputBase64Sha256
        };
        Object.assign(lambdaConfig, this.props.imageLambdaConfig);
        return new provider_aws_1.lambdafunction.LambdaFunction(this, "ImageLambda", lambdaConfig);
    }
    createRegenerationQueue() {
        const regenerationQueueConfig = {
            name: `${this.props.appName}-sls-next-regen-queue.fifo`,
            fifoQueue: true
        };
        Object.assign(regenerationQueueConfig, this.props.regenerationQueueConfig);
        return new provider_aws_1.sqs.SqsQueue(this, "RegenerationQueue", regenerationQueueConfig);
    }
    createRegenerationQueuePolicy() {
        const regenerationQueuePolicyConfig = {
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "RegenerationQueueStatement",
                        Effect: "Allow",
                        Principal: `${this.defaultLambdaRole.id}`,
                        Action: "sqs:SendMessage",
                        Resource: `${this.regenerationQueue.arn}`
                    }
                ]
            }),
            queueUrl: this.regenerationQueue.url
        };
        Object.assign(regenerationQueuePolicyConfig, this.props.regenerationQueuePolicyConfig);
        return regenerationQueuePolicyConfig;
    }
    createCloudFrontDistribution() {
        const cloudFrontDistributionConfig = {
            defaultCacheBehavior: {
                allowedMethods: [
                    "DELETE",
                    "GET",
                    "HEAD",
                    "OPTIONS",
                    "PATCH",
                    "POST",
                    "PUT"
                ],
                cachedMethods: ["GET", "HEAD"],
                targetOriginId: this.apiGatewayApi.id,
                viewerProtocolPolicy: "redirect-to-https",
                compress: true,
                cachePolicyId: this.cloudFrontCachePolicy.id
            },
            enabled: true,
            origin: [
                {
                    customOriginConfig: {
                        httpPort: 80,
                        httpsPort: 443,
                        originProtocolPolicy: "https-only",
                        originSslProtocols: ["TLSv1.2"]
                    },
                    domainName: cdktf_1.Fn.replace(this.apiGatewayApi.apiEndpoint, "https://", ""),
                    originId: this.apiGatewayApi.id,
                    originPath: `/${this.apiGatewayMainStage.name}`
                }
            ],
            restrictions: { geoRestriction: { restrictionType: "none" } },
            viewerCertificate: { cloudfrontDefaultCertificate: true }
        };
        Object.assign(cloudFrontDistributionConfig, this.props.cloudFrontDistributionConfig);
        return new provider_aws_1.cloudfront.CloudfrontDistribution(this, "CloudFrontDistribution", cloudFrontDistributionConfig);
    }
    createCloudFrontCachePolicy() {
        const cloudFrontCachePolicyConfig = {
            name: `${this.props.appName}-cache-policy`,
            comment: `${this.props.appName} cache policy`,
            defaultTtl: 0,
            minTtl: 0,
            maxTtl: 31536000,
            parametersInCacheKeyAndForwardedToOrigin: {
                enableAcceptEncodingBrotli: true,
                enableAcceptEncodingGzip: true,
                cookiesConfig: {
                    cookieBehavior: "all"
                },
                headersConfig: {
                    headerBehavior: "whitelist",
                    headers: {
                        items: ["Accept", "Accept-Language", "Authorization"]
                    }
                },
                queryStringsConfig: {
                    queryStringBehavior: "all"
                }
            }
        };
        Object.assign(cloudFrontCachePolicyConfig, this.props.cloudFrontCachePolicyConfig);
        return new provider_aws_1.cloudfront.CloudfrontCachePolicy(this, "CloudFrontCachePolicy", cloudFrontCachePolicyConfig);
    }
    createAPIGatewayDefaultRoute() {
        const apiGatewayDefaultRouteConfig = {
            apiId: this.apiGatewayApi.id,
            routeKey: "$default",
            target: `integrations/${this.apiGatewayDefaultIntegration.id}`
        };
        Object.assign(apiGatewayDefaultRouteConfig, this.props.apiGatewayDefaultRouteConfig);
        return new provider_aws_1.apigatewayv2.Apigatewayv2Route(this, "ApiGatewayDefaultRoute", apiGatewayDefaultRouteConfig);
    }
    createAPIGatewayImageRoute() {
        const apiGatewayImageRouteConfig = {
            apiId: this.apiGatewayApi.id,
            routeKey: "GET /_next/image",
            target: `integrations/${this.apiGatewayImageIntegration.id}`
        };
        Object.assign(apiGatewayImageRouteConfig, this.props.apiGatewayImageRouteConfig);
        return new provider_aws_1.apigatewayv2.Apigatewayv2Route(this, "ApiGatewayImageRoute", apiGatewayImageRouteConfig);
    }
    createAPIGatewayDefaultIntegration() {
        const apiGatewayDefaultIntegrationConfig = {
            apiId: this.apiGatewayApi.id,
            integrationType: "AWS_PROXY",
            integrationUri: this.defaultLambda.arn,
            integrationMethod: "POST",
            payloadFormatVersion: "2.0"
        };
        Object.assign(apiGatewayDefaultIntegrationConfig, this.props.apiGatewayDefaultIntegrationConfig);
        return new provider_aws_1.apigatewayv2.Apigatewayv2Integration(this, "ApiGatewayDefaultIntegration", apiGatewayDefaultIntegrationConfig);
    }
    createDefaultLambdaPermission() {
        const defaultLambdaPermissionConfig = {
            statementId: "AllowExecutionFromAPIGateway",
            action: "lambda:InvokeFunction",
            functionName: this.defaultLambda.functionName,
            principal: "apigateway.amazonaws.com"
        };
        Object.assign(defaultLambdaPermissionConfig, this.props.defaultLambdaPermissionConfig);
        return new provider_aws_1.lambdafunction.LambdaPermission(this, "DefaultLambdaPermission", defaultLambdaPermissionConfig);
    }
    createImageLambdaPermission() {
        const imageLambdaPermissionConfig = {
            statementId: "AllowExecutionFromAPIGateway",
            action: "lambda:InvokeFunction",
            functionName: this.imageLambda.functionName,
            principal: "apigateway.amazonaws.com"
        };
        Object.assign(imageLambdaPermissionConfig, this.props.defaultLambdaPermissionConfig);
        return new provider_aws_1.lambdafunction.LambdaPermission(this, "ImageLambdaPermission", imageLambdaPermissionConfig);
    }
    createAPIGatewayImageIntegration() {
        const apiGatewayImageIntegrationConfig = {
            apiId: this.apiGatewayApi.id,
            integrationType: "AWS_PROXY",
            integrationUri: this.imageLambda.arn,
            integrationMethod: "POST",
            payloadFormatVersion: "2.0"
        };
        Object.assign(apiGatewayImageIntegrationConfig, this.props.apiGatewayImageIntegrationConfig);
        return new provider_aws_1.apigatewayv2.Apigatewayv2Integration(this, "ApiGatewayImageIntegration", apiGatewayImageIntegrationConfig);
    }
    // IAM Roles
    createDefaultLambdaRole() {
        const defaultLambdaRoleConfig = {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Effect: "Allow",
                        Sid: "DefaultLambdaAssumeRolePolicy",
                        Principal: {
                            Service: "lambda.amazonaws.com"
                        }
                    }
                ]
            }),
            managedPolicyArns: [
                "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                this.defaultLambdaPolicy.arn
            ]
        };
        Object.assign(defaultLambdaRoleConfig, this.props.defaultLambdaRoleConfig);
        return new provider_aws_1.iam.IamRole(this, `DefaultLambdaRole`, defaultLambdaRoleConfig);
    }
    createImageLambdaRole() {
        const imageLambdaRoleConfig = {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Effect: "Allow",
                        Sid: "ImageLambdaAssumeRolePolicy",
                        Principal: {
                            Service: "lambda.amazonaws.com"
                        }
                    }
                ]
            }),
            managedPolicyArns: [
                "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                this.imageLambdaPolicy.arn
            ]
        };
        Object.assign(imageLambdaRoleConfig, this.props.imageLambdaRoleConfig);
        return new provider_aws_1.iam.IamRole(this, `ImageLambdaRole`, imageLambdaRoleConfig);
    }
    createDefaultLambdaPolicy() {
        const defaultLambdaPolicyConfig = {
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "s3:GetObject",
                        Effect: "Allow",
                        Resource: `${this.s3Bucket.arn}/*`
                    },
                    {
                        Action: "s3:PutObject",
                        Effect: "Allow",
                        Resource: `${this.s3Bucket.arn}/*`
                    },
                    {
                        Action: "s3:ListBucket",
                        Effect: "Allow",
                        Resource: this.s3Bucket.arn
                    },
                    {
                        Action: "sqs:SendMessage",
                        Effect: "Allow",
                        Resource: this.regenerationQueue.arn
                    },
                    {
                        Action: "sqs:ReceiveMessage",
                        Effect: "Allow",
                        Resource: this.regenerationQueue.arn
                    },
                    {
                        Action: "sqs:DeleteMessage",
                        Effect: "Allow",
                        Resource: this.regenerationQueue.arn
                    },
                    {
                        Action: "sqs:GetQueueAttributes",
                        Effect: "Allow",
                        Resource: this.regenerationQueue.arn
                    }
                ]
            })
        };
        Object.assign(defaultLambdaPolicyConfig, this.props.defaultLambdaPolicyConfig);
        return new provider_aws_1.iam.IamPolicy(this, "DefaultLambdaPolicy", defaultLambdaPolicyConfig);
    }
    /**
     * Attach the default lambda to the regeneration queue so it can process regeneration event messages.
     * @protected
     */
    createDefaultLambdaRegenerationEventSourceMapping() {
        const defaultLambdaRegenerationEventSourceMappingConfig = {
            functionName: this.defaultLambda.arn,
            eventSourceArn: this.regenerationQueue.arn
        };
        Object.assign(defaultLambdaRegenerationEventSourceMappingConfig, this.props.defaultLambdaRegenerationEventSourceMappingConfig);
        return new provider_aws_1.lambdafunction.LambdaEventSourceMapping(this, "DefaultLambdaRegenerationEventSourceMapping", defaultLambdaRegenerationEventSourceMappingConfig);
    }
    createImageLambdaPolicy() {
        const imageLambdaPolicyConfig = {
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "s3:GetObject",
                        Effect: "Allow",
                        Resource: `${this.s3Bucket.arn}/*`
                    },
                    {
                        Action: "s3:ListBucket",
                        Effect: "Allow",
                        Resource: this.s3Bucket.arn
                    }
                ]
            })
        };
        Object.assign(imageLambdaPolicyConfig, this.props.imageLambdaPolicyConfig);
        return new provider_aws_1.iam.IamPolicy(this, "ImageLambdaPolicy", imageLambdaPolicyConfig);
    }
}
exports.NextJsLambdaApp = NextJsLambdaApp;
