import { Component } from "@serverless/core";
import type { OriginRequestDefaultHandlerManifest as BuildManifest, OriginRequestDefaultHandlerManifest, OriginRequestApiHandlerManifest, RoutesManifest, OriginRequestImageHandlerManifest } from "@sls-next/lambda-at-edge";
import type { ServerlessComponentInputs } from "../types";
export type DeploymentResult = {
    appUrl: string;
    bucketName: string;
    distributionId: string;
};
declare class NextjsComponent extends Component {
    default(inputs?: ServerlessComponentInputs): Promise<DeploymentResult>;
    initialize(): void;
    readDefaultBuildManifest(nextConfigPath: string): Promise<OriginRequestDefaultHandlerManifest>;
    readRoutesManifest(nextConfigPath: string): Promise<RoutesManifest>;
    pathPattern(pattern: string, routesManifest: RoutesManifest): string;
    validatePathPatterns(pathPatterns: string[], buildManifest: BuildManifest, routesManifest: RoutesManifest): void;
    readApiBuildManifest(nextConfigPath: string): Promise<OriginRequestApiHandlerManifest>;
    readImageBuildManifest(nextConfigPath: string): Promise<OriginRequestImageHandlerManifest>;
    build(inputs?: ServerlessComponentInputs): Promise<void>;
    postBuild(inputs: ServerlessComponentInputs): void;
    deploy(inputs?: ServerlessComponentInputs): Promise<DeploymentResult>;
    remove(): Promise<void>;
}
export default NextjsComponent;
