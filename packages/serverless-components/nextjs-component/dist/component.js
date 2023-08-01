"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@serverless/core");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const lambda_at_edge_1 = require("@sls-next/lambda-at-edge");
const s3_static_assets_1 = require("@sls-next/s3-static-assets");
const cloudfront_1 = require("@sls-next/cloudfront");
const obtainDomains_1 = __importDefault(require("./lib/obtainDomains"));
const constants_1 = require("./constants");
const child_process_1 = require("child_process");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const removeLambdaVersions_1 = require("@sls-next/aws-lambda/dist/removeLambdaVersions");
const SKIPPED_DEPLOY = "SKIPPED_DEPLOY";
class NextjsComponent extends core_1.Component {
    async default(inputs = {}) {
        this.initialize();
        if (inputs.build !== false) {
            await this.build(inputs);
            this.postBuild(inputs);
        }
        return this.deploy(inputs);
    }
    initialize() {
        var _a;
        if (this.context.instance.debugMode) {
            Error.stackTraceLimit = 100;
        }
        if (aws_sdk_1.default === null || aws_sdk_1.default === void 0 ? void 0 : aws_sdk_1.default.config) {
            aws_sdk_1.default.config.update({
                maxRetries: parseInt((_a = process.env.SLS_NEXT_MAX_RETRIES) !== null && _a !== void 0 ? _a : "10"),
                retryDelayOptions: { base: 200 }
            });
        }
    }
    readDefaultBuildManifest(nextConfigPath) {
        return (0, fs_extra_1.readJSON)((0, path_1.join)(nextConfigPath, ".serverless_nextjs/default-lambda/manifest.json"));
    }
    readRoutesManifest(nextConfigPath) {
        return (0, fs_extra_1.readJSON)((0, path_1.join)(nextConfigPath, ".next/routes-manifest.json"));
    }
    pathPattern(pattern, routesManifest) {
        const basePath = routesManifest.basePath;
        return basePath && basePath.length > 0
            ? `${basePath.slice(1)}/${pattern}`
            : pattern;
    }
    validatePathPatterns(pathPatterns, buildManifest, routesManifest) {
        const stillToMatch = new Set(pathPatterns);
        if (stillToMatch.size !== pathPatterns.length) {
            throw Error("Duplicate path declared in cloudfront configuration");
        }
        stillToMatch.delete(this.pathPattern("api/*", routesManifest));
        stillToMatch.delete(this.pathPattern("static/*", routesManifest));
        stillToMatch.delete(this.pathPattern("_next/static/*", routesManifest));
        stillToMatch.delete(this.pathPattern("_next/data/*", routesManifest));
        stillToMatch.delete(this.pathPattern("_next/image*", routesManifest));
        for (const path of stillToMatch) {
            if (/^(\/?api\/.*|\/?api)$/.test(path)) {
                stillToMatch.delete(path);
            }
        }
        const manifestRegex = [];
        const manifestPaths = new Set();
        const dynamic = buildManifest.pages.dynamic || [];
        const ssrNonDynamic = buildManifest.pages.ssr.nonDynamic || {};
        const htmlNonDynamic = buildManifest.pages.html.nonDynamic || {};
        dynamic.map(({ regex }) => {
            manifestRegex.push(new RegExp(regex));
        });
        Object.entries({
            ...ssrNonDynamic,
            ...htmlNonDynamic
        }).map(([path]) => {
            manifestPaths.add(path);
        });
        manifestRegex.forEach((re) => {
            for (const path of stillToMatch) {
                if (re.test(path)) {
                    stillToMatch.delete(path);
                }
            }
        });
        for (const pathToMatch of stillToMatch) {
            for (const path of manifestPaths) {
                if (new RegExp(pathToMatch).test(path)) {
                    stillToMatch.delete(pathToMatch);
                }
            }
        }
        if (stillToMatch.size > 0) {
            this.context.debug("There are other CloudFront path inputs that are not next.js pages, which will be added as custom behaviors.");
        }
    }
    async readApiBuildManifest(nextConfigPath) {
        const path = (0, path_1.join)(nextConfigPath, ".serverless_nextjs/api-lambda/manifest.json");
        return (await (0, fs_extra_1.pathExists)(path))
            ? (0, fs_extra_1.readJSON)(path)
            : Promise.resolve(undefined);
    }
    async readImageBuildManifest(nextConfigPath) {
        const path = (0, path_1.join)(nextConfigPath, ".serverless_nextjs/image-lambda/manifest.json");
        return (await (0, fs_extra_1.pathExists)(path))
            ? (0, fs_extra_1.readJSON)(path)
            : Promise.resolve(undefined);
    }
    async build(inputs = {}) {
        var _a, _b, _c, _d, _e, _f, _g;
        const nextConfigPath = inputs.nextConfigDir
            ? (0, path_1.resolve)(inputs.nextConfigDir)
            : process.cwd();
        const nextStaticPath = inputs.nextStaticDir
            ? (0, path_1.resolve)(inputs.nextStaticDir)
            : nextConfigPath;
        const buildCwd = typeof inputs.build === "boolean" ||
            typeof inputs.build === "undefined" ||
            !inputs.build.cwd
            ? nextConfigPath
            : (0, path_1.resolve)(inputs.build.cwd);
        const buildBaseDir = typeof inputs.build === "boolean" ||
            typeof inputs.build === "undefined" ||
            !inputs.build.baseDir
            ? nextConfigPath
            : (0, path_1.resolve)(inputs.build.baseDir);
        const buildConfig = {
            enabled: inputs.build
                ?
                    inputs.build !== false &&
                        inputs.build.enabled !== false &&
                        inputs.build.enabled !== "false"
                : true,
            cmd: "node_modules/.bin/next",
            args: ["build"],
            ...(typeof inputs.build === "object" ? inputs.build : {}),
            cwd: buildCwd,
            baseDir: buildBaseDir,
            cleanupDotNext: (_b = (_a = inputs.build) === null || _a === void 0 ? void 0 : _a.cleanupDotNext) !== null && _b !== void 0 ? _b : true
        };
        if (buildConfig.enabled) {
            const builder = new lambda_at_edge_1.Builder(nextConfigPath, (0, path_1.join)(nextConfigPath, ".serverless_nextjs"), {
                cmd: buildConfig.cmd,
                cwd: buildConfig.cwd,
                env: buildConfig.env,
                args: buildConfig.args,
                useServerlessTraceTarget: inputs.useServerlessTraceTarget || false,
                logLambdaExecutionTimes: inputs.logLambdaExecutionTimes || false,
                domainRedirects: inputs.domainRedirects || {},
                minifyHandlers: inputs.minifyHandlers || false,
                enableHTTPCompression: false,
                handler: inputs.handler
                    ? `${inputs.handler.split(".")[0]}.js`
                    : undefined,
                authentication: (_c = inputs.authentication) !== null && _c !== void 0 ? _c : undefined,
                baseDir: buildConfig.baseDir,
                cleanupDotNext: buildConfig.cleanupDotNext,
                assetIgnorePatterns: buildConfig.assetIgnorePatterns,
                regenerationQueueName: (_d = inputs.sqs) === null || _d === void 0 ? void 0 : _d.name,
                separateApiLambda: (_e = buildConfig.separateApiLambda) !== null && _e !== void 0 ? _e : true,
                disableOriginResponseHandler: (_f = buildConfig.disableOriginResponseHandler) !== null && _f !== void 0 ? _f : false,
                useV2Handler: (_g = buildConfig.useV2Handler) !== null && _g !== void 0 ? _g : false
            }, nextStaticPath);
            await builder.build(this.context.instance.debugMode);
        }
    }
    postBuild(inputs) {
        var _a;
        const buildOptions = inputs.build;
        const postBuildCommands = (_a = buildOptions === null || buildOptions === void 0 ? void 0 : buildOptions.postBuildCommands) !== null && _a !== void 0 ? _a : [];
        for (const command of postBuildCommands) {
            (0, child_process_1.execSync)(command, { stdio: "inherit" });
        }
    }
    async deploy(inputs = {}) {
        var _a, _b, _c, _d, _e, _f;
        if (inputs.deploy === "false" || inputs.deploy === false) {
            return {
                appUrl: SKIPPED_DEPLOY,
                bucketName: SKIPPED_DEPLOY,
                distributionId: SKIPPED_DEPLOY
            };
        }
        const nextConfigPath = inputs.nextConfigDir
            ? (0, path_1.resolve)(inputs.nextConfigDir)
            : process.cwd();
        const nextStaticPath = inputs.nextStaticDir
            ? (0, path_1.resolve)(inputs.nextStaticDir)
            : nextConfigPath;
        const { defaults: cloudFrontDefaultsInputs, origins: cloudFrontOriginsInputs, aliases: cloudFrontAliasesInputs, priceClass: cloudFrontPriceClassInputs, errorPages: cloudFrontErrorPagesInputs, distributionId: cloudFrontDistributionId = null, comment: cloudFrontComment, webACLId: cloudFrontWebACLId, restrictions: cloudFrontRestrictions, certificate: cloudFrontCertificate, originAccessIdentityId: cloudFrontOriginAccessIdentityId, paths: cloudFrontPaths, waitBeforeInvalidate: cloudFrontWaitBeforeInvalidate = true, tags: cloudFrontTags, ...cloudFrontOtherInputs } = inputs.cloudfront || {};
        const bucketRegion = inputs.bucketRegion || "us-east-1";
        const [defaultBuildManifest, apiBuildManifest, imageBuildManifest, routesManifest] = await Promise.all([
            this.readDefaultBuildManifest(nextConfigPath),
            this.readApiBuildManifest(nextConfigPath),
            this.readImageBuildManifest(nextConfigPath),
            this.readRoutesManifest(nextConfigPath)
        ]);
        const [bucket, cloudFront, sqs, defaultEdgeLambda, apiEdgeLambda, imageEdgeLambda, regenerationLambda] = await Promise.all([
            this.load("@sls-next/aws-s3"),
            this.load("@sls-next/aws-cloudfront"),
            this.load("@sls-next/aws-sqs"),
            this.load("@sls-next/aws-lambda", "defaultEdgeLambda"),
            this.load("@sls-next/aws-lambda", "apiEdgeLambda"),
            this.load("@sls-next/aws-lambda", "imageEdgeLambda"),
            this.load("@sls-next/aws-lambda", "regenerationLambda")
        ]);
        const bucketOutputs = await bucket({
            accelerated: (_a = inputs.enableS3Acceleration) !== null && _a !== void 0 ? _a : true,
            name: inputs.bucketName,
            region: bucketRegion,
            tags: inputs.bucketTags
        });
        await (0, s3_static_assets_1.deleteOldStaticAssets)({
            bucketName: bucketOutputs.name,
            bucketRegion: bucketRegion,
            basePath: routesManifest.basePath,
            credentials: this.context.credentials.aws
        });
        await (0, s3_static_assets_1.uploadStaticAssetsFromBuild)({
            bucketName: bucketOutputs.name,
            bucketRegion: bucketRegion,
            basePath: routesManifest.basePath,
            nextConfigDir: nextConfigPath,
            nextStaticDir: nextStaticPath,
            credentials: this.context.credentials.aws,
            publicDirectoryCache: inputs.publicDirectoryCache
        });
        const bucketUrl = `http://${bucketOutputs.name}.s3.${bucketRegion}.amazonaws.com`;
        const expandRelativeUrls = (origin) => {
            const originUrl = typeof origin === "string" ? origin : origin.url;
            const fullOriginUrl = originUrl.charAt(0) === "/" ? `${bucketUrl}${originUrl}` : originUrl;
            if (typeof origin === "string") {
                return fullOriginUrl;
            }
            else {
                return {
                    ...origin,
                    url: fullOriginUrl
                };
            }
        };
        let inputOrigins = [];
        if (cloudFrontOriginsInputs) {
            const origins = cloudFrontOriginsInputs;
            inputOrigins = origins.map(expandRelativeUrls);
        }
        const cloudFrontOrigins = [
            {
                url: bucketUrl,
                private: true,
                pathPatterns: {}
            },
            ...inputOrigins
        ];
        cloudFrontOrigins[0].pathPatterns[this.pathPattern("_next/static/*", routesManifest)] = {
            minTTL: 0,
            defaultTTL: 86400,
            maxTTL: 31536000,
            forward: {
                headers: "none",
                cookies: "none",
                queryString: false
            }
        };
        cloudFrontOrigins[0].pathPatterns[this.pathPattern("static/*", routesManifest)] = {
            minTTL: 0,
            defaultTTL: 86400,
            maxTTL: 31536000,
            forward: {
                headers: "none",
                cookies: "none",
                queryString: false
            }
        };
        const buildOptions = ((_b = inputs.build) !== null && _b !== void 0 ? _b : {});
        const hasSeparateApiLambdaOption = (_c = (!buildOptions.useV2Handler && buildOptions.separateApiLambda)) !== null && _c !== void 0 ? _c : true;
        const hasSeparateAPIPages = hasSeparateApiLambdaOption &&
            apiBuildManifest &&
            (Object.keys(apiBuildManifest.apis.nonDynamic).length > 0 ||
                Object.keys(apiBuildManifest.apis.dynamic).length > 0);
        const hasConsolidatedApiPages = !hasSeparateApiLambdaOption && defaultBuildManifest.hasApiPages;
        const hasISRPages = Object.keys(defaultBuildManifest.pages.ssg.nonDynamic).some((key) => typeof defaultBuildManifest.pages.ssg.nonDynamic[key]
            .initialRevalidateSeconds === "number");
        const hasDynamicISRPages = Object.keys(defaultBuildManifest.pages.ssg.dynamic).some((key) => defaultBuildManifest.pages.ssg.dynamic[key].fallback !== false);
        const readLambdaInputValue = (inputKey, lambdaType, defaultValue) => {
            const inputValue = inputs[inputKey];
            if (typeof inputValue === "string" || typeof inputValue === "number") {
                if (inputKey === "name") {
                    throw new Error("Name cannot be specified across all Lambdas as it will cause conflicts.");
                }
                return inputValue;
            }
            if (!inputValue) {
                return defaultValue;
            }
            return inputValue[lambdaType] || defaultValue;
        };
        let queue;
        if (hasISRPages || hasDynamicISRPages) {
            queue = await sqs({
                name: (_e = (_d = inputs.sqs) === null || _d === void 0 ? void 0 : _d.name) !== null && _e !== void 0 ? _e : `${bucketOutputs.name}.fifo`,
                deduplicationScope: "messageGroup",
                fifoThroughputLimit: "perMessageGroupId",
                visibilityTimeout: "30",
                fifoQueue: true,
                region: bucketRegion,
                tags: (_f = inputs.sqs) === null || _f === void 0 ? void 0 : _f.tags
            });
        }
        const defaultLambdaPolicy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Resource: "*",
                    Action: [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ]
                },
                {
                    Effect: "Allow",
                    Resource: `arn:aws:s3:::${bucketOutputs.name}/*`,
                    Action: ["s3:GetObject", "s3:PutObject"]
                },
                ...(queue
                    ? [
                        {
                            Effect: "Allow",
                            Resource: queue.arn,
                            Action: ["sqs:SendMessage"]
                        }
                    ]
                    : [])
            ]
        };
        let policy = defaultLambdaPolicy;
        if (inputs.policy) {
            if (typeof inputs.policy === "string") {
                policy = { arn: inputs.policy };
            }
            else {
                policy = inputs.policy;
            }
        }
        let regenerationLambdaResult = undefined;
        if (hasISRPages || hasDynamicISRPages) {
            const regenerationLambdaInput = {
                region: bucketRegion,
                description: inputs.description
                    ? `${inputs.description} (Regeneration)`
                    : "Next.js Regeneration Lambda",
                handler: inputs.handler || "index.handler",
                code: (0, path_1.join)(nextConfigPath, constants_1.REGENERATION_LAMBDA_CODE_DIR),
                role: readLambdaInputValue("roleArn", "regenerationLambda", undefined)
                    ? {
                        arn: readLambdaInputValue("roleArn", "regenerationLambda", undefined)
                    }
                    : {
                        service: ["lambda.amazonaws.com"],
                        policy: {
                            ...defaultLambdaPolicy,
                            Statement: [
                                ...defaultLambdaPolicy.Statement,
                                {
                                    Effect: "Allow",
                                    Resource: queue.arn,
                                    Action: [
                                        "sqs:ReceiveMessage",
                                        "sqs:DeleteMessage",
                                        "sqs:GetQueueAttributes"
                                    ]
                                }
                            ]
                        }
                    },
                memory: readLambdaInputValue("memory", "regenerationLambda", 512),
                timeout: readLambdaInputValue("timeout", "regenerationLambda", 10),
                runtime: readLambdaInputValue("runtime", "regenerationLambda", "nodejs14.x"),
                name: readLambdaInputValue("name", "regenerationLambda", bucketOutputs.name),
                tags: readLambdaInputValue("tags", "regenerationLambda", undefined)
            };
            regenerationLambdaResult = await regenerationLambda(regenerationLambdaInput);
            await regenerationLambda.publishVersion();
            await sqs.addEventSource(regenerationLambdaResult.name);
        }
        let apiEdgeLambdaOutputs = undefined;
        if (hasSeparateAPIPages) {
            const apiEdgeLambdaInput = {
                description: inputs.description
                    ? `${inputs.description} (API)`
                    : "API Lambda@Edge for Next CloudFront distribution",
                handler: inputs.handler || "index.handler",
                code: (0, path_1.join)(nextConfigPath, constants_1.API_LAMBDA_CODE_DIR),
                role: readLambdaInputValue("roleArn", "apiLambda", undefined)
                    ? {
                        arn: readLambdaInputValue("roleArn", "apiLambda", undefined)
                    }
                    : {
                        service: ["lambda.amazonaws.com", "edgelambda.amazonaws.com"],
                        policy
                    },
                memory: readLambdaInputValue("memory", "apiLambda", 512),
                timeout: readLambdaInputValue("timeout", "apiLambda", 10),
                runtime: readLambdaInputValue("runtime", "apiLambda", "nodejs14.x"),
                name: readLambdaInputValue("name", "apiLambda", undefined),
                tags: readLambdaInputValue("tags", "apiLambda", undefined)
            };
            apiEdgeLambdaOutputs = await apiEdgeLambda(apiEdgeLambdaInput);
            const apiEdgeLambdaPublishOutputs = await apiEdgeLambda.publishVersion();
            cloudFrontOrigins[0].pathPatterns[this.pathPattern("api/*", routesManifest)] = {
                minTTL: 0,
                defaultTTL: 0,
                maxTTL: 31536000,
                allowedHttpMethods: [
                    "HEAD",
                    "DELETE",
                    "POST",
                    "GET",
                    "OPTIONS",
                    "PUT",
                    "PATCH"
                ],
                forward: {
                    headers: routesManifest.i18n
                        ? ["Accept-Language", "Authorization", "Host"]
                        : ["Authorization", "Host"],
                    cookies: "all",
                    queryString: true
                },
                "lambda@edge": {
                    "origin-request": `${apiEdgeLambdaOutputs.arn}:${apiEdgeLambdaPublishOutputs.version}`
                }
            };
        }
        let imageEdgeLambdaOutputs = undefined;
        if (imageBuildManifest) {
            const imageEdgeLambdaInput = {
                description: inputs.description
                    ? `${inputs.description} (Image)`
                    : "Image Lambda@Edge for Next CloudFront distribution",
                handler: inputs.handler || "index.handler",
                code: (0, path_1.join)(nextConfigPath, constants_1.IMAGE_LAMBDA_CODE_DIR),
                role: readLambdaInputValue("roleArn", "imageLambda", undefined)
                    ? {
                        arn: readLambdaInputValue("roleArn", "imageLambda", undefined)
                    }
                    : {
                        service: ["lambda.amazonaws.com", "edgelambda.amazonaws.com"],
                        policy
                    },
                memory: readLambdaInputValue("memory", "imageLambda", 512),
                timeout: readLambdaInputValue("timeout", "imageLambda", 10),
                runtime: readLambdaInputValue("runtime", "imageLambda", "nodejs14.x"),
                name: readLambdaInputValue("name", "imageLambda", undefined),
                tags: readLambdaInputValue("tags", "imageLambda", undefined)
            };
            imageEdgeLambdaOutputs = await imageEdgeLambda(imageEdgeLambdaInput);
            const imageEdgeLambdaPublishOutputs = await imageEdgeLambda.publishVersion();
            cloudFrontOrigins[0].pathPatterns[this.pathPattern("_next/image*", routesManifest)] = {
                minTTL: 0,
                defaultTTL: 60,
                maxTTL: 31536000,
                allowedHttpMethods: [
                    "HEAD",
                    "DELETE",
                    "POST",
                    "GET",
                    "OPTIONS",
                    "PUT",
                    "PATCH"
                ],
                forward: {
                    headers: ["Accept"]
                },
                "lambda@edge": {
                    "origin-request": `${imageEdgeLambdaOutputs.arn}:${imageEdgeLambdaPublishOutputs.version}`
                }
            };
        }
        const defaultEdgeLambdaInput = {
            description: inputs.description ||
                "Default Lambda@Edge for Next CloudFront distribution",
            handler: inputs.handler || "index.handler",
            code: (0, path_1.join)(nextConfigPath, constants_1.DEFAULT_LAMBDA_CODE_DIR),
            role: readLambdaInputValue("roleArn", "defaultLambda", undefined)
                ? {
                    arn: readLambdaInputValue("roleArn", "defaultLambda", undefined)
                }
                : {
                    service: ["lambda.amazonaws.com", "edgelambda.amazonaws.com"],
                    policy
                },
            memory: readLambdaInputValue("memory", "defaultLambda", 512),
            timeout: readLambdaInputValue("timeout", "defaultLambda", 10),
            runtime: readLambdaInputValue("runtime", "defaultLambda", "nodejs14.x"),
            name: readLambdaInputValue("name", "defaultLambda", undefined),
            tags: readLambdaInputValue("tags", "defaultLambda", undefined)
        };
        const defaultEdgeLambdaOutputs = await defaultEdgeLambda(defaultEdgeLambdaInput);
        const defaultEdgeLambdaPublishOutputs = await defaultEdgeLambda.publishVersion();
        cloudFrontOrigins[0].pathPatterns[this.pathPattern("_next/data/*", routesManifest)] = {
            minTTL: 0,
            defaultTTL: 0,
            maxTTL: 31536000,
            allowedHttpMethods: ["HEAD", "GET"],
            forward: {
                cookies: "all",
                headers: ["Authorization", "Host"],
                queryString: true
            },
            "lambda@edge": buildOptions.disableOriginResponseHandler
                ? {
                    "origin-request": `${defaultEdgeLambdaOutputs.arn}:${defaultEdgeLambdaPublishOutputs.version}`
                }
                : {
                    "origin-request": `${defaultEdgeLambdaOutputs.arn}:${defaultEdgeLambdaPublishOutputs.version}`,
                    "origin-response": `${defaultEdgeLambdaOutputs.arn}:${defaultEdgeLambdaPublishOutputs.version}`
                }
        };
        if (hasConsolidatedApiPages) {
            cloudFrontOrigins[0].pathPatterns[this.pathPattern("api/*", routesManifest)] = {
                minTTL: 0,
                defaultTTL: 0,
                maxTTL: 31536000,
                allowedHttpMethods: [
                    "HEAD",
                    "DELETE",
                    "POST",
                    "GET",
                    "OPTIONS",
                    "PUT",
                    "PATCH"
                ],
                forward: {
                    headers: routesManifest.i18n
                        ? ["Accept-Language", "Authorization", "Host"]
                        : ["Authorization", "Host"],
                    cookies: "all",
                    queryString: true
                },
                "lambda@edge": {
                    "origin-request": `${defaultEdgeLambdaOutputs.arn}:${defaultEdgeLambdaPublishOutputs.version}`
                }
            };
        }
        this.validatePathPatterns(Object.keys(cloudFrontOtherInputs), defaultBuildManifest, routesManifest);
        Object.entries(cloudFrontOtherInputs).map(([path, config]) => {
            const edgeConfig = {
                ...(config["lambda@edge"] || {})
            };
            if (path === this.pathPattern("api/*", routesManifest) ||
                path === this.pathPattern("_next/image*", routesManifest)) {
                delete edgeConfig["origin-request"];
            }
            else if (!["static/*", "_next/static/*", "_next/*"].includes(path)) {
                edgeConfig["origin-request"] = `${defaultEdgeLambdaOutputs.arn}:${defaultEdgeLambdaPublishOutputs.version}`;
            }
            cloudFrontOrigins[0].pathPatterns[path] = {
                ...cloudFrontOrigins[0].pathPatterns[path],
                ...config,
                "lambda@edge": {
                    ...(cloudFrontOrigins[0].pathPatterns[path] &&
                        cloudFrontOrigins[0].pathPatterns[path]["lambda@edge"]),
                    ...edgeConfig
                }
            };
        });
        const cloudFrontDefaults = cloudFrontDefaultsInputs || {};
        const defaultLambdaAtEdgeConfig = {
            ...(cloudFrontDefaults["lambda@edge"] || {})
        };
        delete defaultLambdaAtEdgeConfig["origin-response"];
        const cloudFrontOutputs = await cloudFront({
            bucketRegion: bucketRegion,
            distributionId: cloudFrontDistributionId,
            defaults: {
                minTTL: 0,
                defaultTTL: 0,
                maxTTL: 31536000,
                ...cloudFrontDefaults,
                forward: {
                    headers: routesManifest.i18n
                        ? ["Accept-Language", "Authorization", "Host"]
                        : ["Authorization", "Host"],
                    cookies: "all",
                    queryString: true,
                    ...cloudFrontDefaults.forward
                },
                allowedHttpMethods: [
                    "HEAD",
                    "DELETE",
                    "POST",
                    "GET",
                    "OPTIONS",
                    "PUT",
                    "PATCH"
                ],
                "lambda@edge": buildOptions.disableOriginResponseHandler
                    ? {
                        ...defaultLambdaAtEdgeConfig,
                        "origin-request": `${defaultEdgeLambdaOutputs.arn}:${defaultEdgeLambdaPublishOutputs.version}`
                    }
                    : {
                        ...defaultLambdaAtEdgeConfig,
                        "origin-request": `${defaultEdgeLambdaOutputs.arn}:${defaultEdgeLambdaPublishOutputs.version}`,
                        "origin-response": `${defaultEdgeLambdaOutputs.arn}:${defaultEdgeLambdaPublishOutputs.version}`
                    },
                compress: true
            },
            origins: cloudFrontOrigins,
            ...(cloudFrontAliasesInputs && {
                aliases: cloudFrontAliasesInputs
            }),
            ...(cloudFrontPriceClassInputs && {
                priceClass: cloudFrontPriceClassInputs
            }),
            ...(cloudFrontErrorPagesInputs && {
                errorPages: cloudFrontErrorPagesInputs
            }),
            comment: cloudFrontComment,
            webACLId: cloudFrontWebACLId,
            restrictions: cloudFrontRestrictions,
            certificate: cloudFrontCertificate,
            originAccessIdentityId: cloudFrontOriginAccessIdentityId,
            tags: cloudFrontTags
        });
        let appUrl = cloudFrontOutputs.url;
        const distributionId = cloudFrontOutputs.id;
        if (!cloudFrontPaths || cloudFrontPaths.length) {
            const waitDuration = 600;
            const pollInterval = 10;
            if (cloudFrontWaitBeforeInvalidate) {
                this.context.debug(`Waiting for CloudFront distribution ${distributionId} to be ready before invalidations, for up to ${waitDuration} seconds, checking every ${pollInterval} seconds.`);
                await (0, cloudfront_1.checkCloudFrontDistributionReady)({
                    distributionId: distributionId,
                    credentials: this.context.credentials.aws,
                    waitDuration: waitDuration,
                    pollInterval: pollInterval
                });
            }
            else {
                this.context.debug(`Skipped waiting for CloudFront distribution ${distributionId} to be ready.`);
            }
            this.context.debug(`Creating invalidations on ${distributionId}.`);
            await (0, cloudfront_1.createInvalidation)({
                distributionId: distributionId,
                credentials: this.context.credentials.aws,
                paths: cloudFrontPaths
            });
        }
        else {
            this.context.debug(`No invalidations needed for ${distributionId}.`);
        }
        const { domain, subdomain } = (0, obtainDomains_1.default)(inputs.domain);
        if (domain && subdomain) {
            const domainComponent = await this.load("@sls-next/domain");
            const domainOutputs = await domainComponent({
                privateZone: false,
                domain,
                subdomains: {
                    [subdomain]: cloudFrontOutputs
                },
                domainType: inputs.domainType || "both",
                defaultCloudfrontInputs: cloudFrontDefaults,
                certificateArn: inputs.certificateArn,
                domainMinimumProtocolVersion: inputs.domainMinimumProtocolVersion
            });
            appUrl = domainOutputs.domains[0];
        }
        if (inputs.removeOldLambdaVersions) {
            this.context.debug("Removing old lambda versions...");
            await Promise.all([
                await (0, removeLambdaVersions_1.removeLambdaVersions)(this.context, defaultEdgeLambdaOutputs.arn, defaultEdgeLambdaOutputs.region),
                apiEdgeLambdaOutputs
                    ? await (0, removeLambdaVersions_1.removeLambdaVersions)(this.context, apiEdgeLambdaOutputs.arn, apiEdgeLambdaOutputs.region)
                    : Promise.resolve(),
                imageEdgeLambdaOutputs
                    ? await (0, removeLambdaVersions_1.removeLambdaVersions)(this.context, imageEdgeLambdaOutputs.arn, imageEdgeLambdaOutputs.region)
                    : Promise.resolve(),
                regenerationLambdaResult
                    ? await (0, removeLambdaVersions_1.removeLambdaVersions)(this.context, regenerationLambdaResult.arn, regenerationLambdaResult.region)
                    : Promise.resolve()
            ]);
        }
        return {
            appUrl,
            bucketName: bucketOutputs.name,
            distributionId: cloudFrontOutputs.id
        };
    }
    async remove() {
        const [bucket, cloudfront, sqs, domain] = await Promise.all([
            this.load("@sls-next/aws-s3"),
            this.load("@sls-next/aws-cloudfront"),
            this.load("@sls-next/aws-sqs"),
            this.load("@sls-next/domain")
        ]);
        await bucket.remove();
        await cloudfront.remove();
        await domain.remove();
        await sqs.remove();
    }
}
exports.default = NextjsComponent;
