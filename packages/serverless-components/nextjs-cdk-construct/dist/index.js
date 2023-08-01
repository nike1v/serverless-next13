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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextJSLambdaEdge = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const s3Deploy = __importStar(require("aws-cdk-lib/aws-s3-deployment"));
const cloudfront = __importStar(require("aws-cdk-lib/aws-cloudfront"));
const origins = __importStar(require("aws-cdk-lib/aws-cloudfront-origins"));
const aws_route53_1 = require("aws-cdk-lib/aws-route53");
const sqs = __importStar(require("aws-cdk-lib/aws-sqs"));
const lambdaEventSources = __importStar(require("aws-cdk-lib/aws-lambda-event-sources"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_route53_targets_1 = require("aws-cdk-lib/aws-route53-targets");
const aws_cloudfront_1 = require("aws-cdk-lib/aws-cloudfront");
const toLambdaOption_1 = require("./utils/toLambdaOption");
const readAssetsDirectory_1 = require("./utils/readAssetsDirectory");
const readInvalidationPathsFromManifest_1 = require("./utils/readInvalidationPathsFromManifest");
const reduceInvalidationPaths_1 = require("./utils/reduceInvalidationPaths");
const pathToPosix_1 = __importDefault(require("./utils/pathToPosix"));
const constructs_1 = require("constructs");
__exportStar(require("./props"), exports);
class NextJSLambdaEdge extends constructs_1.Construct {
    constructor(scope, id, props) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
        super(scope, id);
        this.props = props;
        this.apiBuildManifest = this.readApiBuildManifest();
        this.routesManifest = this.readRoutesManifest();
        this.imageManifest = this.readImageBuildManifest();
        this.defaultManifest = this.readDefaultManifest();
        this.prerenderManifest = this.readPrerenderManifest();
        this.bucket = new s3.Bucket(this, "PublicAssets", {
            publicReadAccess: false,
            // Given this resource is created internally and also should only contain
            // assets uploaded by this library we should be able to safely delete all
            // contents along with the bucket its self upon stack deletion.
            autoDeleteObjects: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            // Override props.
            ...(props.s3Props || {})
        });
        this.edgeLambdaRole = new aws_iam_1.Role(this, "NextEdgeLambdaRole", {
            assumedBy: new aws_iam_1.CompositePrincipal(new aws_iam_1.ServicePrincipal("lambda.amazonaws.com"), new aws_iam_1.ServicePrincipal("edgelambda.amazonaws.com")),
            managedPolicies: [
                aws_iam_1.ManagedPolicy.fromManagedPolicyArn(this, "NextApiLambdaPolicy", "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
            ]
        });
        const hasISRPages = Object.keys(this.prerenderManifest.routes).some((key) => typeof this.prerenderManifest.routes[key].initialRevalidateSeconds ===
            "number");
        const hasDynamicISRPages = Object.keys(this.prerenderManifest.dynamicRoutes).some((key) => this.prerenderManifest.dynamicRoutes[key].fallback !== false);
        if (hasISRPages || hasDynamicISRPages) {
            this.regenerationQueue = new sqs.Queue(this, "RegenerationQueue", {
                // We call the queue the same name as the bucket so that we can easily
                // reference it from within the lambda@edge, given we can't use env vars
                // in a lambda@edge
                queueName: `${this.bucket.bucketName}.fifo`,
                fifo: true,
                removalPolicy: cdk.RemovalPolicy.DESTROY
            });
            this.regenerationFunction = new lambda.Function(this, "RegenerationFunction", {
                handler: "index.handler",
                code: lambda.Code.fromAsset(path.join(this.props.serverlessBuildOutDir, "regeneration-lambda")),
                runtime: (_a = (0, toLambdaOption_1.toLambdaOption)("regenerationLambda", props.runtime)) !== null && _a !== void 0 ? _a : lambda.Runtime.NODEJS_16_X,
                memorySize: (_b = (0, toLambdaOption_1.toLambdaOption)("regenerationLambda", props.memory)) !== null && _b !== void 0 ? _b : undefined,
                timeout: (_c = (0, toLambdaOption_1.toLambdaOption)("regenerationLambda", props.timeout)) !== null && _c !== void 0 ? _c : aws_cdk_lib_1.Duration.seconds(30)
            });
            this.regenerationFunction.addEventSource(new lambdaEventSources.SqsEventSource(this.regenerationQueue));
        }
        this.defaultNextLambda = new lambda.Function(this, "NextLambda", {
            functionName: (0, toLambdaOption_1.toLambdaOption)("defaultLambda", props.name),
            description: `Default Lambda@Edge for Next CloudFront distribution`,
            handler: props.handler || "index.handler",
            currentVersionOptions: {
                removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN // retain old versions to prevent premature removal, cleanup via trigger later on
            },
            logRetention: logs.RetentionDays.THREE_DAYS,
            code: lambda.Code.fromAsset(path.join(this.props.serverlessBuildOutDir, "default-lambda")),
            role: this.edgeLambdaRole,
            runtime: (_d = (0, toLambdaOption_1.toLambdaOption)("defaultLambda", props.runtime)) !== null && _d !== void 0 ? _d : lambda.Runtime.NODEJS_16_X,
            memorySize: (_e = (0, toLambdaOption_1.toLambdaOption)("defaultLambda", props.memory)) !== null && _e !== void 0 ? _e : 512,
            timeout: (_f = (0, toLambdaOption_1.toLambdaOption)("defaultLambda", props.timeout)) !== null && _f !== void 0 ? _f : aws_cdk_lib_1.Duration.seconds(10)
        });
        this.bucket.grantReadWrite(this.defaultNextLambda);
        this.defaultNextLambda.currentVersion.addAlias("live");
        if ((hasISRPages || hasDynamicISRPages) && this.regenerationFunction) {
            this.bucket.grantReadWrite(this.regenerationFunction);
            (_g = this.regenerationQueue) === null || _g === void 0 ? void 0 : _g.grantSendMessages(this.defaultNextLambda);
            (_h = this.regenerationFunction) === null || _h === void 0 ? void 0 : _h.grantInvoke(this.defaultNextLambda);
        }
        const apis = (_j = this.apiBuildManifest) === null || _j === void 0 ? void 0 : _j.apis;
        const hasAPIPages = apis &&
            (Object.keys(apis.nonDynamic).length > 0 ||
                Object.keys(apis.dynamic).length > 0);
        this.nextApiLambda = null;
        if (hasAPIPages) {
            this.nextApiLambda = new lambda.Function(this, "NextApiLambda", {
                functionName: (0, toLambdaOption_1.toLambdaOption)("apiLambda", props.name),
                description: `Default Lambda@Edge for Next API CloudFront distribution`,
                handler: "index.handler",
                currentVersionOptions: {
                    removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
                    retryAttempts: 1 // async retry attempts
                },
                logRetention: logs.RetentionDays.THREE_DAYS,
                code: lambda.Code.fromAsset(path.join(this.props.serverlessBuildOutDir, "api-lambda")),
                role: this.edgeLambdaRole,
                runtime: (_k = (0, toLambdaOption_1.toLambdaOption)("apiLambda", props.runtime)) !== null && _k !== void 0 ? _k : lambda.Runtime.NODEJS_16_X,
                memorySize: (_l = (0, toLambdaOption_1.toLambdaOption)("apiLambda", props.memory)) !== null && _l !== void 0 ? _l : 512,
                timeout: (_m = (0, toLambdaOption_1.toLambdaOption)("apiLambda", props.timeout)) !== null && _m !== void 0 ? _m : aws_cdk_lib_1.Duration.seconds(10)
            });
            this.nextApiLambda.currentVersion.addAlias("live");
        }
        this.nextImageLambda = null;
        if (this.imageManifest) {
            this.nextImageLambda = new lambda.Function(this, "NextImageLambda", {
                functionName: (0, toLambdaOption_1.toLambdaOption)("imageLambda", props.name),
                description: `Default Lambda@Edge for Next Image CloudFront distribution`,
                handler: "index.handler",
                currentVersionOptions: {
                    removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
                    retryAttempts: 1 // async retry attempts
                },
                logRetention: logs.RetentionDays.THREE_DAYS,
                code: lambda.Code.fromAsset(path.join(this.props.serverlessBuildOutDir, "image-lambda")),
                role: this.edgeLambdaRole,
                runtime: (_o = (0, toLambdaOption_1.toLambdaOption)("imageLambda", props.runtime)) !== null && _o !== void 0 ? _o : lambda.Runtime.NODEJS_16_X,
                memorySize: (_p = (0, toLambdaOption_1.toLambdaOption)("imageLambda", props.memory)) !== null && _p !== void 0 ? _p : 512,
                timeout: (_q = (0, toLambdaOption_1.toLambdaOption)("imageLambda", props.timeout)) !== null && _q !== void 0 ? _q : aws_cdk_lib_1.Duration.seconds(10)
            });
            this.nextImageLambda.currentVersion.addAlias("live");
        }
        this.nextStaticsCachePolicy =
            props.nextStaticsCachePolicy ||
                new cloudfront.CachePolicy(this, "NextStaticsCache", {
                    cachePolicyName: (_r = props.cachePolicyName) === null || _r === void 0 ? void 0 : _r.staticsCache,
                    queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
                    headerBehavior: cloudfront.CacheHeaderBehavior.none(),
                    cookieBehavior: cloudfront.CacheCookieBehavior.none(),
                    defaultTtl: aws_cdk_lib_1.Duration.days(30),
                    maxTtl: aws_cdk_lib_1.Duration.days(30),
                    minTtl: aws_cdk_lib_1.Duration.days(30),
                    enableAcceptEncodingBrotli: true,
                    enableAcceptEncodingGzip: true
                });
        this.nextImageCachePolicy =
            props.nextImageCachePolicy ||
                new cloudfront.CachePolicy(this, "NextImageCache", {
                    cachePolicyName: (_s = props.cachePolicyName) === null || _s === void 0 ? void 0 : _s.imageCache,
                    queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
                    headerBehavior: cloudfront.CacheHeaderBehavior.allowList("Accept"),
                    cookieBehavior: cloudfront.CacheCookieBehavior.none(),
                    defaultTtl: aws_cdk_lib_1.Duration.days(1),
                    maxTtl: aws_cdk_lib_1.Duration.days(365),
                    minTtl: aws_cdk_lib_1.Duration.days(0),
                    enableAcceptEncodingBrotli: true,
                    enableAcceptEncodingGzip: true
                });
        this.nextLambdaCachePolicy =
            props.nextLambdaCachePolicy ||
                new cloudfront.CachePolicy(this, "NextLambdaCache", {
                    cachePolicyName: (_t = props.cachePolicyName) === null || _t === void 0 ? void 0 : _t.lambdaCache,
                    queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
                    headerBehavior: props.whiteListedHeaders
                        ? cloudfront.CacheHeaderBehavior.allowList(...props.whiteListedHeaders)
                        : cloudfront.CacheHeaderBehavior.none(),
                    cookieBehavior: {
                        behavior: ((_u = props.whiteListedCookies) === null || _u === void 0 ? void 0 : _u.length) ? "whitelist" : "all",
                        cookies: props.whiteListedCookies
                    },
                    defaultTtl: aws_cdk_lib_1.Duration.seconds(0),
                    maxTtl: aws_cdk_lib_1.Duration.days(365),
                    minTtl: aws_cdk_lib_1.Duration.seconds(0),
                    enableAcceptEncodingBrotli: true,
                    enableAcceptEncodingGzip: true
                });
        const edgeLambdas = [
            {
                includeBody: true,
                eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
                functionVersion: this.defaultNextLambda.currentVersion
            },
            {
                eventType: cloudfront.LambdaEdgeEventType.ORIGIN_RESPONSE,
                functionVersion: this.defaultNextLambda.currentVersion
            }
        ];
        const { edgeLambdas: additionalDefaultEdgeLambdas = [], ...defaultBehavior } = props.defaultBehavior || {};
        this.distribution = new cloudfront.Distribution(this, "NextJSDistribution", {
            enableLogging: props.withLogging ? true : undefined,
            certificate: (_v = props.domain) === null || _v === void 0 ? void 0 : _v.certificate,
            domainNames: props.domain ? props.domain.domainNames : undefined,
            defaultRootObject: "",
            defaultBehavior: {
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                origin: new origins.S3Origin(this.bucket),
                allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                compress: true,
                cachePolicy: this.nextLambdaCachePolicy,
                edgeLambdas: [...edgeLambdas, ...additionalDefaultEdgeLambdas],
                ...(defaultBehavior || {})
            },
            additionalBehaviors: {
                ...(this.nextImageLambda
                    ? {
                        [this.pathPattern("_next/image*")]: {
                            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                            origin: new origins.S3Origin(this.bucket),
                            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                            cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                            compress: true,
                            cachePolicy: this.nextImageCachePolicy,
                            originRequestPolicy: new cloudfront.OriginRequestPolicy(this, "ImageOriginRequest", {
                                queryStringBehavior: aws_cloudfront_1.OriginRequestQueryStringBehavior.all()
                            }),
                            edgeLambdas: [
                                {
                                    eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
                                    functionVersion: this.nextImageLambda.currentVersion
                                }
                            ]
                        }
                    }
                    : {}),
                [this.pathPattern("_next/data/*")]: {
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    origin: new origins.S3Origin(this.bucket),
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                    compress: true,
                    cachePolicy: this.nextLambdaCachePolicy,
                    edgeLambdas
                },
                [this.pathPattern("_next/*")]: {
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    origin: new origins.S3Origin(this.bucket),
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                    compress: true,
                    cachePolicy: this.nextStaticsCachePolicy
                },
                [this.pathPattern("static/*")]: {
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    origin: new origins.S3Origin(this.bucket),
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                    compress: true,
                    cachePolicy: this.nextStaticsCachePolicy
                },
                ...(this.nextApiLambda
                    ? {
                        [this.pathPattern("api/*")]: {
                            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                            origin: new origins.S3Origin(this.bucket),
                            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                            cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                            compress: true,
                            cachePolicy: this.nextLambdaCachePolicy,
                            edgeLambdas: [
                                {
                                    includeBody: true,
                                    eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
                                    functionVersion: this.nextApiLambda.currentVersion
                                }
                            ]
                        }
                    }
                    : {}),
                ...(props.behaviours || {})
            },
            // Override props.
            ...(props.cloudfrontProps || {})
        });
        const assetsDirectory = path.join(props.serverlessBuildOutDir, "assets");
        const { basePath } = this.routesManifest || {};
        const normalizedBasePath = basePath && basePath.length > 0 ? basePath.slice(1) : "";
        const assets = (0, readAssetsDirectory_1.readAssetsDirectory)({
            assetsDirectory: path.join(assetsDirectory, normalizedBasePath)
        });
        // This `BucketDeployment` deploys just the BUILD_ID file. We don't actually
        // use the BUILD_ID file at runtime, however in this case we use it as a
        // file to allow us to create an invalidation of all the routes as evaluated
        // in the function `readInvalidationPathsFromManifest`.
        new s3Deploy.BucketDeployment(this, `AssetDeploymentBuildID`, {
            destinationBucket: this.bucket,
            sources: [
                s3Deploy.Source.asset(assetsDirectory, { exclude: ["**", "!BUILD_ID"] })
            ],
            // This will actually cause the file to exist at BUILD_ID, we do this so
            // that the prune will only prune /BUILD_ID/*, rather than all files fromm
            // the root upwards.
            destinationKeyPrefix: "/BUILD_ID",
            distribution: this.distribution,
            distributionPaths: props.invalidationPaths ||
                (0, reduceInvalidationPaths_1.reduceInvalidationPaths)((0, readInvalidationPathsFromManifest_1.readInvalidationPathsFromManifest)(this.defaultManifest))
        });
        Object.keys(assets).forEach((key) => {
            const { path: assetPath, cacheControl } = assets[key];
            new s3Deploy.BucketDeployment(this, `AssetDeployment_${key}`, {
                destinationBucket: this.bucket,
                sources: [s3Deploy.Source.asset(assetPath)],
                cacheControl: [s3Deploy.CacheControl.fromString(cacheControl)],
                // The source contents will be unzipped to and loaded into the S3 bucket
                // at the root '/', we don't want this, we want to maintain the same
                // path on S3 as their local path. Note that this should be a posix path.
                destinationKeyPrefix: (0, pathToPosix_1.default)(path.relative(assetsDirectory, assetPath)),
                // Source directories are uploaded with `--sync` this means that any
                // files that don't exist in the source directory, but do in the S3
                // bucket, will be removed.
                prune: true
            });
        });
        if ((_w = props.domain) === null || _w === void 0 ? void 0 : _w.hostedZone) {
            const hostedZone = props.domain.hostedZone;
            props.domain.domainNames.forEach((domainName, index) => {
                this.aRecord = new aws_route53_1.ARecord(this, `AliasRecord_${index}`, {
                    recordName: domainName,
                    zone: hostedZone,
                    target: aws_route53_1.RecordTarget.fromAlias(new aws_route53_targets_1.CloudFrontTarget(this.distribution))
                });
            });
        }
    }
    pathPattern(pattern) {
        const { basePath } = this.routesManifest || {};
        return basePath && basePath.length > 0
            ? `${basePath.slice(1)}/${pattern}`
            : pattern;
    }
    readRoutesManifest() {
        return fs.readJSONSync(path.join(this.props.serverlessBuildOutDir, "default-lambda/routes-manifest.json"));
    }
    readDefaultManifest() {
        return fs.readJSONSync(path.join(this.props.serverlessBuildOutDir, "default-lambda/manifest.json"));
    }
    readPrerenderManifest() {
        return fs.readJSONSync(path.join(this.props.serverlessBuildOutDir, "default-lambda/prerender-manifest.json"));
    }
    readApiBuildManifest() {
        const apiPath = path.join(this.props.serverlessBuildOutDir, "api-lambda/manifest.json");
        if (!fs.existsSync(apiPath))
            return null;
        return fs.readJsonSync(apiPath);
    }
    readImageBuildManifest() {
        const imageLambdaPath = path.join(this.props.serverlessBuildOutDir, "image-lambda/manifest.json");
        return fs.existsSync(imageLambdaPath)
            ? fs.readJSONSync(imageLambdaPath)
            : null;
    }
}
exports.NextJSLambdaEdge = NextJSLambdaEdge;
//# sourceMappingURL=index.js.map