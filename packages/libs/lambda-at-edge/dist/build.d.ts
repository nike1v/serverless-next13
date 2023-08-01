/// <reference types="node" />
import { NodeFileTraceReasons } from "@vercel/nft";
import { OriginRequestDefaultHandlerManifest, OriginRequestApiHandlerManifest, RoutesManifest, OriginRequestImageHandlerManifest } from "./types";
import { Job } from "@vercel/nft/out/node-file-trace";
import { NextConfig } from "@sls-next/core";
export declare const DEFAULT_LAMBDA_CODE_DIR = "default-lambda";
export declare const API_LAMBDA_CODE_DIR = "api-lambda";
export declare const IMAGE_LAMBDA_CODE_DIR = "image-lambda";
export declare const REGENERATION_LAMBDA_CODE_DIR = "regeneration-lambda";
export declare const ASSETS_DIR = "assets";
type BuildOptions = {
    args?: string[];
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    cmd?: string;
    useServerlessTraceTarget?: boolean;
    logLambdaExecutionTimes?: boolean;
    domainRedirects?: {
        [key: string]: string;
    };
    minifyHandlers?: boolean;
    enableHTTPCompression?: boolean;
    handler?: string;
    authentication?: {
        username: string;
        password: string;
    } | undefined;
    resolve?: (id: string, parent: string, job: Job, cjsResolve: boolean) => Promise<string | string[]>;
    baseDir?: string;
    cleanupDotNext?: boolean;
    assetIgnorePatterns?: string[];
    regenerationQueueName?: string;
    separateApiLambda?: boolean;
    disableOriginResponseHandler?: boolean;
    useV2Handler?: boolean;
};
declare class Builder {
    nextConfigDir: string;
    nextStaticDir: string;
    dotNextDir: string;
    serverDir: string;
    outputDir: string;
    buildOptions: BuildOptions;
    constructor(nextConfigDir: string, outputDir: string, buildOptions?: BuildOptions, nextStaticDir?: string);
    readPublicFiles(assetIgnorePatterns: string[]): Promise<string[]>;
    readPagesManifest(): Promise<{
        [key: string]: string;
    }>;
    copyLambdaHandlerDependencies(fileList: string[], reasons: NodeFileTraceReasons, handlerDirectory: string, base: string): Promise<void>[];
    isSSRJSFile(buildManifest: OriginRequestDefaultHandlerManifest, relativePageFile: string): boolean;
    processAndCopyRoutesManifest(source: string, destination: string): Promise<void>;
    processAndCopyHandler(handlerType: "api-handler" | "default-handler" | "image-handler" | "regeneration-handler" | "default-handler-v2" | "regeneration-handler-v2", destination: string, shouldMinify: boolean): Promise<void>;
    copyTraces(buildManifest: OriginRequestDefaultHandlerManifest, destination: string): Promise<void>;
    buildDefaultLambda(buildManifest: OriginRequestDefaultHandlerManifest, apiBuildManifest: OriginRequestApiHandlerManifest, separateApiLambda: boolean, useV2Handler: boolean): Promise<void[]>;
    buildApiLambda(apiBuildManifest: OriginRequestApiHandlerManifest): Promise<void[]>;
    buildRegenerationHandler(buildManifest: OriginRequestDefaultHandlerManifest, useV2Handler: boolean): Promise<void>;
    copyChunks(handlerDir: string): Promise<void>;
    copyJSFiles(handlerDir: string): Promise<void>;
    buildImageLambda(buildManifest: OriginRequestImageHandlerManifest): Promise<void>;
    readNextConfig(): Promise<NextConfig | undefined>;
    buildStaticAssets(defaultBuildManifest: OriginRequestDefaultHandlerManifest, routesManifest: RoutesManifest, ignorePatterns: string[]): Promise<[void, ...void[]]>;
    cleanupDotNext(shouldClean: boolean): Promise<void>;
    build(debugMode?: boolean): Promise<void>;
    runThirdPartyIntegrations(defaultLambdaDir: string, regenerationLambdaDir: string): Promise<void>;
}
export default Builder;
